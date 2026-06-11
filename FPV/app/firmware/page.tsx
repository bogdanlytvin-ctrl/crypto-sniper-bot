'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BOARDS } from '@/lib/data';

const FLASH_STEPS = [
  'Зроби backup: у CLI виконай `diff all` і збережи весь вивід — це твоя страховка.',
  'Зніми пропелери, відключи батарею. Прошивка — тільки по USB.',
  'Обери ПРАВИЛЬНИЙ target (нижче). Невірний target = непрацездатна або окирпичена плата.',
  'Якщо плата не визначається — увійди в DFU (затисни BOOT при під’єднанні USB).',
  'Full chip erase для чистої прошивки (стирає конфіг — тому потрібен backup).',
  'Після прошивки: Load Backup або налаштуй заново (Ports, Modes, Receiver).',
];

const CLI_PRESETS: { title: string; cmd: string; note: string }[] = [
  { title: 'Резервна копія всього конфігу', cmd: 'diff all', note: 'Скопіюй увесь вивід перед будь-якою прошивкою.' },
  { title: 'Статус і версія', cmd: 'status\nversion', note: 'Швидко глянути стан, прапори arming, версію BF.' },
  { title: 'Увімкнути телеметрію', cmd: 'feature TELEMETRY\nsave', note: 'Для CRSF телеметрія йде автоматично; перевір під свою версію.' },
  { title: 'Скинути до заводських', cmd: 'defaults', note: 'УВАГА: стирає весь конфіг. Лише після backup.' },
];

export default function FirmwarePage() {
  const [boardId, setBoardId] = useState(BOARDS[0].id);
  const [copied, setCopied] = useState<string | null>(null);
  const board = BOARDS.find((b) => b.id === boardId) ?? BOARDS[0];

  function copy(text: string) {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(text);
        setTimeout(() => setCopied((c) => (c === text ? null : c)), 1500);
      },
      () => {},
    );
  }

  const bf = board.firmware_target?.betaflight;
  const inav = board.firmware_target?.inav;

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / прошивки
        </div>
        <h1>
          Довідник прошивок<span className="cursor">_</span>
        </h1>
        <p>
          Обери плату — отримай правильний firmware target і чесний чек-лист прошивки. Невірний
          target — найчастіша причина окирпиченої плати.
        </p>
      </header>

      <div className="field dx-board">
        <label htmlFor="fwboard">Польотний контролер</label>
        <select id="fwboard" value={boardId} onChange={(e) => setBoardId(e.target.value)}>
          {BOARDS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.brand} {b.model} {b.revision}
            </option>
          ))}
        </select>
      </div>

      <section className="fw-targets">
        <div className="fw-target">
          <span className="fw-fw">Betaflight</span>
          {bf ? (
            <>
              <code>{bf}</code>
              <button className="fw-copy" onClick={() => copy(bf)}>
                {copied === bf ? '✓' : 'копіювати'}
              </button>
            </>
          ) : (
            <span className="fw-none">target не вказано — звір з мануалом</span>
          )}
        </div>
        <div className="fw-target">
          <span className="fw-fw">iNav</span>
          {inav ? (
            <>
              <code>{inav}</code>
              <button className="fw-copy" onClick={() => copy(inav)}>
                {copied === inav ? '✓' : 'копіювати'}
              </button>
            </>
          ) : (
            <span className="fw-none">офіційного iNav target немає / не вказано</span>
          )}
        </div>
        <div className="fw-mcu">
          MCU: <b>{board.mcu}</b> · живлення: {board.voltage?.input_cells ?? '—'}
          {' · '}
          <a href={board.source_url} target="_blank" rel="noopener noreferrer">
            мануал виробника
          </a>
        </div>
      </section>

      <section className="fw-block">
        <h2>Чек-лист прошивки</h2>
        <ol className="fw-steps">
          {FLASH_STEPS.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <div className="check-note">
          ⚠ Профілі плат у статусі DRAFT — перед прошивкою звір target з офіційним мануалом виробника.
        </div>
      </section>

      <section className="fw-block">
        <h2>Базові CLI-команди</h2>
        <div className="fw-presets">
          {CLI_PRESETS.map((p) => (
            <article className="fw-preset" key={p.title}>
              <header>
                <h3>{p.title}</h3>
                <button className="fw-copy" onClick={() => copy(p.cmd)}>
                  {copied === p.cmd ? '✓' : 'копіювати'}
                </button>
              </header>
              <pre>{p.cmd}</pre>
              <p>{p.note}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="colophon">
        <span>плат у базі: {BOARDS.length}</span>
        <span>target — з профілю плати (DRAFT)</span>
      </footer>
    </main>
  );
}
