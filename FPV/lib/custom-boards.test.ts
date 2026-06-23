import { describe, it, expect } from 'vitest';
import { newCustomBoard, parseCustomBoardsImport } from './custom-boards';

describe('newCustomBoard', () => {
  it('завжди custom + draft, з мінімальною валідною формою', () => {
    const b = newCustomBoard();
    expect(b.custom).toBe(true);
    expect(b.verified.status).toBe('draft');
    expect(b.uarts.length).toBeGreaterThanOrEqual(1);
    expect(b.voltage?.bec_outputs?.length).toBeGreaterThanOrEqual(1);
  });
  it('унікальні id', () => {
    expect(newCustomBoard().id).not.toBe(newCustomBoard().id);
  });
});

describe('parseCustomBoardsImport', () => {
  it('масив → плати з НОВИМИ id, custom+draft', () => {
    const text = JSON.stringify([{ id: 'OLD', brand: 'Acme', model: 'F405', mcu: 'STM32F405', uarts: [] }]);
    const out = parseCustomBoardsImport(text);
    expect(out).toHaveLength(1);
    expect(out[0].id).not.toBe('OLD');
    expect(out[0].custom).toBe(true);
    expect(out[0].verified.status).toBe('draft');
    expect(out[0].brand).toBe('Acme');
  });
  it('приймає обгортку { boards: [...] }', () => {
    expect(parseCustomBoardsImport(JSON.stringify({ boards: [{ model: 'X' }] }))).toHaveLength(1);
  });
  it('відкидає сміття', () => {
    expect(parseCustomBoardsImport(JSON.stringify([null, 5, {}]))).toHaveLength(0);
  });
  it('кидає на не-масиві', () => {
    expect(() => parseCustomBoardsImport(JSON.stringify({ foo: 1 }))).toThrow();
  });
});
