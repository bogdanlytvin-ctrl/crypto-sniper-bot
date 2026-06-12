'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

interface Checklist {
  id: string;
  title: string;
  hint: string;
  items: string[];
}

// Базується на реальних даних польового ремонту: ~70% «не літає» — холодна пайка,
// переплутані мотори, напрямок пропа, кріплення акума; пайка = 90% надійності;
// VTX/ESC — топ причини «браку» після кількох вильотів.
const LISTS: Checklist[] = [
  {
    id: 'preflight',
    title: 'Передполітний',
    hint: 'Швидка перевірка перед кожним вильотом',
    items: [
      'Антену VTX підключено ДО подачі живлення (без неї VTX горить за секунди)',
      'Пропелери цілі, правильного розміру й напрямку',
      'Гайки моторів затягнуті, гвинти рами на місці',
      'Акумулятор надійно закріплений ременем',
      'Напрямок і порядок моторів перевірено (Motors-вкладка, без пропів)',
      'Failsafe налаштований і перевірений',
      'Лінк з пультом і відео стабільні перед зльотом',
      'Достатній заряд акумулятора, банки збалансовані',
    ],
  },
  {
    id: 'acceptance',
    title: 'Приймання після ремонту',
    hint: 'Перед поверненням борта в підрозділ',
    items: [
      'Уся пайка перевірена візуально й прозвонена (пайка = 90% надійності)',
      'Немає холодних з’єднань і містків припою',
      'Напрямок та порядок моторів вірні',
      'Напрямок пропелерів вірний',
      'Напруга не просідає критично під навантаженням',
      'Конденсатор живлення на місці й цілий',
      'Відеолінк + OSD працюють',
      'RX-лінк, телеметрія і failsafe працюють',
      'GPS отримує fix (якщо встановлено GPS)',
      'Тест моторів без пропелерів пройдено',
      'VTX має тепловідвід / обдув',
      'Контрольний hover / вібро-тест пройдено',
    ],
  },
  {
    id: 'prevention',
    title: 'Профілактика (часті причини браку)',
    hint: 'Що зменшує повернення бортів у ремонт',
    items: [
      'VTX: тепловідвід + ніколи не вмикати без антени',
      'ESC: rampup ≈0.125 / demag High проти desync; обдув проти перегріву',
      'Акуратна пайка дрібних шлейфів (≈40% заявок — шлейфи <3 см)',
      'Conformal coating проти вологи й корозії',
      'Регулярна чистка від металевої стружки і трави після крашів',
      'Резервна копія конфігу (diff all) для кожного борта',
    ],
  },
];

export default function ChecklistPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggle(key: string) {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  }
  function reset() {
    setChecked({});
  }

  const total = useMemo(() => LISTS.reduce((s, l) => s + l.items.length, 0), []);
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / чек-листи
        </div>
        <h1>
          Чек-листи<span className="cursor">_</span>
        </h1>
        <p>
          Передполітний, приймання після ремонту й профілактика — на основі реальних причин відмов.
          Відмічене не зберігається між бортами: «Скинути» перед кожним новим.
        </p>
      </header>

      <div className="cl-bar">
        <span>
          відмічено: {done} / {total}
        </span>
        <button className="ghost" onClick={reset}>
          скинути
        </button>
      </div>

      <div className="cl-lists">
        {LISTS.map((list) => {
          const dn = list.items.filter((_, i) => checked[`${list.id}:${i}`]).length;
          return (
            <section className="cl-card" key={list.id}>
              <header>
                <h2>{list.title}</h2>
                <span className="cl-count">
                  {dn}/{list.items.length}
                </span>
              </header>
              <p className="cl-hint">{list.hint}</p>
              <ul>
                {list.items.map((item, i) => {
                  const key = `${list.id}:${i}`;
                  return (
                    <li key={key}>
                      <label className={checked[key] ? 'on' : ''}>
                        <input
                          type="checkbox"
                          checked={!!checked[key]}
                          onChange={() => toggle(key)}
                        />
                        <span>{item}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <footer className="colophon">
        <span>на основі польового ремонту FPV</span>
        <span>підказка — не заміна власної перевірки</span>
      </footer>
    </main>
  );
}
