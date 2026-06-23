'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StatusLegend } from '../status-legend';
import { FLOWS } from '@/lib/data';
import { useStickyBoardId } from '@/lib/prefs';
import { useAllBoards } from '@/lib/custom-boards';
import { newRepair, saveRepair } from '@/lib/idb';
import { effectiveStatus, flowKey, useVerifications } from '@/lib/verify';
import {
  getNode,
  isCause,
  resolvePad,
  safeHref,
  type CauseNode,
  type CheckMethod,
  type Confidence,
  type FixAction,
  type Outcome,
  type PathStep,
} from '@/lib/diagnostics';

const METHOD: Record<CheckMethod, string> = {
  visual: 'огляд',
  multimeter: 'мультиметр',
  configurator: 'Betaflight',
  swap: 'підміна',
  listen: 'на слух',
};

const CONFIDENCE: Record<Confidence, { label: string; cls: string }> = {
  likely: { label: 'ймовірно', cls: 'likely' },
  possible: { label: 'можливо', cls: 'possible' },
};

const FIX_ACTION: Record<FixAction, string> = {
  rewire: 'перепідключення',
  reflash: 'перепрошивка',
  replace: 'заміна',
  resolder: 'перепайка',
  configure: 'налаштування',
  clean: 'чистка',
};

const flowStatus: Record<string, { text: string; cls: string }> = {
  draft: { text: 'DRAFT · не звірено живим ремонтом', cls: 'draft' },
  manual_checked: { text: 'звірено з мануалом', cls: 'checked' },
  field_tested: { text: 'перевірено в полі', cls: 'checked' },
};

// Що може бути на борту — для фільтра симптомів за applies_to.
const CAPS: { key: string; label: string }[] = [
  { key: 'receiver', label: 'Приймач' },
  { key: 'vtx_digital', label: 'Цифровий VTX' },
  { key: 'vtx_analog', label: 'Аналоговий VTX' },
  { key: 'gps', label: 'GPS' },
  { key: 'fiber', label: 'Оптоволокно' },
  { key: 'release', label: 'Скид/реліз' },
];
const ALL_CAPS = CAPS.map((c) => c.key);

export default function DiagnosePage() {
  const router = useRouter();
  const { map: verifyMap } = useVerifications();
  const [boardId, setBoardId] = useStickyBoardId();
  const [caps, setCaps] = useState<string[]>(ALL_CAPS);
  const [query, setQuery] = useState('');
  const [flowId, setFlowId] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [history, setHistory] = useState<PathStep[]>([]);

  const allBoards = useAllBoards();
  const board = useMemo(
    () => allBoards.find((b) => b.id === boardId) ?? allBoards[0],
    [allBoards, boardId],
  );
  const flow = useMemo(() => FLOWS.find((f) => f.id === flowId) ?? null, [flowId]);

  // Показуємо лише симптоми, релевантні до того, що на борту (applies_to).
  const visibleFlows = useMemo(
    () =>
      FLOWS.filter((f) => {
        const need = f.applies_to?.has;
        if (!need || need.length === 0) return true;
        return need.some((h) => caps.includes(h));
      }),
    [caps],
  );

  // Додатковий текстовий пошук по симптомах (швидко знайти під тиском).
  const shownFlows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleFlows;
    return visibleFlows.filter(
      (f) => f.symptom.toLowerCase().includes(q) || (f.summary ?? '').toLowerCase().includes(q),
    );
  }, [visibleFlows, query]);

  function toggleCap(key: string) {
    setCaps((c) => (c.includes(key) ? c.filter((k) => k !== key) : [...c, key]));
  }

  function startFlow(id: string) {
    const f = FLOWS.find((x) => x.id === id);
    if (!f) return;
    setFlowId(id);
    setCurrentId(f.entry);
    setHistory([]);
  }

  function choose(outcome: Outcome) {
    if (!flow || !currentId) return;
    const node = getNode(flow, currentId);
    if (!node || node.type !== 'check') return;
    setHistory((h) => [...h, { node, chosen: outcome }]);
    setCurrentId(outcome.next);
  }

  function goBack() {
    if (!history.length) return;
    setCurrentId(history[history.length - 1].node.id);
    setHistory((h) => h.slice(0, -1));
  }

  function reset() {
    setFlowId(null);
    setCurrentId(null);
    setHistory([]);
  }

  // Зміна плати посеред дерева збила б прив'язку pad_ref до старого заліза —
  // тому скидаємо проходження, щоб технік не міряв «9V» не на тій платі.
  function changeBoard(id: string) {
    setBoardId(id);
    if (flowId) reset();
  }

  async function saveToJournal(cause: CauseNode) {
    const rec = newRepair({
      boardId: board.id,
      boardLabel: `${board.brand} ${board.model} ${board.revision}`,
      symptomId: flow?.id,
      symptomLabel: flow?.symptom,
      causeLabel: cause.cause,
      fixAction: cause.fix_action,
      minutesSpent: cause.est_minutes,
    });
    try {
      await saveRepair(rec);
      localStorage.setItem('ftos:open-edit', rec.id);
      router.push('/journal');
    } catch {
      alert('Не вдалося зберегти в журнал на цьому пристрої.');
    }
  }

  const node = flow && currentId ? getNode(flow, currentId) : null;
  const effStatus = flow
    ? effectiveStatus(flow.verified.status, verifyMap, flowKey(flow.id))
    : null;
  const status = effStatus ? flowStatus[effStatus] ?? flowStatus.draft : null;
  const broken = Boolean(flow && currentId && !node); // «бите» дерево

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / діагностика
        </div>
        <h1>
          Що зламалось?<span className="cursor">_</span>
        </h1>
        <p>
          Обери плату й симптом — пройдемо по перевірках крок за кроком. Кожен крок прив&apos;язаний
          до падів саме твоєї плати.
        </p>
      </header>

      <StatusLegend />

      <div className="field dx-board">
        <label htmlFor="board">Польотний контролер</label>
        <select id="board" value={boardId} onChange={(e) => changeBoard(e.target.value)}>
          {allBoards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.brand} {b.model} {b.revision}
              {b.custom ? ' ★ власна' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Що на борту — фільтр симптомів */}
      {!flow && (
        <div className="caps" role="group" aria-label="Що на борту">
          <span className="caps-label">на борту:</span>
          {CAPS.map((c) => (
            <button
              key={c.key}
              className={`cap ${caps.includes(c.key) ? 'on' : ''}`}
              aria-pressed={caps.includes(c.key)}
              onClick={() => toggleCap(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Пошук по симптомах */}
      {!flow && (
        <div className="field dx-search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 пошук симптому (напр. «відео», «арм», «GPS»)"
            aria-label="Пошук симптому"
          />
        </div>
      )}

      {/* Вибір симптому */}
      {!flow && (
        <section className="symptoms" aria-label="Симптоми">
          {shownFlows.length === 0 && (
            <div className="empty">
              {query.trim()
                ? `За запитом «${query.trim()}» симптомів немає. Спробуй інакше або очисти пошук.`
                : 'За обраними компонентами симптомів немає. Увімкни більше пунктів «на борту».'}
            </div>
          )}
          {shownFlows.map((f) => (
            <button key={f.id} className="symptom" onClick={() => startFlow(f.id)}>
              <span className="symptom-name">{f.symptom}</span>
              {f.summary && <span className="symptom-sum">{f.summary}</span>}
            </button>
          ))}
        </section>
      )}

      {/* Проходження дерева */}
      {flow && (
        <section className="dx" aria-live="polite">
          <div className="dx-head">
            <h2>{flow.symptom}</h2>
            {status && <span className={`badge ${status.cls}`}>{status.text}</span>}
            <button className="dx-reset" onClick={reset}>
              інший симптом
            </button>
          </div>

          {/* Хлібні крихти пройдених кроків */}
          {history.length > 0 && (
            <ol className="dx-trail">
              {history.map((s, i) => (
                <li key={i}>
                  <span className="trail-q">{s.node.instruction}</span>
                  <span className="trail-a">{s.chosen.label}</span>
                </li>
              ))}
            </ol>
          )}

          {broken && (
            <div className="global-warn">
              ⚠ Дерево діагностики пошкоджене (обірваний крок). Обери інший симптом.
            </div>
          )}

          {/* Поточна перевірка */}
          {node && node.type === 'check' && (
            <article className="check">
              <div className="check-method">{METHOD[node.method]}</div>
              <h3 className="check-q">{node.instruction}</h3>

              {node.pad_ref &&
                (() => {
                  const p = resolvePad(board, node.pad_ref!);
                  return (
                    <div className={`padref ${p.missing ? 'missing' : ''}`}>
                      <span className="padref-label">{p.label}</span>
                      {p.detail && <span className="padref-detail">{p.detail}</span>}
                      {p.missing && (
                        <span className="padref-detail">
                          на цій платі такого виходу немає в профілі — звір з мануалом
                        </span>
                      )}
                    </div>
                  );
                })()}

              {node.expected && (
                <div className="check-expected">
                  <b>В нормі:</b> {node.expected}
                </div>
              )}
              {node.note && <div className="check-note">⚠ {node.note}</div>}

              <div className="answers">
                {node.outcomes.map((o) => (
                  <button key={o.label} className="answer" onClick={() => choose(o)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </article>
          )}

          {/* Причина + фікс */}
          {node && isCause(node) && (
            <article className="cause">
              <div className="cause-head">
                <span className={`conf ${CONFIDENCE[node.confidence].cls}`}>
                  {CONFIDENCE[node.confidence].label}
                </span>
                {node.fix_action && (
                  <span className="fix-tag">{FIX_ACTION[node.fix_action]}</span>
                )}
                {node.est_minutes != null && (
                  <span className="est">~{node.est_minutes} хв</span>
                )}
              </div>
              <h3 className="cause-title">{node.cause}</h3>
              <div className="cause-warn">
                ⚠ Ймовірна причина — перевір перед заміною деталей.
              </div>
              <ol className="fix-steps">
                {node.fix_steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <p className="source">
                Джерело:{' '}
                <a href={safeHref(node.source_url)} target="_blank" rel="noopener noreferrer">
                  документація
                </a>
              </p>
              <button className="save-repair" onClick={() => saveToJournal(node)}>
                + Записати в журнал ремонту
              </button>
            </article>
          )}

          <div className="dx-controls">
            {history.length > 0 && (
              <button className="ghost" onClick={goBack}>
                ← назад
              </button>
            )}
            {node && isCause(node) && (
              <button className="ghost" onClick={() => startFlow(flow.id)}>
                почати спочатку
              </button>
            )}
          </div>
        </section>
      )}

      <footer className="colophon">
        <span>симптомів у базі: {FLOWS.length}</span>
        <span>статус даних: DRAFT — звіряється з ремонтом</span>
      </footer>
    </main>
  );
}
