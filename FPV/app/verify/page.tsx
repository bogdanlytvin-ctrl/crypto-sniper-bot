'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { BOARDS, FLOWS } from '@/lib/data';
import type { VerifyStatus } from '@/lib/diagnostics';
import {
  boardKey,
  deleteVerification,
  exportVerifications,
  flowKey,
  importVerifications,
  saveVerification,
  useVerifications,
  type VerificationRecord,
} from '@/lib/verify';

const STATUS_LABEL: Record<VerifyStatus, string> = {
  draft: 'DRAFT · не звірено',
  manual_checked: 'звірено з мануалом',
  field_tested: 'перевірено в полі',
};
const STATUS_CLS: Record<VerifyStatus, string> = {
  draft: 'draft',
  manual_checked: 'checked',
  field_tested: 'checked',
};

function Row({
  label,
  recKey,
  base,
  existing,
  onSaved,
}: {
  label: string;
  recKey: string;
  base: VerifyStatus;
  existing: VerificationRecord | undefined;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<VerifyStatus>(existing?.status ?? base);
  const [checkedBy, setCheckedBy] = useState(existing?.checkedBy ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [busy, setBusy] = useState(false);
  const effective = existing?.status ?? base;

  async function save() {
    setBusy(true);
    await saveVerification({ key: recKey, status, checkedBy, note, date: Date.now() });
    setBusy(false);
    onSaved();
  }
  async function revert() {
    setBusy(true);
    await deleteVerification(recKey);
    setBusy(false);
    setStatus(base);
    setCheckedBy('');
    setNote('');
    onSaved();
  }

  return (
    <div className="vf-row">
      <div className="vf-head">
        <span className="vf-name">{label}</span>
        <span className={`badge ${STATUS_CLS[effective]}`}>{STATUS_LABEL[effective]}</span>
      </div>
      <div className="vf-controls">
        <select value={status} onChange={(e) => setStatus(e.target.value as VerifyStatus)}>
          <option value="draft">draft — не звірено</option>
          <option value="manual_checked">manual_checked — звірено з мануалом</option>
          <option value="field_tested">field_tested — перевірено в полі</option>
        </select>
        <input
          value={checkedBy}
          onChange={(e) => setCheckedBy(e.target.value)}
          placeholder="хто звірив (позивний)"
        />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="нотатка" />
        <button className="primary vf-save" onClick={save} disabled={busy}>
          зберегти
        </button>
        {existing && (
          <button className="ghost" onClick={revert} disabled={busy}>
            скинути
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const { map, reload } = useVerifications();
  const fileInput = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    let verified = 0;
    map.forEach((r) => {
      if (r.status !== 'draft') verified++;
    });
    return { verified, total: BOARDS.length + FLOWS.length };
  }, [map]);

  async function doExport() {
    const json = await exportVerifications();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ftos-verify-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const n = await importVerifications(await file.text());
      await reload();
      alert(`Імпортовано звірок: ${n}`);
    } catch {
      alert('Не вдалося імпортувати: невірний файл звірок.');
    }
  }

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / звірка даних
        </div>
        <h1>
          Звірка даних<span className="cursor">_</span>
        </h1>
        <p>
          Усі профілі плат і дерева діагностики — DRAFT (типові дані). Технік-практик звіряє й піднімає
          статус. Експортуй файл звірок і роздай бригаді — у всіх будуть перевірені дані.
        </p>
      </header>

      <div className="vf-bar">
        <span>
          звірено: {stats.verified} / {stats.total}
        </span>
        <div className="vf-io">
          <button className="ghost" onClick={doExport}>
            ↓ експорт звірок
          </button>
          <button className="ghost" onClick={() => fileInput.current?.click()}>
            ↑ імпорт звірок
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" onChange={onImport} hidden />
        </div>
      </div>

      <section className="vf-section">
        <h2>Плати ({BOARDS.length})</h2>
        {BOARDS.map((b) => {
          const key = boardKey(b.id);
          return (
            <Row
              key={key}
              recKey={key}
              label={`${b.brand} ${b.model} ${b.revision}`}
              base={b.verified.status}
              existing={map.get(key)}
              onSaved={reload}
            />
          );
        })}
      </section>

      <section className="vf-section">
        <h2>Дерева діагностики ({FLOWS.length})</h2>
        {FLOWS.map((f) => {
          const key = flowKey(f.id);
          return (
            <Row
              key={key}
              recKey={key}
              label={f.symptom}
              base={f.verified.status}
              existing={map.get(key)}
              onSaved={reload}
            />
          );
        })}
      </section>

      <footer className="colophon">
        <span>звірки — локально на пристрої</span>
        <span>експорт/імпорт для роздачі бригаді</span>
      </footer>
    </main>
  );
}
