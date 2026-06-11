'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { buildPlan, type Component } from '@/lib/engine';
import { BOARDS, RECEIVERS, VTXS, GPSES } from '@/lib/data';

const NONE = '—';

function Selector({
  label,
  hint,
  value,
  onChange,
  options,
  allowNone,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  allowNone?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={label}>{label}</label>
      <select id={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {allowNone && <option value={NONE}>— не використовую —</option>}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

const statusLabel: Record<string, { text: string; cls: string }> = {
  draft: { text: 'DRAFT · не звірено', cls: 'draft' },
  manual_checked: { text: 'звірено з мануалом', cls: 'checked' },
  field_tested: { text: 'перевірено в полі', cls: 'checked' },
};

export default function WiringPage() {
  const [boardId, setBoardId] = useState(BOARDS[0].id);
  const [rxId, setRxId] = useState(RECEIVERS[0]?.id ?? NONE);
  const [vtxId, setVtxId] = useState(VTXS[0]?.id ?? NONE);
  const [gpsId, setGpsId] = useState(NONE);

  const board = BOARDS.find((b) => b.id === boardId)!;

  const selected = useMemo(() => {
    const pick = (id: string, list: Component[]) =>
      id === NONE ? null : (list.find((c) => c.id === id) ?? null);
    return [pick(rxId, RECEIVERS), pick(vtxId, VTXS), pick(gpsId, GPSES)].filter(
      Boolean,
    ) as Component[];
  }, [rxId, vtxId, gpsId]);

  const plan = useMemo(() => buildPlan(board, selected), [board, selected]);
  const status = statusLabel[board.verified.status] ?? statusLabel.draft;

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / карта підключення
        </div>
        <h1>
          Карта підключення<span className="cursor">_</span>
        </h1>
        <p>
          Обери польотний контролер і компоненти — отримай UART-и, пади, живлення і
          налаштування Betaflight. Підказка не замінює мануал: перед пайкою звір пінаут із
          документацією виробника.
        </p>
      </header>

      <div className="grid">
        <section className="panel" aria-label="Вибір компонентів">
          <Selector
            label="Польотний контролер"
            value={boardId}
            onChange={setBoardId}
            options={BOARDS.map((b) => ({
              id: b.id,
              name: `${b.brand} ${b.model} ${b.revision}`,
            }))}
          />
          <Selector
            label="Приймач (RX)"
            value={rxId}
            onChange={setRxId}
            allowNone
            options={RECEIVERS.map((c) => ({ id: c.id, name: `${c.brand} ${c.model}` }))}
          />
          <Selector
            label="VTX (відео)"
            value={vtxId}
            onChange={setVtxId}
            allowNone
            options={VTXS.map((c) => ({
              id: c.id,
              name: `${c.brand} ${c.model}${c.type === 'vtx_analog' ? ' (аналог)' : ''}`,
            }))}
          />
          <Selector
            label="GPS"
            value={gpsId}
            onChange={setGpsId}
            allowNone
            hint="Модулі з компасом додатково займають шину I2C."
            options={GPSES.map((c) => ({ id: c.id, name: `${c.brand} ${c.model}` }))}
          />
        </section>

        <section className="plan" aria-label="План підключення" aria-live="polite">
          <div className="plan-head">
            <h2>
              {board.brand} {board.model} {board.revision} · {board.mcu}
            </h2>
            <span className={`badge ${status.cls}`}>{status.text}</span>
          </div>

          {plan.globalWarnings.map((w) => (
            <div className="global-warn" key={w}>
              ⚠ {w}
            </div>
          ))}

          {selected.length === 0 && (
            <div className="empty">
              Додай хоча б один компонент зліва — і тут з&apos;явиться план підключення.
            </div>
          )}

          {plan.assignments.map((a) => (
            <article className="assignment" key={a.component.id}>
              <header>
                <h3>
                  {a.component.brand} {a.component.model}
                </h3>
                <span className="proto">{a.component.protocol}</span>
                <span className={`port ${a.uart ? '' : 'conflict'}`}>
                  {a.uart ? a.uart.name : 'НЕМАЄ ВІЛЬНОГО UART'}
                </span>
              </header>

              {a.uart && (
                <div className="wires">
                  {a.wires.map((w, i) => (
                    <div className={`wire ${w.kind}`} key={i}>
                      <span className="pin">{w.from}</span>
                      <span className="lead" aria-hidden="true" />
                      <span className="pad">{w.to}</span>
                    </div>
                  ))}
                </div>
              )}

              {a.component.firmware_notes && (
                <div className="fwnote">
                  <b>Прошивка:</b> {a.component.firmware_notes}
                </div>
              )}

              {a.warnings.map((w) => (
                <div className="warnbox" key={w}>
                  ⚠ {w}
                </div>
              ))}
            </article>
          ))}

          {selected.length > 0 && (
            <p className="source">
              Джерело профілю плати:{' '}
              <a href={board.source_url} target="_blank" rel="noopener noreferrer">
                офіційний мануал
              </a>
              . Відповідальність за фінальну перевірку — на техніку.
            </p>
          )}
        </section>
      </div>

      <footer className="colophon">
        <span>плат у базі: {BOARDS.length}</span>
        <span>компонентів: {RECEIVERS.length + VTXS.length + GPSES.length}</span>
        <span>дані: офіційні мануали виробників</span>
      </footer>
    </main>
  );
}
