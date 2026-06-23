import { describe, it, expect } from 'vitest';
import { readBoardId, writeBoardId } from './prefs';
import { BOARDS } from './data';

// Vitest node-середовище = немає window (як SSR). Перевіряємо безпечний фолбек.
describe('prefs — спільна плата (SSR-safe)', () => {
  it('readBoardId без window повертає першу плату', () => {
    expect(readBoardId()).toBe(BOARDS[0].id);
  });
  it('writeBoardId без window не кидає винятків', () => {
    expect(() => writeBoardId('whatever')).not.toThrow();
  });
});
