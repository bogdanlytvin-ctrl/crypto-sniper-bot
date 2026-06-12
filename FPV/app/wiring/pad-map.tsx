import type { Board } from '@/lib/engine';

// Схема падів плати з її профілю. Не фото — згенерована з даних, тому завжди
// збігається з профілем. Статус DRAFT: звіряти з фізичною платою перед пайкою.
export function BoardPads({ board }: { board: Board }) {
  const becs = board.voltage?.bec_outputs ?? [];
  return (
    <div className="padmap">
      <div className="padmap-board">
        <div className="padmap-mcu">
          {board.brand} {board.model} {board.revision} · {board.mcu}
        </div>

        <div className="padmap-section">
          <h4>UART (сигнальні пади)</h4>
          {board.uarts.map((u) => (
            <div className="pm-row" key={u.name}>
              <span className="pm-name">{u.name}</span>
              <span className="pm-pad signal">{u.pads[0] ?? '?'}</span>
              <span className="pm-pad signal">{u.pads[1] ?? '?'}</span>
              <span className="pm-role">
                {u.default_function ?? u.recommended_for?.[0] ?? '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="padmap-section">
          <h4>Живлення</h4>
          {becs.map((b) => (
            <div className="pm-row" key={b.voltage}>
              <span className="pm-pad power">{b.voltage}</span>
              <span className="pm-role">
                до {b.max_current_a} A{b.notes ? ` · ${b.notes}` : ''}
              </span>
            </div>
          ))}
          <div className="pm-row">
            <span className="pm-pad ground">GND</span>
            <span className="pm-role">земля (спільна)</span>
          </div>
        </div>

        {board.i2c && board.i2c.length > 0 && (
          <div className="padmap-section">
            <h4>I2C</h4>
            {board.i2c.map((bus) => (
              <div className="pm-row" key={bus.name}>
                <span className="pm-name">{bus.name}</span>
                {bus.pads.map((p) => (
                  <span className="pm-pad i2c" key={p}>
                    {p}
                  </span>
                ))}
                <span className="pm-role">{bus.recommended_for?.join(', ') ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="padmap-note">
        Схема згенерована з профілю плати (DRAFT). Звір із фізичною платою й мануалом перед пайкою —
        розташування падів тут умовне, важливі назви й ролі.
      </p>
    </div>
  );
}
