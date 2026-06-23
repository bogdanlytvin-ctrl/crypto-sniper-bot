// FTOS — локальні звірки даних. Технік підіймає статус плати/дерева
// draft → manual_checked → field_tested. Зберігається локально (IndexedDB),
// з експортом/імпортом: один досвідчений звіряє → роздає файл бригаді.
//
// Базові дані лишаються draft у JSON; цей шар — оверрайд поверх них.

import { useCallback, useEffect, useState } from 'react';
import type { VerifyStatus } from './diagnostics';

export interface VerificationRecord {
  key: string; // "board:<id>" | "flow:<id>"
  status: VerifyStatus;
  checkedBy: string;
  note: string;
  date: number;
}

const DB_NAME = 'ftos-verify';
const STORE = 'verifications';
const VERSION = 1;

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
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

// Кешований singleton — не закриваємо після кожної операції.
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

export function boardKey(id: string): string {
  return `board:${id}`;
}
export function flowKey(id: string): string {
  return `flow:${id}`;
}

export async function loadVerifications(): Promise<Map<string, VerificationRecord>> {
  const all = await tx<VerificationRecord[]>('readonly', (s) => s.getAll());
  return new Map(all.map((r) => [r.key, r]));
}

export async function saveVerification(rec: VerificationRecord): Promise<void> {
  rec.date = Date.now();
  await tx('readwrite', (s) => s.put(rec));
}

export async function deleteVerification(key: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(key));
}

// Ефективний статус = локальний оверрайд або базовий із JSON.
export function effectiveStatus(
  base: VerifyStatus,
  map: Map<string, VerificationRecord>,
  key: string,
): VerifyStatus {
  return map.get(key)?.status ?? base;
}

export async function exportVerifications(): Promise<string> {
  const all = await tx<VerificationRecord[]>('readonly', (s) => s.getAll());
  return JSON.stringify(
    { app: 'ftos', kind: 'verifications', version: 1, exportedAt: Date.now(), items: all },
    null,
    2,
  );
}

export async function importVerifications(text: string): Promise<number> {
  const parsed = JSON.parse(text);
  const arr: unknown = Array.isArray(parsed) ? parsed : parsed?.items;
  if (!Array.isArray(arr)) throw new Error('format');
  const valid: VerificationRecord[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Partial<VerificationRecord>;
    if (typeof r.key !== 'string' || !r.key) continue;
    if (!(['draft', 'manual_checked', 'field_tested'] as const).includes(r.status as VerifyStatus)) {
      continue;
    }
    valid.push({
      key: r.key,
      status: r.status as VerifyStatus,
      checkedBy: typeof r.checkedBy === 'string' ? r.checkedBy : '',
      note: typeof r.note === 'string' ? r.note : '',
      date: typeof r.date === 'number' ? r.date : Date.now(),
    });
  }
  if (valid.length === 0) return 0;
  // Не затираємо свіжіші локальні звірки: чужий/застарілий файл не повинен
  // знижувати статус, який технік уже підняв на залізі. Пишемо лише новіші.
  const existing = await loadVerifications();
  const toWrite = valid.filter((rec) => {
    const cur = existing.get(rec.key);
    return !cur || rec.date >= cur.date;
  });
  if (toWrite.length === 0) return 0;
  // одна транзакція на весь батч
  await openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(STORE, 'readwrite');
        const s = t.objectStore(STORE);
        for (const rec of toWrite) s.put(rec);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      }),
  );
  return toWrite.length;
}

// Хук для клієнтських сторінок: мапа оверрайдів + перезавантаження.
export function useVerifications() {
  const [map, setMap] = useState<Map<string, VerificationRecord>>(new Map());
  const reload = useCallback(async () => {
    try {
      setMap(await loadVerifications());
    } catch {
      setMap(new Map());
    }
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { map, reload };
}
