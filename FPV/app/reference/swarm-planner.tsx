'use client';

import { useState } from 'react';

// Raceband (рознос 37 МГц, до 8 бортів поряд) — звірено з Oscar Liang / GetFPV.
const RACEBAND: [string, string][] = [
  ['R1', '5658'],
  ['R2', '5695'],
  ['R3', '5732'],
  ['R4', '5769'],
  ['R5', '5806'],
  ['R6', '5843'],
  ['R7', '5880'],
  ['R8', '5917'],
];

// Інтерактивний планувальник: скільки бортів одночасно в повітрі → які канали 5.8 ГГц
// рознести, щоб відео не глушило одне одного. Аналог = до 8 (Raceband).
export function SwarmPlanner() {
  const [count, setCount] = useState(4);
  const assigned = RACEBAND.slice(0, Math.min(count, 8));

  return (
    <div className="sw-plan">
      <div className="caps" role="group" aria-label="Кількість бортів у повітрі">
        <span className="caps-label">бортів у повітрі:</span>
        {[2, 3, 4, 5, 6, 7, 8].map((n) => (
          <button
            key={n}
            className={`cap ${count === n ? 'on' : ''}`}
            aria-pressed={count === n}
            onClick={() => setCount(n)}
          >
            {n}
          </button>
        ))}
      </div>

      <table className="rf-table">
        <thead>
          <tr>
            <th>Борт</th>
            <th>VTX-канал (5.8 ГГц)</th>
            <th>Частота, МГц</th>
          </tr>
        </thead>
        <tbody>
          {assigned.map(([ch, f], i) => (
            <tr key={ch}>
              <td className="rf-key">#{i + 1}</td>
              <td>{ch}</td>
              <td>{f}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="rf-note">
        Raceband рознесений на 37 МГц — до 8 бортів поряд на аналозі. Більше 8 — змішуй бенди дуже
        обережно (ризик IMD-завад) або переходь на цифрове відео / оптоволокно.
      </p>
      <div className="check-note">
        ⚠ <b>ELRS (керування)</b> використовує FHSS — ручний канал не потрібен, борти співіснують на
        одному діапазоні. Але: кожному борту <b>унікальна binding phrase</b>, а на одному packet rate
        борти ділять ефір (багато бортів = менше «повітря» кожному). Розводь керування й відео по
        різних діапазонах для завадостійкості.
      </div>
    </div>
  );
}
