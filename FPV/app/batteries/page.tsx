'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  deleteBattery,
  exportBatteries,
  importBatteries,
  listBatteries,
  newBattery,
  saveBattery,
  type BatteryRecord,
  type BatteryStatus,
} from '@/lib/batteries';

const STATUS: Record<BatteryStatus, { label: string; cls: string }> = {
  ready: { label: 'бойова', cls: 'fixed' },
  storage: { label: 'storage', cls: 'storage' },
  in_use: { label: 'у роботі', cls: 'open' },
  retired: { label: 'у брак', cls: 'scrapped' },
};
const ALL = '__all__';

function num(v: string): number | undefined {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : undefined;
}

export default function BatteriesPage() {
  const [items, setItems] = useState<BatteryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BatteryRecord | null>(null);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const fileInput = useRef<HTMLInputElement>(null);

  async function reload() {
    try {
      setItems(await listBatteries());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(
    () => items.filter((b) => statusFilter === ALL || b.status === statusFilter),
    [items, statusFilter],
  );
  const stats = useMemo(
    () => ({
      total: items.length,
      ready: items.filter((b) => b.status === 'ready').length,
      retired: items.filter((b) => b.status === 'retired').length,
    }),
    [items],
  );

  function patch(p: Partial<BatteryRecord>) {
    setEditing((e) => (e ? { ...e, ...p } : e));
  }
  async function save() {
    if (!editing) return;
    await saveBattery(editing);
    setEditing(null);
    await reload();
  }
  async function remove(id: string) {
    if (!confirm('Видалити батарею з обліку?')) return;
    await deleteBattery(id);
    if (editing?.id === id) setEditing(null);
    await reload();
  }
  async function bumpCycle(b: BatteryRecord) {
    await saveBattery({ ...b, cycles: b.cycles + 1 });
    await reload();
  }

  async function doExport() {
    const data = await listBatteries();
    if (data.length === 0) {
      alert('Облік порожній — нема чого експортувати.');
      return;
    }
    const blob = new Blob([await exportBatteries()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ftos-batteries-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const n = await importBatteries(await file.text());
      await reload();
      alert(`Імпортовано батарей: ${n}`);
    } catch {
      alert('Не вдалося імпортувати: невірний файл.');
    }
  }

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / облік батарей
        </div>
        <h1>
          Облік батарей<span className="cursor">_</span>
        </h1>
        <p>
          Парк LiPo бригади: цикли, внутрішній опір, статус. Локально на пристрої, без хмари.
          Експорт/імпорт для передачі обліку.
        </p>
      </header>

      <div className="jr-stats">
        <span>усього: {stats.total}</span>
        <span className="fixed">бойових: {stats.ready}</span>
        <span className="scrapped">у брак: {stats.retired}</span>
      </div>

      {editing && (
        <section className="jr-form" aria-label="Редагування батареї">
          <div className="jr-form-grid">
            <div className="field">
              <label htmlFor="tag">Маркування / номер</label>
              <input id="tag" value={editing.tag} onChange={(e) => patch({ tag: e.target.value })} placeholder="напр. 6S-014" />
            </div>
            <div className="field">
              <label htmlFor="cells">Банки</label>
              <input id="cells" value={editing.cells} onChange={(e) => patch({ cells: e.target.value })} placeholder="6S" />
            </div>
            <div className="field">
              <label htmlFor="cap">Ємність, mAh</label>
              <input id="cap" inputMode="numeric" value={editing.capacityMah ?? ''} onChange={(e) => patch({ capacityMah: num(e.target.value) })} placeholder="1300" />
            </div>
            <div className="field">
              <label htmlFor="cyc">Цикли</label>
              <input id="cyc" inputMode="numeric" value={editing.cycles} onChange={(e) => patch({ cycles: num(e.target.value) ?? 0 })} />
            </div>
            <div className="field">
              <label htmlFor="ir">Внутр. опір, mΩ</label>
              <input id="ir" inputMode="numeric" value={editing.irMilliOhm ?? ''} onChange={(e) => patch({ irMilliOhm: num(e.target.value) })} placeholder="напр. 6" />
            </div>
            <div className="field">
              <label htmlFor="st">Статус</label>
              <select id="st" value={editing.status} onChange={(e) => patch({ status: e.target.value as BatteryStatus })}>
                <option value="ready">бойова</option>
                <option value="storage">storage</option>
                <option value="in_use">у роботі</option>
                <option value="retired">у брак</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="bn">Нотатки</label>
            <textarea id="bn" rows={2} value={editing.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="здуття, просідання під навантаженням тощо" />
          </div>
          <div className="jr-form-actions">
            <button className="primary" onClick={save}>
              Зберегти
            </button>
            <button className="ghost" onClick={() => setEditing(null)}>
              Скасувати
            </button>
            <button className="ghost danger" onClick={() => remove(editing.id)}>
              Видалити
            </button>
          </div>
        </section>
      )}

      {!editing && (
        <div className="jr-controls">
          <button className="primary" onClick={() => setEditing(newBattery({}))}>
            + Нова батарея
          </button>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value={ALL}>усі статуси</option>
            <option value="ready">бойова</option>
            <option value="storage">storage</option>
            <option value="in_use">у роботі</option>
            <option value="retired">у брак</option>
          </select>
          <div className="jr-io">
            <button className="ghost" onClick={doExport}>
              ↓ експорт
            </button>
            <button className="ghost" onClick={() => fileInput.current?.click()}>
              ↑ імпорт
            </button>
            <input ref={fileInput} type="file" accept="application/json,.json" onChange={onImport} hidden />
          </div>
        </div>
      )}

      {!editing && (
        <section className="jr-list" aria-live="polite">
          {loading && <div className="empty">Завантаження…</div>}
          {!loading && filtered.length === 0 && (
            <div className="empty">
              {items.length === 0 ? 'Облік порожній. Натисни «Нова батарея».' : 'За цим фільтром батарей немає.'}
            </div>
          )}
          {filtered.map((b) => (
            <article className="jr-card" key={b.id}>
              <header>
                <h3>{b.tag || 'Без номера'}</h3>
                <span className={`jr-status ${STATUS[b.status].cls}`}>{STATUS[b.status].label}</span>
                <span className="jr-date">{b.cells}</span>
              </header>
              <div className="jr-board">
                {b.capacityMah ? `${b.capacityMah} mAh · ` : ''}циклів: {b.cycles}
                {b.irMilliOhm != null ? ` · IR ${b.irMilliOhm} mΩ` : ''}
              </div>
              {b.notes && <div className="jr-notes">{b.notes}</div>}
              <div className="jr-card-actions">
                <button className="ghost" onClick={() => bumpCycle(b)}>
                  +1 цикл
                </button>
                <button className="ghost" onClick={() => setEditing(b)}>
                  редагувати
                </button>
                <button className="ghost danger" onClick={() => remove(b.id)}>
                  видалити
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <footer className="colophon">
        <span>дані: локально на цьому пристрої (IndexedDB)</span>
        <span>LiPo — розхідник №1, веди облік</span>
      </footer>
    </main>
  );
}
