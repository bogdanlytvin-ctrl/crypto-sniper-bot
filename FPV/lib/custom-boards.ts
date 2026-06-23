// FTOS — власні плати техніка (локально, без хмари). Окрема IndexedDB, не чіпає
// вшиту базу. Власні плати ЗАВЖДИ draft + custom:true — звіряй сам перед пайкою.

import { useEffect, useMemo, useState } from 'react';
import type { Board } from './engine';
import { BOARDS } from './data';

const DB_NAME = 'ftos-custom';
const STORE = 'boards';
const VERSION = 1;

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

let dbPromise: Promise<IDBDatabase> | null = null;
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB недоступний'));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}
function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const r = fn(t.objectStore(STORE));
        t.oncomplete = () => resolve(r.result);
        t.onerror = () => reject(t.error);
      }),
  );
}

// Нова заготовка власної плати — мінімально валідна (1 UART, 1 BEC), draft+custom.
export function newCustomBoard(): Board {
  return {
    id: genId(),
    custom: true,
    brand: '',
    model: '',
    revision: '',
    mcu: '',
    firmware_target: { betaflight: '', inav: null },
    voltage: { input_cells: '', bec_outputs: [{ voltage: '5V', max_current_a: 2 }] },
    uarts: [{ name: 'UART1', pads: ['T1', 'R1'], default_function: null, recommended_for: ['any'], connector: null }],
    i2c: [],
    verified: { status: 'draft' },
    source_url: '',
  };
}

export async function listCustomBoards(): Promise<Board[]> {
  const all = await tx<Board[]>('readonly', (s) => s.getAll());
  // гарантуємо custom+draft незалежно від того, що в сховищі
  return all.map((b) => ({ ...b, custom: true, verified: { status: 'draft' } }));
}
export async function saveCustomBoard(b: Board): Promise<void> {
  await tx('readwrite', (s) => s.put({ ...b, custom: true, verified: { status: 'draft' } }));
}
export async function deleteCustomBoard(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
}

// Чистий парсер імпорту (експортовано для тестів): нові id, нормалізація форми.
export function parseCustomBoardsImport(text: string): Board[] {
  const parsed: unknown = JSON.parse(text);
  const arr: unknown = Array.isArray(parsed) ? parsed : (parsed as { boards?: unknown })?.boards;
  if (!Array.isArray(arr)) throw new Error('format');
  const out: Board[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Partial<Board>;
    if (typeof r.model !== 'string' && typeof r.brand !== 'string') continue;
    out.push({
      ...newCustomBoard(),
      brand: typeof r.brand === 'string' ? r.brand : '',
      model: typeof r.model === 'string' ? r.model : '',
      revision: typeof r.revision === 'string' ? r.revision : '',
      mcu: typeof r.mcu === 'string' ? r.mcu : '',
      firmware_target: r.firmware_target ?? { betaflight: '', inav: null },
      voltage: r.voltage ?? { bec_outputs: [] },
      uarts: Array.isArray(r.uarts) ? r.uarts : [],
      i2c: Array.isArray(r.i2c) ? r.i2c : [],
      source_url: typeof r.source_url === 'string' ? r.source_url : '',
    });
  }
  return out;
}

export async function exportCustomBoards(): Promise<string> {
  const all = await tx<Board[]>('readonly', (s) => s.getAll());
  return JSON.stringify({ app: 'ftos', kind: 'custom-boards', version: 1, boards: all }, null, 2);
}
export async function importCustomBoards(text: string): Promise<number> {
  const boards = parseCustomBoardsImport(text);
  if (boards.length) {
    await openDB().then(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const t = db.transaction(STORE, 'readwrite');
          const s = t.objectStore(STORE);
          for (const b of boards) s.put(b);
          t.oncomplete = () => resolve();
          t.onerror = () => reject(t.error);
        }),
    );
  }
  return boards.length;
}

// Усі плати = вшиті + власні (для селекторів у diagnose/wiring/firmware).
// Завантажується після монтування; реактивно оновлюється при переході між сторінками.
export function useAllBoards(): Board[] {
  const [custom, setCustom] = useState<Board[]>([]);
  useEffect(() => {
    listCustomBoards().then(setCustom).catch(() => setCustom([]));
  }, []);
  return useMemo(() => [...BOARDS, ...custom], [custom]);
}
