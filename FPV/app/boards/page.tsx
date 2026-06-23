'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Board } from '@/lib/engine';
import {
  deleteCustomBoard,
  exportCustomBoards,
  importCustomBoards,
  listCustomBoards,
  newCustomBoard,
  saveCustomBoard,
} from '@/lib/custom-boards';

const ROLES = ['any', 'receiver', 'vtx_digital', 'vtx_analog_control', 'gps', 'esc_telemetry', 'camera_control'];

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Board | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function reload() {
    try {
      setBoards(await listCustomBoards());
    } catch {
      setBoards([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);

  function patch(p: Partial<Board>) {
    setEditing((e) => (e ? { ...e, ...p } : e));
  }
  function patchVoltage(p: Partial<NonNullable<Board['voltage']>>) {
    setEditing((e) => (e ? { ...e, voltage: { ...e.voltage, ...p } } : e));
  }
  function patchTarget(p: Partial<NonNullable<Board['firmware_target']>>) {
    setEditing((e) => (e ? { ...e, firmware_target: { ...e.firmware_target, ...p } } : e));
  }

  // --- BEC ---
  const becs = editing?.voltage?.bec_outputs ?? [];
  function setBec(i: number, field: 'voltage' | 'max_current_a' | 'notes', v: string) {
    const next = becs.map((b, idx) =>
      idx === i ? { ...b, [field]: field === 'max_current_a' ? Number(v) || 0 : v } : b,
    );
    patchVoltage({ bec_outputs: next });
  }
  function addBec() {
    patchVoltage({ bec_outputs: [...becs, { voltage: '', max_current_a: 0 }] });
  }
  function removeBec(i: number) {
    patchVoltage({ bec_outputs: becs.filter((_, idx) => idx !== i) });
  }

  // --- UARTs ---
  const uarts = editing?.uarts ?? [];
  function setUart(i: number, field: 'name' | 'default_function', v: string) {
    patch({ uarts: uarts.map((u, idx) => (idx === i ? { ...u, [field]: v || null } : u)) });
  }
  function setPad(i: number, padIdx: 0 | 1, v: string) {
    patch({
      uarts: uarts.map((u, idx) => {
        if (idx !== i) return u;
        const pads = [...u.pads];
        pads[padIdx] = v;
        return { ...u, pads };
      }),
    });
  }
  function setRole(i: number, v: string) {
    patch({ uarts: uarts.map((u, idx) => (idx === i ? { ...u, recommended_for: [v] } : u)) });
  }
  function addUart() {
    patch({
      uarts: [
        ...uarts,
        { name: `UART${uarts.length + 1}`, pads: ['', ''], default_function: null, recommended_for: ['any'], connector: null },
      ],
    });
  }
  function removeUart(i: number) {
    patch({ uarts: uarts.filter((_, idx) => idx !== i) });
  }

  async function save() {
    if (!editing) return;
    if (!editing.brand.trim() && !editing.model.trim()) {
      alert('Вкажи хоча б бренд або модель.');
      return;
    }
    await saveCustomBoard(editing);
    setEditing(null);
    await reload();
  }
  async function remove(id: string) {
    if (!confirm('Видалити власну плату?')) return;
    await deleteCustomBoard(id);
    if (editing?.id === id) setEditing(null);
    await reload();
  }

  async function doExport() {
    const data = await listCustomBoards();
    if (data.length === 0) {
      alert('Немає власних плат для експорту.');
      return;
    }
    const blob = new Blob([await exportCustomBoards()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ftos-custom-boards-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const n = await importCustomBoards(await file.text());
      await reload();
      alert(`Імпортовано плат: ${n}`);
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
          / власні плати
        </div>
        <h1>
          Власні плати<span className="cursor">_</span>
        </h1>
        <p>
          Додай плату/ревізію, якої немає в базі — вона з'явиться в усіх інструментах. Локально, без
          хмари. <b>Власні плати завжди «draft»</b> — звіряй пінаут із мануалом сам.
        </p>
      </header>

      <div className="global-warn">
        ⚠ Власна плата не звірена нами. Заповнюй з офіційного мануала; помилка в паді = спалена плата.
      </div>

      {editing && (
        <section className="jr-form" aria-label="Редагування плати">
          <div className="jr-form-grid">
            <div className="field">
              <label htmlFor="brand">Бренд</label>
              <input id="brand" value={editing.brand} onChange={(e) => patch({ brand: e.target.value })} placeholder="напр. SpeedyBee" />
            </div>
            <div className="field">
              <label htmlFor="model">Модель</label>
              <input id="model" value={editing.model} onChange={(e) => patch({ model: e.target.value })} placeholder="напр. F405" />
            </div>
            <div className="field">
              <label htmlFor="rev">Ревізія / варіант</label>
              <input id="rev" value={editing.revision} onChange={(e) => patch({ revision: e.target.value })} placeholder="напр. V4 / 30x30" />
            </div>
            <div className="field">
              <label htmlFor="mcu">MCU</label>
              <input id="mcu" value={editing.mcu} onChange={(e) => patch({ mcu: e.target.value })} placeholder="напр. STM32F405" />
            </div>
            <div className="field">
              <label htmlFor="bf">Target Betaflight</label>
              <input id="bf" value={editing.firmware_target?.betaflight ?? ''} onChange={(e) => patchTarget({ betaflight: e.target.value })} placeholder="напр. SPEEDYBEEF405V4" />
            </div>
            <div className="field">
              <label htmlFor="cells">Вхід (банки)</label>
              <input id="cells" value={editing.voltage?.input_cells ?? ''} onChange={(e) => patchVoltage({ input_cells: e.target.value })} placeholder="напр. 3S-6S" />
            </div>
          </div>

          <div className="cb-block">
            <div className="cb-block-head">
              <h4>Живлення (BEC)</h4>
              <button className="ghost cb-add" onClick={addBec}>+ BEC</button>
            </div>
            {becs.map((b, i) => (
              <div className="cb-row" key={i}>
                <input value={b.voltage} onChange={(e) => setBec(i, 'voltage', e.target.value)} placeholder="9V" aria-label="напруга" />
                <input inputMode="decimal" value={b.max_current_a} onChange={(e) => setBec(i, 'max_current_a', e.target.value)} placeholder="A" aria-label="струм A" />
                <input value={b.notes ?? ''} onChange={(e) => setBec(i, 'notes', e.target.value)} placeholder="нотатка (для чого)" aria-label="нотатка" />
                <button className="ghost danger cb-del" onClick={() => removeBec(i)} aria-label="видалити">✕</button>
              </div>
            ))}
          </div>

          <div className="cb-block">
            <div className="cb-block-head">
              <h4>UART-и</h4>
              <button className="ghost cb-add" onClick={addUart}>+ UART</button>
            </div>
            {uarts.map((u, i) => (
              <div className="cb-row cb-uart" key={i}>
                <input value={u.name} onChange={(e) => setUart(i, 'name', e.target.value)} placeholder="UART1" aria-label="назва" />
                <input value={u.pads[0] ?? ''} onChange={(e) => setPad(i, 0, e.target.value)} placeholder="T1" aria-label="TX-пад" />
                <input value={u.pads[1] ?? ''} onChange={(e) => setPad(i, 1, e.target.value)} placeholder="R1" aria-label="RX-пад" />
                <select value={u.recommended_for?.[0] ?? 'any'} onChange={(e) => setRole(i, e.target.value)} aria-label="роль">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <input value={u.default_function ?? ''} onChange={(e) => setUart(i, 'default_function', e.target.value)} placeholder="зайнятий? (напр. ESC telemetry)" aria-label="зайнятість" />
                <button className="ghost danger cb-del" onClick={() => removeUart(i)} aria-label="видалити">✕</button>
              </div>
            ))}
          </div>

          <div className="field">
            <label htmlFor="src">Джерело (посилання на мануал)</label>
            <input id="src" value={editing.source_url} onChange={(e) => patch({ source_url: e.target.value })} placeholder="https://…" />
          </div>

          <div className="jr-form-actions">
            <button className="primary" onClick={save}>Зберегти</button>
            <button className="ghost" onClick={() => setEditing(null)}>Скасувати</button>
            <button className="ghost danger" onClick={() => remove(editing.id)}>Видалити</button>
          </div>
        </section>
      )}

      {!editing && (
        <div className="jr-controls">
          <button className="primary" onClick={() => setEditing(newCustomBoard())}>+ Нова плата</button>
          <div className="jr-io">
            <button className="ghost" onClick={doExport}>↓ експорт</button>
            <button className="ghost" onClick={() => fileInput.current?.click()}>↑ імпорт</button>
            <input ref={fileInput} type="file" accept="application/json,.json" onChange={onImport} hidden />
          </div>
        </div>
      )}

      {!editing && (
        <section className="jr-list" aria-live="polite">
          {loading && <div className="empty">Завантаження…</div>}
          {!loading && boards.length === 0 && (
            <div className="empty">Власних плат ще немає. «Нова плата» — додай ту, що в руках.</div>
          )}
          {boards.map((b) => (
            <article className="jr-card" key={b.id}>
              <header>
                <h3>
                  {b.brand} {b.model} {b.revision}
                </h3>
                <span className="badge draft">власна · draft</span>
                <span className="jr-date">{b.mcu}</span>
              </header>
              <div className="jr-board">
                {b.uarts.length} UART · {(b.voltage?.bec_outputs ?? []).map((x) => x.voltage).join('/') || 'без BEC'}
                {b.firmware_target?.betaflight ? ` · ${b.firmware_target.betaflight}` : ''}
              </div>
              <div className="jr-card-actions">
                <button className="ghost" onClick={() => setEditing(b)}>редагувати</button>
                <button className="ghost danger" onClick={() => remove(b.id)}>видалити</button>
              </div>
            </article>
          ))}
        </section>
      )}

      <footer className="colophon">
        <span>власні плати — локально на пристрої</span>
        <span>завжди draft · звіряй з мануалом</span>
      </footer>
    </main>
  );
}
