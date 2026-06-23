import { describe, it, expect } from 'vitest';
import { buildPlan, type Board, type Component } from './engine';

// --- мок-фабрики: чисті дані під інтерфейси, без JSON/alias ---
function board(overrides: Partial<Board> = {}): Board {
  return {
    id: 'test-fc',
    brand: 'Test',
    model: 'FC',
    revision: 'v1',
    mcu: 'STM32F405',
    voltage: {
      input_cells: '3S-6S',
      bec_outputs: [
        { voltage: '5V', max_current_a: 2 },
        { voltage: '9V', max_current_a: 2 },
      ],
    },
    uarts: [
      { name: 'UART1', pads: ['T1', 'R1'], default_function: null, recommended_for: ['vtx_digital'], connector: null },
      { name: 'UART2', pads: ['T2', 'R2'], default_function: 'Receiver', recommended_for: ['receiver'], connector: null },
      { name: 'UART4', pads: ['T4', 'R4'], default_function: 'Bluetooth', recommended_for: [], connector: null },
      { name: 'UART5', pads: ['T5', 'R5'], default_function: 'ESC telemetry', recommended_for: ['esc_telemetry'], connector: null },
      { name: 'UART6', pads: ['T6', 'R6'], default_function: null, recommended_for: ['gps'], connector: null },
    ],
    i2c: [{ name: 'I2C1', pads: ['SDA', 'SCL'], recommended_for: ['compass'] }],
    verified: { status: 'manual_checked' },
    source_url: 'https://example.com',
    ...overrides,
  };
}

function comp(overrides: Partial<Component> & Pick<Component, 'type'>): Component {
  const base: Component = {
    id: `c-${overrides.type}`,
    type: overrides.type,
    brand: 'B',
    model: 'M',
    requirements: { connection: 'uart', voltage: ['5V'], current_draw_ma: 100 },
    wiring: [],
    verified: { status: 'manual_checked' },
    source_url: 'https://example.com',
  };
  return { ...base, ...overrides };
}

describe('buildPlan — призначення UART', () => {
  it('приймач отримує рекомендований під роль UART', () => {
    const plan = buildPlan(board(), [comp({ type: 'receiver' })]);
    expect(plan.assignments[0].uart?.name).toBe('UART2');
    expect(plan.ok).toBe(true);
  });

  it('GPS іде на рекомендований UART6', () => {
    const plan = buildPlan(board(), [comp({ type: 'gps' })]);
    expect(plan.assignments[0].uart?.name).toBe('UART6');
  });

  it('НЕ призначає зарезервовані порти (Bluetooth / ESC telemetry)', () => {
    // лишаємо вільним лише UART4(BT) і UART5(ESC); жоден не має бути обраний
    const b = board({
      uarts: [
        { name: 'UART4', pads: ['T4', 'R4'], default_function: 'Bluetooth', recommended_for: [], connector: null },
        { name: 'UART5', pads: ['T5', 'R5'], default_function: 'ESC telemetry', recommended_for: [], connector: null },
      ],
    });
    const plan = buildPlan(b, [comp({ type: 'gps' })]);
    expect(plan.assignments[0].uart).toBeNull();
    expect(plan.ok).toBe(false);
    expect(plan.assignments[0].warnings.join(' ')).toMatch(/Немає вільного UART/);
  });

  it('два компоненти не отримують той самий UART', () => {
    const plan = buildPlan(board(), [comp({ type: 'receiver' }), comp({ type: 'gps' })]);
    const names = plan.assignments.map((a) => a.uart?.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).not.toContain(undefined);
  });
});

describe('buildPlan — живлення / BEC', () => {
  it('цифровий VTX на 9V отримує 9V BEC', () => {
    const vtx = comp({ type: 'vtx_digital', requirements: { connection: 'uart', voltage: ['9V'] } });
    const plan = buildPlan(board(), [vtx]);
    expect(plan.assignments[0].power?.voltage).toBe('9V');
  });

  it('перевищення струму BEC дає попередження', () => {
    const b = board({ voltage: { bec_outputs: [{ voltage: '5V', max_current_a: 1 }] } });
    const hungry = comp({ type: 'receiver', requirements: { connection: 'uart', voltage: ['5V'], current_draw_ma: 1500 } });
    const plan = buildPlan(b, [hungry]);
    expect(plan.assignments[0].warnings.join(' ')).toMatch(/перевищує ліміт/);
  });

  it('діапазонна вимога без точного BEC дає попередження про VBAT', () => {
    const b = board({ voltage: { bec_outputs: [{ voltage: '5V', max_current_a: 2 }] } });
    const vtx = comp({ type: 'vtx_digital', requirements: { connection: 'uart', voltage: ['9V', '7.4-26.4V'] } });
    const plan = buildPlan(b, [vtx]);
    expect(plan.assignments[0].power).toBeNull();
    expect(plan.assignments[0].warnings.join(' ')).toMatch(/VBAT/);
  });
});

describe('buildPlan — дроти й I2C', () => {
  it('TX компонента йде на RX-пад FC і навпаки', () => {
    const plan = buildPlan(board(), [comp({ type: 'receiver' })]);
    const wires = plan.assignments[0].wires;
    expect(wires).toContainEqual({ from: 'M TX', to: 'R2 (UART2 RX)', kind: 'signal' });
    expect(wires).toContainEqual({ from: 'M RX', to: 'T2 (UART2 TX)', kind: 'signal' });
    expect(wires).toContainEqual({ from: 'M GND', to: 'GND', kind: 'ground' });
  });

  it('uart_tx_only дає лише SA-дріт на TX, без RX', () => {
    const vtx = comp({ type: 'vtx_analog', requirements: { connection: 'uart_tx_only', voltage: ['5V'] } });
    const plan = buildPlan(board(), [vtx]);
    const signals = plan.assignments[0].wires.filter((w) => w.kind === 'signal');
    expect(signals).toHaveLength(1);
    expect(signals[0].to).toMatch(/тільки TX/);
  });

  it('компонент з I2C отримує шину; без шини — попередження', () => {
    const gpsCompass = comp({ type: 'gps', requirements: { connection: 'uart', voltage: ['5V'], needs_i2c: true } });
    expect(buildPlan(board(), [gpsCompass]).assignments[0].i2cBus).toMatch(/I2C1/);

    const noI2c = board({ i2c: [] });
    expect(buildPlan(noI2c, [gpsCompass]).assignments[0].warnings.join(' ')).toMatch(/I2C/);
  });
});

describe('buildPlan — статуси / попередження', () => {
  it('DRAFT-плата дає глобальне попередження', () => {
    const plan = buildPlan(board({ verified: { status: 'draft' } }), []);
    expect(plan.globalWarnings.join(' ')).toMatch(/DRAFT/);
  });

  it('порожній список компонентів — план валідний і порожній', () => {
    const plan = buildPlan(board(), []);
    expect(plan.assignments).toHaveLength(0);
    expect(plan.ok).toBe(true);
  });
});

describe('buildPlan — ESC (стек-кабель, не UART-периферія)', () => {
  const escTelem = () =>
    comp({
      type: 'esc',
      firmware: 'BLHeli_32',
      requirements: { connection: 'stack_cable', voltage: ['3-6S'], has_telemetry: true },
    });
  const escNoTelem = () =>
    comp({
      type: 'esc',
      firmware: 'BLHeli_S',
      requirements: { connection: 'stack_cable', voltage: ['3-6S'], has_telemetry: false },
    });

  it('ESC з телеметрією займає виділений ESC-telem UART (UART5)', () => {
    const a = buildPlan(board(), [escTelem()]).assignments[0];
    expect(a.uart?.name).toBe('UART5');
    expect(a.wires.some((w) => /ESC-телеметрія/.test(w.to))).toBe(true);
  });

  it('ESC завжди має мотори + VBAT(живить FC) + GND, без BEC', () => {
    const a = buildPlan(board(), [escTelem()]).assignments[0];
    expect(a.power).toBeNull();
    expect(a.wires.some((w) => w.kind === 'power' && /FC VBAT/.test(w.to))).toBe(true);
    expect(a.wires.some((w) => /M1.M4/.test(w.from))).toBe(true);
    expect(a.wires.some((w) => w.kind === 'ground')).toBe(true);
  });

  it('BLHeli_S (без телеметрії) — НЕ конфлікт: uart null, але plan.ok=true + нотатка про RPM', () => {
    const plan = buildPlan(board(), [escNoTelem()]);
    expect(plan.assignments[0].uart).toBeNull();
    expect(plan.ok).toBe(true);
    expect(plan.assignments[0].warnings.join(' ')).toMatch(/RPM|телеметрії немає/);
  });

  it('ESC хоче телеметрію, але плата без ESC-telem UART → попередження, але ok', () => {
    const b = board({
      uarts: [
        { name: 'UART2', pads: ['T2', 'R2'], default_function: 'Receiver', recommended_for: ['receiver'], connector: null },
      ],
    });
    const plan = buildPlan(b, [escTelem()]);
    expect(plan.assignments[0].uart).toBeNull();
    expect(plan.ok).toBe(true);
    expect(plan.assignments[0].warnings.join(' ')).toMatch(/немає виділеного ESC-telem/);
  });

  it('ESC + приймач разом — без конфлікту портів (ESC бере UART5, RX бере UART2)', () => {
    const plan = buildPlan(board(), [comp({ type: 'receiver' }), escTelem()]);
    const rx = plan.assignments.find((a) => a.component.type === 'receiver');
    const esc = plan.assignments.find((a) => a.component.type === 'esc');
    expect(rx?.uart?.name).toBe('UART2');
    expect(esc?.uart?.name).toBe('UART5');
    expect(plan.ok).toBe(true);
  });
});

describe('buildPlan — реліз скиду (серво/PWM, не UART)', () => {
  const release = () =>
    comp({ type: 'release', requirements: { connection: 'servo', voltage: ['5V'], current_draw_ma: 200 } });

  it('реліз не бере UART/BEC і не блокує план', () => {
    const plan = buildPlan(board(), [release()]);
    const a = plan.assignments[0];
    expect(a.uart).toBeNull();
    expect(a.power).toBeNull();
    expect(plan.ok).toBe(true);
  });

  it('реліз має сигнал(PWM) + живлення + GND', () => {
    const a = buildPlan(board(), [release()]).assignments[0];
    expect(a.wires.some((w) => w.kind === 'signal')).toBe(true);
    expect(a.wires.some((w) => w.kind === 'power')).toBe(true);
    expect(a.wires.some((w) => w.kind === 'ground')).toBe(true);
  });

  it('реліз містить попередження про безпеку (самовільне спрацювання)', () => {
    const a = buildPlan(board(), [release()]).assignments[0];
    expect(a.warnings.join(' ')).toMatch(/БЕЗПЕКА|failsafe|вмиканні/);
  });

  it('реліз + ESC + приймач разом — план валідний', () => {
    const escTelem = comp({
      type: 'esc',
      requirements: { connection: 'stack_cable', voltage: ['3-6S'], has_telemetry: true },
    });
    const plan = buildPlan(board(), [comp({ type: 'receiver' }), escTelem, release()]);
    expect(plan.ok).toBe(true);
    expect(plan.assignments).toHaveLength(3);
  });
});
