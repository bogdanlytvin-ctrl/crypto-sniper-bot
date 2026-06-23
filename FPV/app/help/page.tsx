'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStickyBoardId } from '@/lib/prefs';
import { useAllBoards } from '@/lib/custom-boards';
import { StatusLegend } from '../status-legend';

const TYPES = [
  'дерево діагностики',
  'пінаут плати',
  'карта пайки',
  'target прошивки',
  'інше',
];

export default function HelpPage() {
  const [boardId] = useStickyBoardId();
  const allBoards = useAllBoards();
  const board = allBoards.find((b) => b.id === boardId) ?? allBoards[0];
  const boardLabel = board ? `${board.brand} ${board.model} ${board.revision}`.trim() : '';

  const [type, setType] = useState(TYPES[0]);
  const [subject, setSubject] = useState('');
  const [where, setWhere] = useState('');
  const [shows, setShows] = useState('');
  const [correct, setCorrect] = useState('');
  const [source, setSource] = useState('');
  const [callsign, setCallsign] = useState('');
  const [copied, setCopied] = useState(false);

  function buildReport(): string {
    const date = new Date().toLocaleDateString('uk-UA');
    return [
      'FTOS БАГ-РЕПОРТ',
      `Тип: ${type}`,
      `Плата або дерево: ${subject || boardLabel || '—'}`,
      `Де саме (крок/пад/UART): ${where || '—'}`,
      `Що показує FTOS: ${shows || '—'}`,
      `Має бути насправді: ${correct || '—'}`,
      `Джерело: ${source || '—'}`,
      `Від (позивний): ${callsign || '—'}`,
      `Дата: ${date}`,
    ].join('\n');
  }

  function copyReport() {
    if (!correct.trim() && !shows.trim()) {
      alert('Опиши хоча б «що показує» або «має бути».');
      return;
    }
    const text = buildReport();
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        // fallback — показати текст для ручного копіювання
        window.prompt('Скопіюй звіт вручну:', text);
      },
    );
  }

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / як користуватись
        </div>
        <h1>
          Інструкція + баг-репорт<span className="cursor">_</span>
        </h1>
        <p>
          FTOS підказує — фінальне рішення завжди за тобою. Знайшов помилку в даних? Це найцінніше:
          заповни форму нижче й кинь у чат бригади.
        </p>
      </header>

      <section className="help-block">
        <h2>За 60 секунд</h2>
        <ol className="how">
          <li>
            <span className="how-n">1</span>
            <span>
              <b>Обери свою плату</b> вгорі — запамʼятається в усіх інструментах. Немає в списку?{' '}
              <Link href="/boards">додай у «Власні плати»</Link>.
            </span>
          </li>
          <li>
            <span className="how-n">2</span>
            <span>
              <b>Діагностика</b> — симптом → перевірки на падах твоєї плати → причина й крок фіксу.
            </span>
          </li>
          <li>
            <span className="how-n">3</span>
            <span>
              <b>Карта підключення</b> — UART/пади/живлення. <b>Журнал</b> і <b>Батареї</b> — облік;
              звіт командиру через <b>↓ CSV</b>.
            </span>
          </li>
        </ol>
      </section>

      <section className="help-block">
        <h2>Що означає статус даних</h2>
        <StatusLegend />
        <p className="help-note">
          ⚠ Більшість дерев — <b>DRAFT</b> (не звірені живим ремонтом). Перед пайкою/прошивкою звір із
          офіційним мануалом. Помилка в паді = спалена плата.
        </p>
      </section>

      <section className="help-block">
        <h2>Знайшов помилку? Баг-репорт</h2>
        <div className="jr-form">
          <div className="jr-form-grid">
            <div className="field">
              <label htmlFor="bt">Тип</label>
              <select id="bt" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="bs">Плата або дерево</label>
              <input
                id="bs"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={boardLabel || 'напр. "немає відео"'}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="bw">Де саме (крок / пад / UART)</label>
            <input id="bw" value={where} onChange={(e) => setWhere(e.target.value)} placeholder="напр. крок «VTX гарячий?» / пад T2" />
          </div>
          <div className="field">
            <label htmlFor="bsh">Що показує FTOS</label>
            <input id="bsh" value={shows} onChange={(e) => setShows(e.target.value)} placeholder="що зараз у застосунку" />
          </div>
          <div className="field">
            <label htmlFor="bc">Має бути насправді</label>
            <textarea id="bc" rows={2} value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="правильне значення / крок" />
          </div>
          <div className="jr-form-grid">
            <div className="field">
              <label htmlFor="bsrc">Джерело (якщо є)</label>
              <input id="bsrc" value={source} onChange={(e) => setSource(e.target.value)} placeholder="мануал / посилання / власний досвід" />
            </div>
            <div className="field">
              <label htmlFor="bcs">Від (позивний)</label>
              <input id="bcs" value={callsign} onChange={(e) => setCallsign(e.target.value)} placeholder="хто звірив" />
            </div>
          </div>
          <div className="jr-form-actions">
            <button className="primary" onClick={copyReport}>
              {copied ? '✓ скопійовано — встав у чат' : 'Скопіювати звіт'}
            </button>
            <Link href="/verify" className="ghost-link">
              або підняти статус у «Звірці» →
            </Link>
          </div>
        </div>
      </section>

      <footer className="colophon">
        <span>зворотний зв'язок з поля = головна цінність</span>
        <span>FTOS · офлайн · без хмари</span>
      </footer>
    </main>
  );
}
