// FTOS — локальний журнал ремонту на IndexedDB.
// Все зберігається у браузері пристрою: без акаунтів, без хмари (opsec бригади).
// Працює офлайн. Дані не залишають пристрій, поки технік сам не експортує.

export type RepairStatus = 'open' | 'fixed' | 'scrapped';

export interface RepairRecord {
  id: string;
  createdAt: number; // epoch ms
  updatedAt: number;
  droneTag: string; // борт-номер / позивний
  boardId: string;
  boardLabel: string; // денормалізовано — лишається, навіть якщо плату приберуть з бази
  symptomId?: string;
  symptomLabel?: string;
  causeLabel?: string;
  fixAction?: string;
  parts: string; // витрачені запчастини (вільний текст)
  notes: string;
  minutesSpent?: number;
  status: RepairStatus;
}

const DB_NAME = 'ftos';
const STORE = 'repairs';
const VERSION = 1;

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB недоступний (немає браузерного середовища)'));
      return;
    }
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('boardId', 'boardId');
        store.createIndex('status', 'status');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = fn(transaction.objectStore(STORE));
        transaction.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      }),
  );
}

// Фабрика нового запису — id/час проставляються тут.
export function newRepair(partial: Partial<RepairRecord>): RepairRecord {
  const now = Date.now();
  return {
    id: genId(),
    createdAt: now,
    updatedAt: now,
    droneTag: '',
    boardId: '',
    boardLabel: '',
    parts: '',
    notes: '',
    status: 'open',
    ...partial,
  };
}

export async function listRepairs(): Promise<RepairRecord[]> {
  const all = await tx<RepairRecord[]>('readonly', (s) => s.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getRepair(id: string): Promise<RepairRecord | undefined> {
  return tx<RepairRecord | undefined>('readonly', (s) => s.get(id));
}

export async function saveRepair(rec: RepairRecord): Promise<void> {
  rec.updatedAt = Date.now();
  await tx('readwrite', (s) => s.put(rec));
}

export async function deleteRepair(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
}
