// FTOS — облік батарей бригади. LiPo — розхідник №1: цикли, внутрішній опір,
// статус. Окрема IndexedDB (не чіпає журнал ремонту). Локально, без хмари.

export type BatteryStatus = 'ready' | 'storage' | 'in_use' | 'retired';

export interface BatteryRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  tag: string; // маркування/номер пакета
  cells: string; // "6S"
  capacityMah?: number;
  cycles: number;
  irMilliOhm?: number; // внутрішній опір, mΩ (вся збірка)
  status: BatteryStatus;
  notes: string;
}

const DB_NAME = 'ftos-batteries';
const STORE = 'batteries';
const VERSION = 1;

const STATUSES: readonly BatteryStatus[] = ['ready', 'storage', 'in_use', 'retired'];

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('status', 'status');
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

export function newBattery(partial: Partial<BatteryRecord> = {}): BatteryRecord {
  const now = Date.now();
  return {
    id: genId(),
    createdAt: now,
    updatedAt: now,
    tag: '',
    cells: '6S',
    cycles: 0,
    status: 'ready',
    notes: '',
    ...partial,
  };
}

export async function listBatteries(): Promise<BatteryRecord[]> {
  const all = await tx<BatteryRecord[]>('readonly', (s) => s.getAll());
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveBattery(rec: BatteryRecord): Promise<void> {
  rec.updatedAt = Date.now();
  await tx('readwrite', (s) => s.put(rec));
}

export async function deleteBattery(id: string): Promise<void> {
  await tx('readwrite', (s) => s.delete(id));
}

export function putManyBatteries(recs: BatteryRecord[]): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(STORE, 'readwrite');
        const s = t.objectStore(STORE);
        for (const r of recs) s.put(r);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
      }),
  );
}

// Чистий парсер імпорту (експортовано для тестів). Кожному запису — НОВИЙ id,
// щоб імпорт не перезаписав наявні; биті записи відкидаються.
export function parseBatteryImport(text: string): BatteryRecord[] {
  const parsed: unknown = JSON.parse(text);
  const arr: unknown = Array.isArray(parsed)
    ? parsed
    : (parsed as { batteries?: unknown })?.batteries;
  if (!Array.isArray(arr)) throw new Error('format');
  const out: BatteryRecord[] = [];
  for (const raw of arr) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Partial<BatteryRecord>;
    if (typeof r.tag !== 'string' && typeof r.cells !== 'string') continue;
    out.push(
      newBattery({
        tag: typeof r.tag === 'string' ? r.tag : '',
        cells: typeof r.cells === 'string' && r.cells ? r.cells : '6S',
        capacityMah: typeof r.capacityMah === 'number' ? r.capacityMah : undefined,
        cycles: typeof r.cycles === 'number' && r.cycles >= 0 ? r.cycles : 0,
        irMilliOhm: typeof r.irMilliOhm === 'number' ? r.irMilliOhm : undefined,
        status: STATUSES.includes(r.status as BatteryStatus) ? (r.status as BatteryStatus) : 'ready',
        notes: typeof r.notes === 'string' ? r.notes : '',
        createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
      }),
    );
  }
  return out;
}

export async function exportBatteries(): Promise<string> {
  const all = await tx<BatteryRecord[]>('readonly', (s) => s.getAll());
  return JSON.stringify(
    { app: 'ftos', kind: 'batteries', version: 1, exportedAt: Date.now(), batteries: all },
    null,
    2,
  );
}

export async function importBatteries(text: string): Promise<number> {
  const recs = parseBatteryImport(text);
  if (recs.length) await putManyBatteries(recs);
  return recs.length;
}
