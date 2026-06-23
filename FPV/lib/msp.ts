// FTOS — читання даних з польотного контролера по USB через Web Serial + MSP.
// Тільки desktop Chromium (Chrome/Edge). На телефоні Web Serial недоступний.
//
// ЧЕСНА МЕЖА: читаємо лише те, що парситься надійно незалежно від версії BF —
// варіант прошивки, версію, API, ідентифікатор плати й target. Arming-прапори/порти
// мають версійно-залежні офсети, тому свідомо НЕ декодуємо без звірки на залізі.

export interface MspIdentity {
  apiVersion: string; // "1.46"
  fcVariant: string; // "BTFL" / "INAV"
  fcVersion: string; // "4.5.1"
  boardIdentifier: string; // "SBF4"
  targetName: string; // "SPEEDYBEEF405V4" (best-effort)
}

const CMD = { API_VERSION: 1, FC_VARIANT: 2, FC_VERSION: 3, BOARD_INFO: 4, STATUS_EX: 150 } as const;

// --- Живий стан плати (MSP_STATUS_EX, cmd 150) ---
// ЧЕСНА МЕЖА (див. вгорі): декодуємо лише те, що стабільне між версіями BF.
// Сенсорний бітмаск завжди на офсеті 4..5 — це безпечно. Arming-прапори йдуть
// після версійно-залежного блоку, але з явним префіксом довжини, тож читаються
// послідовно; якщо офсет «попливе» — позначаємо ненадійним і не вгадуємо.
export interface MspSensors {
  gyro: boolean;
  acc: boolean;
  baro: boolean;
  mag: boolean;
  gps: boolean;
  sonar: boolean;
}

export interface MspStatus {
  sensors: MspSensors;
  armingReady: boolean; // жоден прапор не блокує арм (за прочитаним)
  armingFlagsRaw: number; // сире 32-бітне значення (для звірки)
  armingReasons: string[]; // best-effort назви активних прапорів
  armingReliable: boolean; // false → офсет/значення підозрілі, не довіряй назвам
}

function rdU16(b: Uint8Array, i: number): number {
  return b[i] | (b[i + 1] << 8);
}
function rdU32(b: Uint8Array, i: number): number {
  return (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
}

// Бітмаск сенсорів MSP (стабільний між версіями):
// bit0 ACC, bit1 BARO, bit2 MAG, bit3 GPS, bit4 RANGEFINDER, bit5 GYRO.
export function parseSensors(flags: number): MspSensors {
  return {
    acc: !!(flags & 1),
    baro: !!(flags & 2),
    mag: !!(flags & 4),
    gps: !!(flags & 8),
    sonar: !!(flags & 16),
    gyro: !!(flags & 32),
  };
}

// Назви прапорів заборони арму (порядок BF 4.2–4.5). Версійно-залежне → best-effort.
const ARMING_FLAG_NAMES = [
  'NO_GYRO', 'FAILSAFE', 'RX_FAILSAFE', 'BAD_RX_RECOVERY', 'BOXFAILSAFE',
  'RUNAWAY_TAKEOFF', 'CRASH_DETECTED', 'THROTTLE', 'ANGLE', 'BOOT_GRACE_TIME',
  'NOPREARM', 'LOAD', 'CALIBRATING', 'CLI', 'CMS_MENU', 'BST', 'MSP', 'PARALYZE',
  'GPS', 'RESC', 'RPMFILTER', 'REBOOT_REQUIRED', 'DSHOT_BITBANG', 'ACC_CALIBRATION',
  'MOTOR_PROTOCOL', 'ARM_SWITCH',
] as const;

// MSP_STATUS_EX payload (LE): cycleTime u16, i2cErr u16, sensors u16,
// flightModeFlags u32, pidProfile u8, cpuLoad u16, pidProfileCount u8,
// rateProfile u8, addModeBytesCount u8, [N add bytes], armingDisableCount u8,
// armingDisableFlags u32. Якщо обчислений офсет вилазить за межі або count
// неправдоподібний — повертаємо armingReliable:false (сенсори лишаються валідні).
export function parseStatusEx(b: Uint8Array): MspStatus | null {
  if (b.length < 6) return null;
  const sensors = parseSensors(rdU16(b, 4));

  let armingFlagsRaw = 0;
  let reliable = false;
  const addCountIdx = 15; // після cycleTime/i2c/sensors/mode(u32)/profile/load(u16)/profileCount/rateProfile
  if (b.length > addCountIdx) {
    const addCount = b[addCountIdx];
    const armCountIdx = addCountIdx + 1 + addCount;
    if (armCountIdx + 5 <= b.length) {
      const armingDisableCount = b[armCountIdx];
      if (armingDisableCount >= 1 && armingDisableCount <= 32) {
        armingFlagsRaw = rdU32(b, armCountIdx + 1);
        reliable = true;
      }
    }
  }

  const armingReasons: string[] = [];
  if (reliable) {
    for (let i = 0; i < 32; i++) {
      if (armingFlagsRaw & (1 << i)) armingReasons.push(ARMING_FLAG_NAMES[i] ?? `BIT_${i}`);
    }
  }

  return {
    sensors,
    armingReady: reliable && armingFlagsRaw === 0,
    armingFlagsRaw,
    armingReasons,
    armingReliable: reliable,
  };
}

export function webSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const MAX_BUF = 4096; // стеля буфера — захист від шуму на USB-лінії

export class MspClient {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private buf: number[] = [];
  private pending: Promise<Uint8Array | null> | null = null; // активний read, переживає таймаут

  async connect(): Promise<void> {
    const serial = (navigator as any).serial;
    if (!serial) throw new Error('Web Serial недоступний');
    const port = await serial.requestPort();
    await port.open({ baudRate: 115200 });
    this.port = port;
    try {
      // Якщо взяття writer/reader впаде на півдорозі — не лишаємо порт із залоченими
      // потоками: прибираємо все і пробрасуємо помилку далі.
      this.writer = port.writable.getWriter();
      this.reader = port.readable.getReader();
      this.buf = [];
    } catch (e) {
      await this.disconnect();
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.reader?.cancel();
    } catch {
      /* ignore */
    }
    try {
      this.reader?.releaseLock();
    } catch {
      /* ignore */
    }
    try {
      await this.writer?.close();
    } catch {
      /* ignore */
    }
    try {
      this.writer?.releaseLock();
    } catch {
      /* ignore */
    }
    try {
      await this.port?.close();
    } catch {
      /* ignore */
    }
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.pending = null;
  }

  private buildRequest(cmd: number, payload: number[] = []): Uint8Array {
    const size = payload.length;
    let crc = size ^ cmd;
    for (const b of payload) crc ^= b;
    return new Uint8Array([0x24, 0x4d, 0x3c, size, cmd, ...payload, crc & 0xff]);
  }

  // Витягуємо кадр для заданої команди. Чужі/биті кадри СПОЖИВАЄМО з буфера
  // (інакше при фоновій телеметрії FC буфер ріс би безмежно), ресинхронізуємось
  // по байту '$', а сам буфер обмежений MAX_BUF.
  private tryExtract(cmd: number): Uint8Array | null {
    while (true) {
      // 1) відкинути сміття до першого '$'
      let i = 0;
      while (i < this.buf.length && this.buf[i] !== 0x24) i++;
      if (i > 0) this.buf = this.buf.slice(i);
      if (this.buf.length < 6) break; // мінімум: $ M dir size cmd crc
      if (this.buf[1] !== 0x4d) {
        this.buf = this.buf.slice(1); // '$' без 'M' — зсунутись і шукати далі
        continue;
      }
      const dir = this.buf[2]; // 0x3e '>' відповідь, 0x21 '!' помилка
      const size = this.buf[3];
      const rcmd = this.buf[4];
      const end = 5 + size; // індекс crc
      if (this.buf.length <= end) break; // кадр ще не дочитаний — чекаємо

      const payload = this.buf.slice(5, 5 + size);
      let crc = size ^ rcmd;
      for (const x of payload) crc ^= x;
      if ((crc & 0xff) !== this.buf[end]) {
        this.buf = this.buf.slice(1); // бита crc — ресинк по байту
        continue;
      }
      // валідний кадр — споживаємо повністю
      this.buf = this.buf.slice(end + 1);
      if (rcmd === cmd && dir === 0x3e) return new Uint8Array(payload);
      if (rcmd === cmd && dir === 0x21) {
        throw new Error(`FC відповів помилкою на команду ${cmd}`);
      }
      // інакше — валідний кадр іншої команди: спожитий, шукаємо далі
    }
    if (this.buf.length > MAX_BUF) this.buf = this.buf.slice(this.buf.length - MAX_BUF);
    return null;
  }

  // Читання chunk-а з таймаутом. КЛЮЧОВЕ: при таймауті read НЕ скасовується, а
  // зберігається в this.pending і перевикористовується наступним викликом —
  // інакше орфанний read «з'їдав» би дані для наступної команди.
  private async readChunk(deadline: number): Promise<Uint8Array | null> {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;
    if (!this.pending) {
      this.pending = this.reader.read().then(
        (r: any) => {
          this.pending = null;
          return r.done ? null : (r.value as Uint8Array);
        },
        () => {
          this.pending = null;
          return null;
        },
      );
    }
    const timeout = new Promise<'timeout'>((res) => setTimeout(() => res('timeout'), remaining));
    const result = await Promise.race([this.pending, timeout]);
    return result === 'timeout' ? null : (result as Uint8Array | null);
  }

  async request(cmd: number, timeoutMs = 1500): Promise<Uint8Array> {
    await this.writer.write(this.buildRequest(cmd));
    const deadline = Date.now() + timeoutMs;
    // спершу спробувати з того, що вже в буфері
    const pre = this.tryExtract(cmd);
    if (pre) return pre;
    while (Date.now() < deadline) {
      const chunk = await this.readChunk(deadline);
      if (chunk && chunk.length) {
        for (let i = 0; i < chunk.length; i++) this.buf.push(chunk[i]);
        const frame = this.tryExtract(cmd);
        if (frame) return frame;
      }
    }
    throw new Error(`Таймаут MSP (команда ${cmd}) — плата не відповіла`);
  }

  async readIdentity(): Promise<MspIdentity> {
    const dec = new TextDecoder();

    const api = await this.request(CMD.API_VERSION);
    const apiVersion = api.length >= 3 ? `${api[1]}.${api[2]}` : '—';

    const variant = await this.request(CMD.FC_VARIANT);
    const fcVariant = dec.decode(variant.slice(0, 4)).replace(/\0+$/, '').trim() || '—';

    const ver = await this.request(CMD.FC_VERSION);
    const fcVersion = ver.length >= 3 ? `${ver[0]}.${ver[1]}.${ver[2]}` : '—';

    const board = await this.request(CMD.BOARD_INFO);
    const boardIdentifier = dec.decode(board.slice(0, 4)).replace(/\0+$/, '').trim();
    let targetName = '';
    try {
      // BF 4.x: [boardId(4)][hwRev u16][boardType u8][capabilities u8][len u8][targetName]
      let i = 4 + 2 + 1 + 1;
      if (board.length > i) {
        const len = board[i];
        i += 1;
        if (len > 0 && i + len <= board.length) {
          targetName = dec.decode(board.slice(i, i + len)).replace(/\0+$/, '').trim();
        }
      }
    } catch {
      /* best-effort, лишаємо порожнім */
    }

    return { apiVersion, fcVariant, fcVersion, boardIdentifier, targetName };
  }

  // Живий стан: які сенсори бачить плата + прапори заборони арму (best-effort).
  // Окремий запит — не блокує readIdentity, якщо плата не відповість на 150.
  async readStatus(): Promise<MspStatus | null> {
    const payload = await this.request(CMD.STATUS_EX);
    return parseStatusEx(payload);
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
