import Link from 'next/link';
import { BOARDS, FLOWS, RECEIVERS, VTXS, GPSES, ESCS, RELEASES } from '@/lib/data';

type Group = 'Діагностика й ремонт' | 'Збірка й пайка' | 'Облік' | 'Перевірка й довідка';
const GROUP_ORDER: Group[] = ['Діагностика й ремонт', 'Збірка й пайка', 'Облік', 'Перевірка й довідка'];

const TOOLS: {
  href: string;
  code: string;
  title: string;
  desc: string;
  cta: string;
  accent: 'signal' | 'copper' | 'muted';
  group: Group;
}[] = [
  {
    href: '/diagnose',
    code: 'DIAG',
    title: 'Діагностика',
    desc: 'Симптом → перевірки на падах твоєї плати → ймовірна причина і крок фіксу.',
    cta: 'Знайти несправність',
    accent: 'signal',
    group: 'Діагностика й ремонт',
  },
  {
    href: '/connect',
    code: 'USB',
    title: 'Опитати плату',
    desc: 'Підключи FC по USB — плата сама скаже хто вона, прошивку й версію. Desktop Chrome.',
    cta: 'Підключити плату',
    accent: 'muted',
    group: 'Діагностика й ремонт',
  },
  {
    href: '/wiring',
    code: 'WIRE',
    title: 'Карта підключення',
    desc: 'FC + RX + VTX + GPS + ESC → UART-и, пади, живлення, схема падів, друк/PDF.',
    cta: 'Зібрати карту',
    accent: 'copper',
    group: 'Збірка й пайка',
  },
  {
    href: '/firmware',
    code: 'FW',
    title: 'Прошивки',
    desc: 'Правильний firmware target для плати + чесний чек-лист прошивки і CLI-пресети.',
    cta: 'Підібрати прошивку',
    accent: 'muted',
    group: 'Збірка й пайка',
  },
  {
    href: '/recipes',
    code: 'BOM',
    title: 'Рецепти збірок',
    desc: 'Стандартні борти під роль: BOM + прошивка + налаштування. Для масовості майстерні.',
    cta: 'Відкрити рецепти',
    accent: 'copper',
    group: 'Збірка й пайка',
  },
  {
    href: '/boards',
    code: 'FC+',
    title: 'Власні плати',
    desc: 'Додай плату/ревізію, якої немає в базі — зʼявиться в усіх інструментах. Локально, draft.',
    cta: 'Додати плату',
    accent: 'muted',
    group: 'Збірка й пайка',
  },
  {
    href: '/journal',
    code: 'LOG',
    title: 'Журнал ремонту',
    desc: 'Локальний облік: борт → симптом → причина → запчастини. Офлайн, без хмари.',
    cta: 'Відкрити журнал',
    accent: 'muted',
    group: 'Облік',
  },
  {
    href: '/batteries',
    code: 'BATT',
    title: 'Облік батарей',
    desc: 'Парк LiPo: цикли, внутрішній опір, статус. Логістика бригади. Офлайн, без хмари.',
    cta: 'Відкрити облік',
    accent: 'muted',
    group: 'Облік',
  },
  {
    href: '/checklist',
    code: 'CHK',
    title: 'Чек-листи',
    desc: 'Передполітний, приймання, профілактика, failsafe за роллю, OPSEC — за реальними відмовами.',
    cta: 'Відкрити чек-листи',
    accent: 'muted',
    group: 'Перевірка й довідка',
  },
  {
    href: '/verify',
    code: 'VRF',
    title: 'Звірка даних',
    desc: 'Підіймай статус плат і дерев draft → звірено. Експорт звірок для роздачі бригаді.',
    cta: 'Відкрити звірку',
    accent: 'muted',
    group: 'Перевірка й довідка',
  },
  {
    href: '/reference',
    code: 'REF',
    title: 'Довідник',
    desc: 'Частоти, VTX, LiPo, мотори, ESC, РЕБ і оптоволокно, планувальник частот рою.',
    cta: 'Відкрити довідник',
    accent: 'muted',
    group: 'Перевірка й довідка',
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

      <Link href="/diagnose" className="start-here">
        <span className="start-tag">почни тут</span>
        <span>
          Не знаєш з чого? <b>Діагностика</b> — від симптому до ймовірної причини й кроку фіксу.
        </span>
        <span className="start-arrow">→</span>
      </Link>

      <ol className="how" aria-label="Як це працює">
        <li>
          <span className="how-n">1</span>
          <span>
            <b>Обери свою плату</b> — один раз, вона запам'ятається в усіх інструментах.
          </span>
        </li>
        <li>
          <span className="how-n">2</span>
          <span>
            <b>Знайди несправність</b> — у Діагностиці: симптом → перевірки на падах саме твоєї плати
            → ймовірна причина й крок фіксу.
          </span>
        </li>
        <li>
          <span className="how-n">3</span>
          <span>
            <b>Запиши й звір</b> — журнал ремонту та облік батарей; статус даних підіймай у «Звірці».
          </span>
        </li>
      </ol>

      <Link href="/help" className="help-link">
        Як користуватись детальніше · знайшов помилку? → баг-репорт
      </Link>

      {GROUP_ORDER.map((group) => (
        <section className="hub-group" key={group} aria-label={group}>
          <div className="hub-group-label">{group}</div>
          <div className="hub">
            {TOOLS.filter((t) => t.group === group).map((t) => (
              <Link key={t.href} href={t.href} className={`tool ${t.accent}`}>
                <div className="tool-code">{t.code}</div>
                <h2>{t.title}</h2>
                <p>{t.desc}</p>
                <span className="tool-cta">{t.cta} →</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <footer className="colophon">
        <span>плат у базі: {BOARDS.length}</span>
        <span>симптомів: {FLOWS.length}</span>
        <span>
          компонентів: {RECEIVERS.length + VTXS.length + GPSES.length + ESCS.length + RELEASES.length}
        </span>
        <span>дані: офіційні мануали виробників</span>
      </footer>
    </main>
  );
}
