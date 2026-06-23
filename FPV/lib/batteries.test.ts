import { describe, it, expect } from 'vitest';
import { newBattery, parseBatteryImport } from './batteries';

describe('newBattery', () => {
  it('розумні дефолти + унікальний id', () => {
    const a = newBattery();
    const b = newBattery();
    expect(a.status).toBe('ready');
    expect(a.cycles).toBe(0);
    expect(a.cells).toBe('6S');
    expect(a.id).not.toBe(b.id);
  });
  it('перекриття полів працює', () => {
    const x = newBattery({ tag: '6S-01', cells: '4S', cycles: 12 });
    expect(x.tag).toBe('6S-01');
    expect(x.cells).toBe('4S');
    expect(x.cycles).toBe(12);
  });
});

describe('parseBatteryImport', () => {
  it('приймає масив і присвоює НОВІ id (не перезаписує)', () => {
    const text = JSON.stringify([{ id: 'OLD', tag: 'A', cells: '6S', cycles: 5, status: 'storage' }]);
    const out = parseBatteryImport(text);
    expect(out).toHaveLength(1);
    expect(out[0].id).not.toBe('OLD');
    expect(out[0].tag).toBe('A');
    expect(out[0].cycles).toBe(5);
    expect(out[0].status).toBe('storage');
  });

  it('приймає обгортку { batteries: [...] }', () => {
    const text = JSON.stringify({ batteries: [{ tag: 'B', cells: '4S' }] });
    expect(parseBatteryImport(text)).toHaveLength(1);
  });

  it('відкидає биті записи й нормалізує невірний статус/цикли', () => {
    const text = JSON.stringify([
      null,
      42,
      { tag: 'ok', status: 'bogus', cycles: -3 },
    ]);
    const out = parseBatteryImport(text);
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe('ready');
    expect(out[0].cycles).toBe(0);
  });

  it('кидає на не-масиві', () => {
    expect(() => parseBatteryImport(JSON.stringify({ foo: 1 }))).toThrow();
  });
});
