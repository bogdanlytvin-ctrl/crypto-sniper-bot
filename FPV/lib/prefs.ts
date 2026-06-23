// FTOS — спільні налаштування між інструментами (локально, без хмари).
// «Поточна плата»: технік обирає раз → /diagnose, /wiring, /firmware підхоплюють.

import { useCallback, useEffect, useState } from 'react';
import { BOARDS } from './data';

const BOARD_KEY = 'ftos:board';

// Прочитати збережену плату; повертає валідний id або першу плату.
// SSR-безпечно: на сервері (немає window) — завжди BOARDS[0].
export function readBoardId(): string {
  const fallback = BOARDS[0].id;
  if (typeof window === 'undefined') return fallback;
  try {
    // Не валідуємо проти статичних BOARDS — власні плати живуть в IndexedDB (async).
    // Сторінки роблять `boards.find(id) ?? boards[0]`, тож видалений id безпечно відкотиться.
    const v = localStorage.getItem(BOARD_KEY);
    return v && v.length > 0 ? v : fallback;
  } catch {
    return fallback;
  }
}

export function writeBoardId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BOARD_KEY, id);
  } catch {
    /* приватний режим / квота — не критично */
  }
}

// Хук «липкої» плати для клієнтських сторінок. Початково — BOARDS[0] (збігається
// з SSR, без hydration-mismatch), після монтування синхронізується зі збереженою.
// Сеттер одразу зберігає вибір, щоб інші інструменти його підхопили.
export function useStickyBoardId(): [string, (id: string) => void] {
  const [id, setId] = useState(BOARDS[0].id);
  useEffect(() => {
    setId(readBoardId());
  }, []);
  const set = useCallback((v: string) => {
    setId(v);
    writeBoardId(v);
  }, []);
  return [id, set];
}
