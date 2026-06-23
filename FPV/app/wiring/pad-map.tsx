import type { Board } from '@/lib/engine';
import { safeHref } from '@/lib/diagnostics';

// Кольори = мова дротів проєкту (збігається з globals.css)
const C = {
  board: '#0d1811',
  edge: '#24402f',
  copper: '#8a6230',
  copperText: '#c9863b',
  dim: '#93a698',
  mcu: '#0a130d',
  signal: '#e3c44b',
  power: '#d4584a',
  ground: '#7c8a80',
  i2c: '#5b9bd5',
};

function Pad({
  x,
  y,
  w,
  h,
  color,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={C.board} stroke={color} strokeWidth={1.5} />
      <text
        x={x + w / 2}
        y={y + h / 2}
        fill={color}
        fontSize={11}
        fontFamily="monospace"
        fontWeight={700}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {label}
      </text>
    </g>
  );
}

// Візуальна (стилізована) схема плати, згенерована з профілю. НЕ фізичні координати —
// пади згруповано за функцією. Точні ролі/пади — у таблиці нижче.
function BoardDiagram({ board }: { board: Board }) {
  const uarts = board.uarts ?? [];
  const becs = board.voltage?.bec_outputs ?? [];
  const i2c = board.i2c ?? [];
  const motors = board.motor_outputs ?? 0;

  const rightItems = [
    ...becs.map((b) => ({ label: b.voltage, color: C.power })),
    { label: 'GND', color: C.ground },
    ...i2c.flatMap((bus) => bus.pads.map((p) => ({ label: p, color: C.i2c }))),
  ];

  const rowH = 36;
  const top = 64;
  const rows = Math.max(uarts.length, rightItems.length, 1);
  const bodyH = rows * rowH;
  const motorH = motors > 0 ? 58 : 12;
  const W = 430;
  const H = top + bodyH + motorH + 20;

  const mcuW = 96;
  const mcuH = Math.max(40, Math.min(bodyH - 24, 130));
  const mcuX = W / 2 - mcuW / 2;
  const mcuY = top + (bodyH - mcuH) / 2;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Схема падів ${board.brand} ${board.model} ${board.revision}`}
      className="bd-svg"
    >
      <defs>
        <pattern id="bd-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#16271c" />
        </pattern>
      </defs>

      {/* PCB */}
      <rect x={8} y={8} width={W - 16} height={H - 16} rx={16} fill={C.board} stroke={C.copper} strokeWidth={2} />
      <rect x={8} y={8} width={W - 16} height={H - 16} rx={16} fill="url(#bd-grid)" />

      {/* монтажні отвори */}
      {(
        [
          [26, 26],
          [W - 26, 26],
          [26, H - 26],
          [W - 26, H - 26],
        ] as const
      ).map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={7} fill={C.mcu} stroke={C.edge} strokeWidth={1.5} />
      ))}

      {/* заголовок */}
      <text x={W / 2} y={30} fill={C.copperText} fontSize={12} fontFamily="monospace" textAnchor="middle">
        {board.brand} {board.model} {board.revision}
      </text>
      <text x={W / 2} y={47} fill={C.dim} fontSize={10} fontFamily="monospace" textAnchor="middle">
        схема умовна — звір з фізичною платою
      </text>

      {/* MCU */}
      <rect x={mcuX} y={mcuY} width={mcuW} height={mcuH} rx={6} fill={C.mcu} stroke={C.edge} strokeWidth={1.5} />
      <text
        x={W / 2}
        y={mcuY + mcuH / 2}
        fill={C.dim}
        fontSize={11}
        fontFamily="monospace"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {board.mcu}
      </text>

      {/* ліворуч: UART-и (сигнальні пади) */}
      {uarts.map((u, i) => {
        const y = top + i * rowH + 4;
        const padW = 28;
        const padH = 20;
        const gap = 6;
        const x0 = 22;
        const [t, r] = u.pads;
        return (
          <g key={u.name}>
            <line x1={x0 + padW * 2 + gap} y1={y + padH / 2} x2={mcuX} y2={y + padH / 2} stroke={C.signal} strokeWidth={1} opacity={0.3} />
            <Pad x={x0} y={y} w={padW} h={padH} color={C.signal} label={t ?? '?'} />
            <Pad x={x0 + padW + gap} y={y} w={padW} h={padH} color={C.signal} label={r ?? '?'} />
            <text x={x0} y={y + padH + 11} fill={C.dim} fontSize={9} fontFamily="monospace">
              {u.name}
              {u.default_function ? ` · ${u.default_function}` : ''}
            </text>
          </g>
        );
      })}

      {/* праворуч: живлення + I2C */}
      {rightItems.map((it, i) => {
        const y = top + i * rowH + 4;
        const padW = 46;
        const padH = 20;
        const x0 = W - 22 - padW;
        return (
          <g key={`${it.label}-${i}`}>
            <line x1={mcuX + mcuW} y1={y + padH / 2} x2={x0} y2={y + padH / 2} stroke={it.color} strokeWidth={1} opacity={0.3} />
            <Pad x={x0} y={y} w={padW} h={padH} color={it.color} label={it.label} />
          </g>
        );
      })}

      {/* знизу: виходи моторів */}
      {motors > 0 &&
        Array.from({ length: motors }).map((_, i) => {
          const sq = 26;
          const gap = 8;
          const totalW = motors * sq + (motors - 1) * gap;
          const startX = W / 2 - totalW / 2;
          return (
            <Pad
              key={i}
              x={startX + i * (sq + gap)}
              y={top + bodyH + 16}
              w={sq}
              h={sq}
              color={C.signal}
              label={`M${i + 1}`}
            />
          );
        })}
      {motors > 0 && (
        <text x={W / 2} y={top + bodyH + 16 + 26 + 12} fill={C.dim} fontSize={9} fontFamily="monospace" textAnchor="middle">
          виходи моторів (сигнал)
        </text>
      )}
    </svg>
  );
}

// Схема падів плати з її профілю. Не фото — згенерована з даних, тому завжди
// збігається з профілем. Статус DRAFT: звіряти з фізичною платою перед пайкою.
export function BoardPads({ board }: { board: Board }) {
  const becs = board.voltage?.bec_outputs ?? [];
  return (
    <div className="padmap">
      <div className="padmap-head">
        <span className="badge draft">схема умовна · не фізична</span>
        <a
          className="padmap-link"
          href={safeHref(board.source_url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Офіційний пінаут ↗
        </a>
      </div>

      <div className="padmap-board">
        <BoardDiagram board={board} />

        {/* легенда кольорів */}
        <div className="bd-legend">
          <span className="bd-leg signal">сигнал (UART/мотори)</span>
          <span className="bd-leg power">живлення (BEC)</span>
          <span className="bd-leg ground">GND</span>
          <span className="bd-leg i2c">I2C</span>
        </div>

        <div className="padmap-section">
          <h4>UART (сигнальні пади)</h4>
          {board.uarts.map((u) => (
            <div className="pm-row" key={u.name}>
              <span className="pm-name">{u.name}</span>
              <span className="pm-pad signal">{u.pads[0] ?? '?'}</span>
              <span className="pm-pad signal">{u.pads[1] ?? '?'}</span>
              <span className="pm-role">{u.default_function ?? u.recommended_for?.[0] ?? '—'}</span>
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
        Схема згенерована з профілю плати (DRAFT) і <b>умовна</b> — розташування падів не фізичне,
        важливі назви й ролі. Звір із фізичною платою й мануалом перед пайкою.
      </p>
    </div>
  );
}
