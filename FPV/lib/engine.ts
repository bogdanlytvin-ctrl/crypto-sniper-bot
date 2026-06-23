// FTOS Compatibility Engine
// Зіставляє вимоги компонентів (RX/VTX/GPS) з можливостями плати:
// вільні UART-и, рекомендації виробника, живлення, I2C.

export interface Uart {
  name: string;
  pads: string[];
  default_function: string | null;
  recommended_for: string[];
  connector: string | null;
  inverted?: boolean;
  notes?: string;
}

export interface BecOutput {
  voltage: string;
  max_current_a: number;
  notes?: string;
}

// Спільний тип «відомої проблеми» для плат і компонентів.
export interface KnownIssue {
  issue: string;
  workaround?: string;
  source_url?: string;
}

export interface Board {
  $comment?: string;
  id: string;
  custom?: boolean; // true — додана техніком локально (завжди draft, звіряй сам)
  type?: string; // "flight_controller"
  brand: string;
  model: string;
  revision: string;
  mcu: string;
  firmware_target?: { betaflight?: string | null; inav?: string | null };
  voltage?: { input_cells?: string; bec_outputs?: BecOutput[] };
  uarts: Uart[];
  motor_outputs?: number;
  i2c?: { name: string; pads: string[]; recommended_for?: string[] }[];
  onboard_peripherals?: string[];
  known_issues?: KnownIssue[];
  verified: { status: 'draft' | 'manual_checked' | 'field_tested'; checked_by?: string; date?: string };
  source_url: string;
}

export interface Component {
  $comment?: string;
  id: string;
  type: 'receiver' | 'vtx_digital' | 'vtx_analog' | 'gps' | 'esc' | 'release';
  brand: string;
  model: string;
  protocol?: string;
  firmware?: string; // ESC: BLHeli_S / BLHeli_32 / AM32
  current_rating_a?: number; // ESC: тривалий струм на канал
  requirements: {
    connection: 'uart' | 'uart_tx_only' | 'stack_cable' | 'servo';
    needs_full_duplex?: boolean;
    voltage: string[];
    current_draw_ma?: number;
    needs_inversion?: boolean;
    needs_i2c?: boolean;
    has_telemetry?: boolean; // ESC: чи є дріт телеметрії (BLHeli_S — немає)
  };
  wiring: { component_pin: string; connects_to: string }[];
  firmware_notes?: string;
  known_issues?: KnownIssue[];
  verified: { status: 'draft' | 'manual_checked' | 'field_tested'; checked_by?: string; date?: string };
  source_url: string;
}

export interface Assignment {
  component: Component;
  uart: Uart | null;
  power: BecOutput | null;
  i2cBus: string | null;
  wires: { from: string; to: string; kind: 'signal' | 'power' | 'ground' | 'i2c' }[];
  warnings: string[];
}

export interface Plan {
  board: Board;
  assignments: Assignment[];
  globalWarnings: string[];
  ok: boolean;
}

// Роль компонента → ключ recommended_for у профілі плати
const ROLE_KEY: Record<Component['type'], string> = {
  receiver: 'receiver',
  vtx_digital: 'vtx_digital',
  vtx_analog: 'vtx_analog_control',
  gps: 'gps',
  esc: 'esc_telemetry', // ESC обробляється окремо (buildEsc); ключ — для повноти типу
  release: 'servo', // реліз обробляється окремо (buildRelease)
};

// UART-и з цими default_function вважаємо зарезервованими (не пропонуємо під периферію)
const RESERVED_FUNCTIONS = ['ESC telemetry', 'Bluetooth'];

// Порядок призначення: спершу найвимогливіші (цифровий VTX часто прив'язаний до роз'єму).
// ESC останнім — він займає свій виділений ESC-telem порт, не конкурує за решту.
const ASSIGN_ORDER: Component['type'][] = ['vtx_digital', 'receiver', 'gps', 'vtx_analog', 'esc', 'release'];

// Реліз скиду (серво/електромагніт) — не UART-периферія: PWM-сигнал на серво/мотор-вихід +
// 5V + GND, керування AUX-каналом. БЕЗПЕКА: не має спрацьовувати на вмиканні/у failsafe.
function buildRelease(release: Component): Assignment {
  const warnings: string[] = [];
  if (release.verified.status === 'draft') {
    warnings.push('Профіль компонента у статусі DRAFT — звір з мануалом.');
  }
  warnings.push(
    'БЕЗПЕКА: реліз НЕ має спрацьовувати на вмиканні чи у failsafe — вистав безпечне (закрите) значення каналу. Деталі — дерево діагностики «Скид не працює».',
  );
  const wires: Assignment['wires'] = [
    { from: `${release.model}: сигнал`, to: 'FC серво/PWM-вихід (на квадрі — resource SERVO на вільний пад)', kind: 'signal' },
    { from: `${release.model}: +`, to: '5V (потужне серво — окремий BEC)', kind: 'power' },
    { from: `${release.model}: GND`, to: 'GND', kind: 'ground' },
  ];
  return { component: release, uart: null, power: null, i2cBus: null, wires, warnings };
}

// ESC підключається стек-кабелем, не як UART-периферія: мотори + VBAT (живить FC) +
// датчик струму + опційний 1 дріт телеметрії на ВИДІЛЕНИЙ ESC-telem UART плати.
function pickEscTelemUart(board: Board, taken: Set<string>): Uart | null {
  return (
    board.uarts.find(
      (u) =>
        !taken.has(u.name) &&
        (u.default_function === 'ESC telemetry' || u.recommended_for?.includes('esc_telemetry')),
    ) ?? null
  );
}

function buildEsc(board: Board, esc: Component, taken: Set<string>): Assignment {
  const warnings: string[] = [];
  if (esc.verified.status === 'draft') {
    warnings.push('Профіль компонента у статусі DRAFT — звір з мануалом.');
  }

  const wires: Assignment['wires'] = [];
  wires.push({ from: 'FC M1–M4 (виходи моторів)', to: `${esc.model}: сигнал моторів (стек-кабель)`, kind: 'signal' });
  // Живлення йде ВІД ESC ДО FC (батарея на ESC), не від BEC.
  wires.push({ from: `${esc.model} VBAT (батарея/XT60)`, to: 'FC VBAT', kind: 'power' });
  wires.push({ from: `${esc.model} Curr (датчик струму)`, to: 'FC Curr-пад', kind: 'signal' });
  wires.push({ from: `${esc.model} GND`, to: 'GND', kind: 'ground' });

  let uart: Uart | null = null;
  if (esc.requirements.has_telemetry) {
    uart = pickEscTelemUart(board, taken);
    if (uart) {
      taken.add(uart.name);
      const rPad = uart.pads[1] ?? uart.pads[0] ?? '?';
      wires.push({ from: `${esc.model} TLM`, to: `${rPad} (${uart.name} RX, ESC-телеметрія)`, kind: 'signal' });
    } else {
      warnings.push(
        'На платі немає виділеного ESC-telem UART — телеметрія ESC недоступна (мотори все одно працюватимуть).',
      );
    }
  } else {
    warnings.push(
      `${esc.firmware ?? 'BLHeli_S'}: дроту телеметрії немає. RPM-фільтр — лише через bidir DShot (Bluejay / BLHeli_32 / AM32).`,
    );
  }

  return { component: esc, uart, power: null, i2cBus: null, wires, warnings };
}

function pickUart(board: Board, comp: Component, taken: Set<string>): Uart | null {
  const role = ROLE_KEY[comp.type];
  const free = board.uarts.filter(
    (u) =>
      !taken.has(u.name) &&
      !(u.default_function && RESERVED_FUNCTIONS.includes(u.default_function)),
  );
  // 1) рекомендований виробником під цю роль
  const recommended = free.find((u) => u.recommended_for?.includes(role));
  if (recommended) return recommended;
  // 2) будь-який універсальний
  const any = free.find((u) => u.recommended_for?.includes('any'));
  if (any) return any;
  // 3) останній шанс — будь-який вільний
  return free[0] ?? null;
}

function pickPower(board: Board, comp: Component): BecOutput | null {
  const becs = board.voltage?.bec_outputs ?? [];
  for (const wanted of comp.requirements.voltage) {
    const hit = becs.find((b) => b.voltage === wanted);
    if (hit) return hit;
  }
  // діапазонні вимоги типу "7.4-26.4V" → підходить VBAT, повертаємо null із попередженням вище
  return null;
}

export function buildPlan(board: Board, components: Component[]): Plan {
  const taken = new Set<string>();
  const globalWarnings: string[] = [];
  const assignments: Assignment[] = [];

  if (board.verified.status === 'draft') {
    globalWarnings.push(
      `Профіль ${board.brand} ${board.model} ${board.revision} у статусі DRAFT — звір пінаут з офіційним мануалом перед пайкою.`,
    );
  }

  const ordered = [...components].sort(
    (a, b) => ASSIGN_ORDER.indexOf(a.type) - ASSIGN_ORDER.indexOf(b.type),
  );

  // Бюджет струму по кожній шині BEC
  const becLoad = new Map<string, number>();

  for (const comp of ordered) {
    if (comp.type === 'esc') {
      assignments.push(buildEsc(board, comp, taken));
      continue;
    }
    if (comp.type === 'release') {
      assignments.push(buildRelease(comp));
      continue;
    }

    const warnings: string[] = [];
    if (comp.verified.status === 'draft') {
      warnings.push('Профіль компонента у статусі DRAFT — звір з мануалом.');
    }

    const uart = pickUart(board, comp, taken);
    if (uart) {
      taken.add(uart.name);
      if (uart.notes) warnings.push(`Примітка плати: ${uart.notes}`);
    } else {
      warnings.push('Немає вільного UART — конфлікт. Звільни порт або обери іншу плату.');
    }

    const power = pickPower(board, comp);
    if (power) {
      const load = (becLoad.get(power.voltage) ?? 0) + (comp.requirements.current_draw_ma ?? 0);
      becLoad.set(power.voltage, load);
      if (load > power.max_current_a * 1000) {
        warnings.push(
          `Сумарне навантаження на ${power.voltage} BEC (~${load} mA) перевищує ліміт ${power.max_current_a} A.`,
        );
      }
    } else {
      const rangeReq = comp.requirements.voltage.find((v) => v.includes('-'));
      if (rangeReq) {
        warnings.push(
          `На платі немає окремої шини під цей компонент — живи від VBAT (допустимий діапазон ${rangeReq}). Перевір кількість банок!`,
        );
      } else {
        warnings.push(
          `Плата не має BEC на ${comp.requirements.voltage.join('/')} — потрібен зовнішній стабілізатор.`,
        );
      }
    }

    // I2C (компас у GPS-модулях)
    let i2cBus: string | null = null;
    if (comp.requirements.needs_i2c) {
      const bus = board.i2c?.[0];
      if (bus) {
        i2cBus = `${bus.name} (пади ${bus.pads.join(' / ')})`;
      } else {
        warnings.push('Компонент потребує I2C (компас), але на платі немає виведеної шини I2C.');
      }
    }

    // Дроти
    const wires: Assignment['wires'] = [];
    if (uart) {
      const [tPad, rPad] = uart.pads;
      if (comp.requirements.connection === 'uart_tx_only') {
        // SmartAudio/Tramp: один дріт SA → FC TX. RX того ж UART лишається вільним,
        // але порт зайнятий. Жодного «компонент TX → FC RX» тут немає.
        wires.push({ from: `${comp.model} SA`, to: `${tPad} (${uart.name} TX, тільки TX)`, kind: 'signal' });
      } else {
        wires.push({ from: `${comp.model} TX`, to: `${rPad} (${uart.name} RX)`, kind: 'signal' });
        wires.push({ from: `${comp.model} RX`, to: `${tPad} (${uart.name} TX)`, kind: 'signal' });
      }
    }
    if (power) wires.push({ from: `${comp.model} VCC`, to: `${power.voltage} BEC`, kind: 'power' });
    wires.push({ from: `${comp.model} GND`, to: 'GND', kind: 'ground' });
    if (i2cBus) {
      wires.push({ from: `${comp.model} SDA/SCL`, to: i2cBus, kind: 'i2c' });
    }

    assignments.push({ component: comp, uart, power, i2cBus, wires, warnings });
  }

  // ESC і реліз не потребують UART — вони не блокують валідність плану.
  const noUart = new Set<Component['type']>(['esc', 'release']);
  const ok = assignments.every((a) => a.uart !== null || noUart.has(a.component.type));
  return { board, assignments, globalWarnings, ok };
}
