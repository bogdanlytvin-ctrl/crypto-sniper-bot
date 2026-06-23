'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { BOARDS } from '@/lib/data';
import { MspClient, webSerialSupported, type MspIdentity, type MspStatus } from '@/lib/msp';
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
  const [live, setLive] = useState<MspStatus | null>(null);

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
      // Живий стан — окремо й best-effort: якщо плата не відповість на MSP_STATUS_EX,
      // ідентифікація все одно лишається показаною.
      try {
        setLive(await client.readStatus());
      } catch {
        setLive(null);
      }
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
    setLive(null);
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

          {live && (
            <article className="cn-card">
              <h2>Що бачить плата</h2>
              <div className="cn-sensors">
                {(
                  [
                    ['gyro', 'гіроскоп'],
                    ['acc', 'акселерометр'],
                    ['baro', 'барометр'],
                    ['mag', 'компас'],
                    ['gps', 'GPS'],
                  ] as const
                ).map(([k, label]) => (
                  <span key={k} className={`sensor ${live.sensors[k] ? 'on' : 'off'}`}>
                    {live.sensors[k] ? '✓' : '✕'} {label}
                  </span>
                ))}
              </div>

              {identity?.fcVariant === 'BTFL' ? (
                live.armingReliable ? (
                  live.armingReady ? (
                    <div className="cn-arm ok">✓ Нічого не блокує арм (за прапорами на момент опитування)</div>
                  ) : (
                    <div className="cn-arm">
                      <b>Блокують арм:</b>
                      <div className="arm-flags">
                        {live.armingReasons.map((r) => (
                          <span key={r} className="arm-flag">
                            {r}
                          </span>
                        ))}
                      </div>
                      <span className="cn-hint">
                        best-effort — назви прапорів залежать від версії BF; фінально звір у CLI{' '}
                        <code>status</code>.
                      </span>
                    </div>
                  )
                ) : (
                  <div className="cn-hint">
                    Прапори арму не вдалося надійно прочитати на цій версії — звір у CLI <code>status</code>.
                  </div>
                )
              ) : (
                <div className="cn-hint">
                  Прапори арму декодуються лише для Betaflight. Сенсори показано для будь-якої прошивки.
                </div>
              )}
            </article>
          )}

          <p className="source">
            Читаємо ідентифікацію (variant / версія / target) і живий стан: сенсори (надійно) та
            прапори заборони арму (best-effort для BF). Конфіг портів — наступний крок.
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
