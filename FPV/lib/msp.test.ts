import { describe, it, expect } from 'vitest';
import { parseSensors, parseStatusEx } from './msp';

describe('parseSensors', () => {
  it('нуль — жодного сенсора', () => {
    expect(parseSensors(0)).toEqual({
      acc: false, baro: false, mag: false, gps: false, sonar: false, gyro: false,
    });
  });
  it('63 — усі сенсори (біти 0..5)', () => {
    expect(parseSensors(63)).toEqual({
      acc: true, baro: true, mag: true, gps: true, sonar: true, gyro: true,
    });
  });
  it('35 (гіро|баро|акс) — лише вони', () => {
    expect(parseSensors(35)).toEqual({
      acc: true, baro: true, mag: false, gps: false, sonar: false, gyro: true,
    });
  });
});

// Будує валідний MSP_STATUS_EX payload з керованими полями.
function statusEx(opts: {
  sensors?: number;
  addCount?: number;
  armCount?: number;
  armFlags?: number;
  len?: number;
} = {}): Uint8Array {
  const sensors = opts.sensors ?? 35;
  const addCount = opts.addCount ?? 0;
  const armCount = opts.armCount ?? 26;
  const armFlags = opts.armFlags ?? 0;
  const b: number[] = [];
  b.push(0, 0, 0, 0, sensors & 0xff, (sensors >> 8) & 0xff); // cycleTime, i2c, sensors
  b.push(0, 0, 0, 0); // flightModeFlags u32
  b.push(0, 0, 0, 3, 0); // pidProfile, cpuLoad u16, profileCount, rateProfile
  b.push(addCount);
  for (let i = 0; i < addCount; i++) b.push(0);
  b.push(armCount);
  b.push(armFlags & 0xff, (armFlags >> 8) & 0xff, (armFlags >> 16) & 0xff, (armFlags >>> 24) & 0xff);
  const arr = Uint8Array.from(b);
  return opts.len != null ? arr.slice(0, opts.len) : arr;
}

describe('parseStatusEx', () => {
  it('null на закороткому payload', () => {
    expect(parseStatusEx(Uint8Array.from([0, 0, 0]))).toBeNull();
  });

  it('сенсори валідні навіть коли arming недоступний (обрізаний payload)', () => {
    const s = parseStatusEx(statusEx({ sensors: 35, len: 6 }));
    expect(s?.sensors.gyro).toBe(true);
    expect(s?.sensors.acc).toBe(true);
    expect(s?.armingReliable).toBe(false);
  });

  it('armingReady коли прапорів немає', () => {
    const s = parseStatusEx(statusEx({ armFlags: 0 }));
    expect(s?.armingReliable).toBe(true);
    expect(s?.armingReady).toBe(true);
    expect(s?.armingReasons).toEqual([]);
  });

  it('декодує активні прапори (THROTTLE + ANGLE) best-effort', () => {
    const s = parseStatusEx(statusEx({ armFlags: (1 << 7) | (1 << 8) }));
    expect(s?.armingReady).toBe(false);
    expect(s?.armingReasons).toContain('THROTTLE');
    expect(s?.armingReasons).toContain('ANGLE');
  });

  it('неправдоподібний armingCount → ненадійно, але сенсори валідні', () => {
    const s = parseStatusEx(statusEx({ sensors: 8, armCount: 200 }));
    expect(s?.sensors.gps).toBe(true);
    expect(s?.armingReliable).toBe(false);
    expect(s?.armingReasons).toEqual([]);
  });

  it('враховує addModeBytes (зсув офсету) при пошуку arming', () => {
    const s = parseStatusEx(statusEx({ addCount: 4, armFlags: 1 << 7 }));
    expect(s?.armingReliable).toBe(true);
    expect(s?.armingReasons).toContain('THROTTLE');
  });
});
