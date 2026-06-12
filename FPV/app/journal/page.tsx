'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BOARDS, FLOWS } from '@/lib/data';
import {
  deleteRepair,
  listRepairs,
  newRepair,
  saveRepair,
  type RepairRecord,
  type RepairStatus,
} from '@/lib/idb';

const STATUS: Record<RepairStatus, { label: string; cls: string }> = {
  open: { label: 'у роботі', cls: 'open' },
  fixed: { label: 'полагоджено', cls: 'fixed' },
  scrapped: { label: 'у брак', cls: 'scrapped' },
};

const ALL = '__all__';

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function JournalPage() {
  const [repairs, setRepairs] = useState<RepairRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RepairRecord | null>(null);
  const [boardFilter, setBoardFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [showStats, setShowStats] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function reload() {
    try {
      setRepairs(await listRepairs());
    } catch {
      setRepairs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload().then(() => {
      // Підхоплюємо запис, створений із діагностики, одразу в редагування.
      const openId = localStorage.getItem('ftos:open-edit');
      if (openId) {
        localStorage.removeItem('ftos:open-edit');
        listRepairs().then((list) => {
          const rec = list.find((r) => r.id === openId);
          if (rec) setEditing(rec);
        });
      }
    });
  }, []);

  const filtered = useMemo(
    () =>
      repairs.filter(
        (r) =>
          (boardFilter === ALL || r.boardId === boardFilter) &&
          (statusFilter === ALL || r.status === statusFilter),
      ),
    [repairs, boardFilter, statusFilter],
  );

  const stats = useMemo(
    () => ({
      total: repairs.length,
      open: repairs.filter((r) => r.status === 'open').length,
      fixed: repairs.filter((r) => r.status === 'fixed').length,
    }),
    [repairs],
  );

  const analytics = useMemo(() => {
    const byCause = new Map<string, number>();
    const byBoard = new Map<string, number>();
    const byPart = new Map<string, number>();
    let minutes = 0;
    for (const r of repairs) {
      if (r.causeLabel) byCause.set(r.causeLabel, (byCause.get(r.causeLabel) ?? 0) + 1);
      if (r.boardLabel) byBoard.set(r.boardLabel, (byBoard.get(r.boardLabel) ?? 0) + 1);
      r.parts
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((p) => byPart.set(p, (byPart.get(p) ?? 0) + 1));
      minutes += r.minutesSpent ?? 0;
    }
    const top = (m: Map<string, number>, n = 5) =>
      Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
    return { causes: top(byCause), boards: top(byBoard), parts: top(byPart), minutes };
  }, [repairs]);

  function startNew() {
    setEditing(newRepair({ boardId: BOARDS[0].id, boardLabel: boardLabelOf(BOARDS[0].id) }));
  }

  function boardLabelOf(id: string): string {
    const b = BOARDS.find((x) => x.id === id);
    return b ? `${b.brand} ${b.model} ${b.revision}` : id;
  }

  async function save() {
    if (!editing) return;
    await saveRepair(editing);
    setEditing(null);
    await reload();
  }

  async function remove(id: string) {
    if (!confirm('Видалити запис ремонту? Дію не відмінити.')) return;
    await deleteRepair(id);
    if (editing?.id === id) setEditing(null);
    await reload();
  }

  function patch(p: Partial<RepairRecord>) {
    setEditing((e) => (e ? { ...e, ...p } : e));
  }

  async function exportJournal() {
    const data = await listRepairs();
    if (data.length === 0) {
      alert('Журнал порожній — нема чого експортувати.');
      return;
    }
    const payload = JSON.stringify(
      { app: 'ftos', kind: 'repair-journal', version: 1, exportedAt: Date.now(), repairs: data },
      null,
      2,
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ftos-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // дозволити повторний імпорт того самого файлу
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const arr: unknown = Array.isArray(parsed) ? parsed : parsed?.repairs;
      if (!Array.isArray(arr)) throw new Error('format');
      let n = 0;
      for (const raw of arr) {
        if (!raw || typeof raw !== 'object') continue;
        const r = raw as Partial<RepairRecord>;
        const rec = newRepair(r); // зберігає id/createdAt з файлу, доповнює дефолти
        if (!(['open', 'fixed', 'scrapped'] as const).includes(rec.status)) rec.status = 'open';
        await saveRepair(rec);
        n++;
      }
      await reload();
      alert(`Імпортовано записів: ${n}`);
    } catch {
      alert('Не вдалося імпортувати: невірний файл журналу.');
    }
  }

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / журнал ремонту
        </div>
        <h1>
          Журнал ремонту<span className="cursor">_</span>
        </h1>
        <p>
          Локальний журнал на цьому пристрої: борт → симптом → причина → запчастини. Без хмари, без
          акаунтів. Працює офлайн.
        </p>
      </header>

      <div className="jr-stats">
        <span>усього: {stats.total}</span>
        <span className="open">у роботі: {stats.open}</span>
        <span className="fixed">полагоджено: {stats.fixed}</span>
      </div>

      {/* Форма редагування / додавання */}
      {editing && (
        <section className="jr-form" aria-label="Редагування запису">
          <div className="jr-form-grid">
            <div className="field">
              <label htmlFor="tag">Борт / позивний</label>
              <input
                id="tag"
                value={editing.droneTag}
                onChange={(e) => patch({ droneTag: e.target.value })}
                placeholder="напр. Vampire-07"
              />
            </div>
            <div className="field">
              <label htmlFor="jboard">Плата</label>
              <select
                id="jboard"
                value={editing.boardId}
                onChange={(e) => patch({ boardId: e.target.value, boardLabel: boardLabelOf(e.target.value) })}
              >
                {BOARDS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brand} {b.model} {b.revision}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="jsymptom">Симптом</label>
              <select
                id="jsymptom"
                value={editing.symptomId ?? ''}
                onChange={(e) => {
                  const f = FLOWS.find((x) => x.id === e.target.value);
                  patch({ symptomId: f?.id, symptomLabel: f?.symptom });
                }}
              >
                <option value="">— не вказано —</option>
                {FLOWS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.symptom}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="jstatus">Статус</label>
              <select
                id="jstatus"
                value={editing.status}
                onChange={(e) => patch({ status: e.target.value as RepairStatus })}
              >
                <option value="open">у роботі</option>
                <option value="fixed">полагоджено</option>
                <option value="scrapped">у брак</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="jcause">Причина / що зроблено</label>
            <input
              id="jcause"
              value={editing.causeLabel ?? ''}
              onChange={(e) => patch({ causeLabel: e.target.value })}
              placeholder="напр. Холодна пайка живлення VTX"
            />
          </div>
          <div className="field">
            <label htmlFor="jparts">Запчастини</label>
            <input
              id="jparts"
              value={editing.parts}
              onChange={(e) => patch({ parts: e.target.value })}
              placeholder="напр. VTX RushFPV Tank, конектор SH1.0"
            />
          </div>
          <div className="field">
            <label htmlFor="jnotes">Нотатки</label>
            <textarea
              id="jnotes"
              value={editing.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              rows={3}
              placeholder="деталі, що перевіряли, на що звернути увагу наступного разу"
            />
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

      {/* Панель керування списком */}
      {!editing && (
        <div className="jr-controls">
          <button className="primary" onClick={startNew}>
            + Новий ремонт
          </button>
          <select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)}>
            <option value={ALL}>усі плати</option>
            {BOARDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.brand} {b.model} {b.revision}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value={ALL}>усі статуси</option>
            <option value="open">у роботі</option>
            <option value="fixed">полагоджено</option>
            <option value="scrapped">у брак</option>
          </select>
          <div className="jr-io">
            {repairs.length > 0 && (
              <button className="ghost" onClick={() => setShowStats((s) => !s)}>
                📊 аналітика
              </button>
            )}
            <button className="ghost" onClick={exportJournal}>
              ↓ експорт
            </button>
            <button className="ghost" onClick={() => fileInput.current?.click()}>
              ↑ імпорт
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              onChange={onImportFile}
              hidden
            />
          </div>
        </div>
      )}

      {/* Аналітика по парку */}
      {!editing && showStats && repairs.length > 0 && (
        <section className="jr-analytics" aria-label="Аналітика">
          <div className="jr-an-time">
            Сумарний час ремонтів: <b>{Math.round(analytics.minutes / 60)} год {analytics.minutes % 60} хв</b>
          </div>
          <div className="jr-an-cols">
            <div className="jr-an-col">
              <h4>Найчастіші причини</h4>
              {analytics.causes.length === 0 && <p className="jr-an-empty">нема даних</p>}
              {analytics.causes.map(([name, n]) => (
                <div className="jr-an-row" key={name}>
                  <span>{name}</span>
                  <b>{n}</b>
                </div>
              ))}
            </div>
            <div className="jr-an-col">
              <h4>Найчастіші плати</h4>
              {analytics.boards.map(([name, n]) => (
                <div className="jr-an-row" key={name}>
                  <span>{name}</span>
                  <b>{n}</b>
                </div>
              ))}
            </div>
            <div className="jr-an-col">
              <h4>Запчастини</h4>
              {analytics.parts.length === 0 && <p className="jr-an-empty">нема даних</p>}
              {analytics.parts.map(([name, n]) => (
                <div className="jr-an-row" key={name}>
                  <span>{name}</span>
                  <b>{n}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Список */}
      {!editing && (
        <section className="jr-list" aria-live="polite">
          {loading && <div className="empty">Завантаження…</div>}
          {!loading && filtered.length === 0 && (
            <div className="empty">
              {repairs.length === 0
                ? 'Журнал порожній. Натисни «Новий ремонт» або збережи ремонт із діагностики.'
                : 'За цим фільтром записів немає.'}
            </div>
          )}
          {filtered.map((r) => (
            <article className="jr-card" key={r.id}>
              <header>
                <h3>{r.droneTag || 'Без позивного'}</h3>
                <span className={`jr-status ${STATUS[r.status].cls}`}>
                  {STATUS[r.status].label}
                </span>
                <span className="jr-date">{fmtDate(r.createdAt)}</span>
              </header>
              <div className="jr-board">{r.boardLabel}</div>
              {(r.symptomLabel || r.causeLabel) && (
                <div className="jr-diag">
                  {r.symptomLabel && <span className="jr-symptom">{r.symptomLabel}</span>}
                  {r.causeLabel && <span className="jr-cause">→ {r.causeLabel}</span>}
                </div>
              )}
              {r.parts && (
                <div className="jr-parts">
                  <b>Запчастини:</b> {r.parts}
                </div>
              )}
              {r.notes && <div className="jr-notes">{r.notes}</div>}
              <div className="jr-card-actions">
                <button className="ghost" onClick={() => setEditing(r)}>
                  редагувати
                </button>
                <button className="ghost danger" onClick={() => remove(r.id)}>
                  видалити
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <footer className="colophon">
        <span>дані: локально на цьому пристрої (IndexedDB)</span>
        <span>без хмари · без акаунтів</span>
      </footer>
    </main>
  );
}
