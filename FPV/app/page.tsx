import Link from 'next/link';
import { BOARDS, FLOWS, RECEIVERS, VTXS, GPSES } from '@/lib/data';

const TOOLS = [
  {
    href: '/diagnose',
    code: 'DIAG',
    title: 'Діагностика',
    desc: 'Симптом → перевірки на падах твоєї плати → ймовірна причина і крок фіксу.',
    cta: 'Знайти несправність',
    accent: 'signal' as const,
  },
  {
    href: '/wiring',
    code: 'WIRE',
    title: 'Карта підключення',
    desc: 'FC + RX + VTX + GPS → UART-и, пади, живлення, налаштування Betaflight.',
    cta: 'Зібрати карту',
    accent: 'copper' as const,
  },
  {
    href: '/journal',
    code: 'LOG',
    title: 'Журнал ремонту',
    desc: 'Локальний облік: борт → симптом → причина → запчастини. Офлайн, без хмари.',
    cta: 'Відкрити журнал',
    accent: 'muted' as const,
  },
  {
    href: '/firmware',
    code: 'FW',
    title: 'Прошивки',
    desc: 'Правильний firmware target для плати + чесний чек-лист прошивки і CLI-пресети.',
    cta: 'Підібрати прошивку',
    accent: 'muted' as const,
  },
  {
    href: '/connect',
    code: 'USB',
    title: 'Опитати плату',
    desc: 'Підключи FC по USB — плата сама скаже хто вона, прошивку й версію. Desktop Chrome.',
    cta: 'Підключити плату',
    accent: 'muted' as const,
  },
  {
    href: '/checklist',
    code: 'CHK',
    title: 'Чек-листи',
    desc: 'Передполітний, приймання після ремонту, профілактика — за реальними причинами відмов.',
    cta: 'Відкрити чек-листи',
    accent: 'muted' as const,
  },
  {
    href: '/verify',
    code: 'VRF',
    title: 'Звірка даних',
    desc: 'Підіймай статус плат і дерев draft → звірено. Експорт звірок для роздачі бригаді.',
    cta: 'Відкрити звірку',
    accent: 'muted' as const,
  },
  {
    href: '/reference',
    code: 'REF',
    title: 'Довідник',
    desc: 'Частоти 5.8 ГГц, потужність VTX, LiPo, KV моторів, пропи — швидкі таблиці з джерелами.',
    cta: 'Відкрити довідник',
    accent: 'muted' as const,
  },
];

export default function HomePage() {
  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">FTOS / польовий довідник техніка</div>
        <h1>
          Ремонт FPV без здогадок<span className="cursor">_</span>
        </h1>
        <p>
          Інструмент рем-бригади: діагностика по симптому й карта підключення, прив&apos;язані до
          пінауту конкретної плати. Працює офлайн. Підказує — фінальна перевірка на технікові.
        </p>
      </header>

      <div className="hub">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className={`tool ${t.accent}`}>
            <div className="tool-code">{t.code}</div>
            <h2>{t.title}</h2>
            <p>{t.desc}</p>
            <span className="tool-cta">{t.cta} →</span>
          </Link>
        ))}
      </div>

      <footer className="colophon">
        <span>плат у базі: {BOARDS.length}</span>
        <span>симптомів: {FLOWS.length}</span>
        <span>компонентів: {RECEIVERS.length + VTXS.length + GPSES.length}</span>
        <span>дані: офіційні мануали виробників</span>
      </footer>
    </main>
  );
}
