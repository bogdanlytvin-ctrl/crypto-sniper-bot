// Легенда статусів довіри — розкривна (native <details>, без JS, доступна).
// Пояснює систему draft → звірено, щоб новачок розумів кольори бейджів.
export function StatusLegend() {
  return (
    <details className="status-legend">
      <summary>Що означають статуси даних?</summary>
      <ul>
        <li>
          <span className="badge draft">DRAFT</span>
          заповнено, але <b>не звірено</b> — перевір сам перед діями (пайка/прошивка).
        </li>
        <li>
          <span className="badge checked">звірено з мануалом</span>
          підтверджено офіційною документацією виробника.
        </li>
        <li>
          <span className="badge checked">перевірено в полі</span>
          підтверджено на реальному залізі техніком.
        </li>
      </ul>
      <p>Підняти статус (локально, з експортом для бригади) — через інструмент «Звірка даних».</p>
    </details>
  );
}
