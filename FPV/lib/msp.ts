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

const CMD = { API_VERSION: 1, FC_VARIANT: 2, FC_VERSION: 3, BOARD_INFO: 4 } as const;

export function webSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export class MspClient {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private buf: number[] = [];

  async connect(): Promise<void> {
    const serial = (navigator as any).serial;
    if (!serial) throw new Error('Web Serial недоступний');
    const port = await serial.requestPort();
    await port.open({ baudRate: 115200 });
    this.port = port;
    this.writer = port.writable.getWriter();
    this.reader = port.readable.getReader();
    this.buf = [];
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
  }

  private buildRequest(cmd: number, payload: number[] = []): Uint8Array {
    const size = payload.length;
    let crc = size ^ cmd;
    for (const b of payload) crc ^= b;
    return new Uint8Array([0x24, 0x4d, 0x3c, size, cmd, ...payload, crc & 0xff]);
  }

  // Витягуємо повний MSP-кадр для заданої команди з накопиченого буфера.
  private tryExtract(cmd: number): Uint8Array | null {
    const b = this.buf;
    for (let i = 0; i + 5 <= b.length; i++) {
      if (b[i] !== 0x24 || b[i + 1] !== 0x4d) continue; // '$M'
      const dir = b[i + 2]; // '>' = 0x3e відповідь, '!' = 0x21 помилка
      const size = b[i + 3];
      const rcmd = b[i + 4];
      const end = i + 5 + size; // індекс crc
      if (end >= b.length) return null; // кадр ще не дочитаний
      const payload = b.slice(i + 5, i + 5 + size);
      let crc = size ^ rcmd;
      for (const x of payload) crc ^= x;
      const ok = (crc & 0xff) === b[end];
      if (rcmd === cmd && dir === 0x3e && ok) {
        this.buf = b.slice(end + 1);
        return new Uint8Array(payload);
      }
      // помилковий/чужий кадр — відкидаємо його початок і шукаємо далі
      if (dir === 0x21 && rcmd === cmd) {
        this.buf = b.slice(end + 1);
        throw new Error(`FC відповів помилкою на команду ${cmd}`);
      }
    }
    return null;
  }

  private async readWithTimeout(deadline: number): Promise<Uint8Array | null> {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;
    const timeout = new Promise<null>((res) => setTimeout(() => res(null), remaining));
    const read = this.reader.read().then((r: any) => (r.done ? null : r.value));
    return Promise.race([read, timeout]);
  }

  async request(cmd: number, timeoutMs = 1500): Promise<Uint8Array> {
    await this.writer.write(this.buildRequest(cmd));
    const deadline = Date.now() + timeoutMs;
    // спершу спробувати з того, що вже в буфері
    const pre = this.tryExtract(cmd);
    if (pre) return pre;
    while (Date.now() < deadline) {
      const chunk = await this.readWithTimeout(deadline);
      if (chunk && chunk.length) {
        for (let i = 0; i < chunk.length; i++) this.buf.push(chunk[i]);
        const frame = this.tryExtract(cmd);
        if (frame) return frame;
      } else if (chunk === null) {
        break;
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
}
/* eslint-enable @typescript-eslint/no-explicit-any */
