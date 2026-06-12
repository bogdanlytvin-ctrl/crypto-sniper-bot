'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { BOARDS } from '@/lib/data';
import { MspClient, webSerialSupported, type MspIdentity } from '@/lib/msp';
import type { Board } from '@/lib/engine';

type Status = 'idle' | 'connecting' | 'connected' | 'error';

function matchBoard(id: MspIdentity): Board | null {
  const t = id.targetName.toUpperCase();
  const bid = id.boardIdentifier.toUpperCase();
  const byTarget = BOARDS.find((b) => (b.firmware_target?.betaflight ?? '').toUpperCase() === t);
  if (byTarget) return byTarget;
  if (bid) {
    const byId = BOARDS.find((b) =>
      (b.firmware_target?.betaflight ?? '').toUpperCase().includes(bid),
    );
    if (byId) return byId;
  }
  return null;
}

export default function ConnectPage() {
  const supported = webSerialSupported();
  const clientRef = useRef<MspClient | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [identity, setIdentity] = useState<MspIdentity | null>(null);

  const matched = identity ? matchBoard(identity) : null;

  async function connect() {
    setError('');
    setStatus('connecting');
    const client = new MspClient();
    clientRef.current = client;
    try {
      await client.connect();
      const id = await client.readIdentity();
      setIdentity(id);
      setStatus('connected');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка підключення');
      setStatus('error');
      await client.disconnect();
      clientRef.current = null;
    }
  }

  async function disconnect() {
    await clientRef.current?.disconnect();
    clientRef.current = null;
    setStatus('idle');
    setIdentity(null);
    setError('');
  }

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / плата по USB
        </div>
        <h1>
          Опитати плату<span className="cursor">_</span>
        </h1>
        <p>
          Підключи польотний контролер кабелем — FTOS прочитає, що це за плата, прошивка й версія,
          і зіставить із базою. Працює лише в desktop Chrome / Edge.
        </p>
      </header>

      {!supported && (
        <div className="global-warn">
          ⚠ Web Serial недоступний у цьому браузері. Потрібен desktop Chrome або Edge (на телефоні й
          у Safari не працює). Решта FTOS працює всюди.
        </div>
      )}

      {supported && (
        <section className="cn">
          {status !== 'connected' && (
            <button className="primary" onClick={connect} disabled={status === 'connecting'}>
              {status === 'connecting' ? 'Підключення…' : '▸ Підключити плату по USB'}
            </button>
          )}
          {status === 'connected' && (
            <button className="ghost" onClick={disconnect}>
              Відключити
            </button>
          )}

          {status === 'error' && <div className="warnbox">⚠ {error}</div>}

          {identity && (
            <article className="cn-card">
              <h2>Плата відповіла</h2>
              <dl className="cn-grid">
                <div>
                  <dt>Прошивка</dt>
                  <dd>{identity.fcVariant}</dd>
                </div>
                <div>
                  <dt>Версія</dt>
                  <dd>{identity.fcVersion}</dd>
                </div>
                <div>
                  <dt>MSP API</dt>
                  <dd>{identity.apiVersion}</dd>
                </div>
                <div>
                  <dt>ID плати</dt>
                  <dd>{identity.boardIdentifier || '—'}</dd>
                </div>
                <div className="cn-wide">
                  <dt>Target</dt>
                  <dd>{identity.targetName || '— (не передано прошивкою)'}</dd>
                </div>
              </dl>

              {matched ? (
                <div className="cn-match ok">
                  <b>Є в базі:</b> {matched.brand} {matched.model} {matched.revision} ({matched.mcu})
                  <div className="cn-links">
                    <Link href="/diagnose" className="ghost">
                      → Діагностика
                    </Link>
                    <Link href="/wiring" className="ghost">
                      → Карта пайки
                    </Link>
                    <Link href="/firmware" className="ghost">
                      → Прошивка
                    </Link>
                  </div>
                  <p className="cn-hint">Обери цю плату у відповідному інструменті зі списку.</p>
                </div>
              ) : (
                <div className="cn-match miss">
                  Плати немає в базі FTOS. Додай профіль за target{' '}
                  <code>{identity.targetName || identity.boardIdentifier || '?'}</code>.
                </div>
              )}
            </article>
          )}

          <p className="source">
            Зараз читаємо лише ідентифікацію (variant / версія / target) — це парситься надійно.
            Arming-прапори й зайняті порти — наступний крок, після звірки на залізі.
          </p>
        </section>
      )}

      <footer className="colophon">
        <span>протокол: MSP через Web Serial</span>
        <span>тільки desktop Chrome / Edge</span>
      </footer>
    </main>
  );
}
