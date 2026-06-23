import Link from 'next/link';
import { RECIPES } from '@/lib/recipes';
import { safeHref } from '@/lib/diagnostics';

export default function RecipesPage() {
  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / рецепти збірок
        </div>
        <h1>
          Рецепти збірок<span className="cursor">_</span>
        </h1>
        <p>
          Стандартизовані борти під роль: BOM + прошивка + ключові налаштування. Щоб майстерня
          збирала однотипно, а новачок не вгадував. Орієнтир — звіряй під свій конструктив. Усе DRAFT.
        </p>
      </header>

      <div className="rc-list">
        {RECIPES.map((r) => (
          <article className="rc-card" key={r.id}>
            <header className="rc-head">
              <h2>{r.role}</h2>
              <span className="badge draft">DRAFT</span>
            </header>
            <p className="rc-sum">{r.summary}</p>
            <div className="rc-meta">
              <span>рама: {r.frame}</span>
              <span>банки: {r.cells}</span>
              <span>прошивка: {r.firmware}</span>
              <span>FC: {r.fc_hint}</span>
            </div>

            <table className="rf-table">
              <thead>
                <tr>
                  <th>Вузол</th>
                  <th>Специфікація</th>
                </tr>
              </thead>
              <tbody>
                {r.bom.map((b) => (
                  <tr key={b.part}>
                    <td className="rf-key">{b.part}</td>
                    <td>{b.spec}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="rc-notes">
              {r.config_notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>

            <p className="source">
              Джерело:{' '}
              <a href={safeHref(r.source_url)} target="_blank" rel="noopener noreferrer">
                довідка
              </a>
            </p>
          </article>
        ))}
      </div>

      <footer className="colophon">
        <span>рецептів: {RECIPES.length}</span>
        <span>статус: DRAFT — орієнтир, звіряй під свій борт</span>
      </footer>
    </main>
  );
}
