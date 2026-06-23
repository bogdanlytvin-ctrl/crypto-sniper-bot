import Link from 'next/link';
import { SwarmPlanner } from './swarm-planner';

// Довідкові дані — загальновідомі факти FPV з офіційних/перевірених джерел
// (Oscar Liang, GetFPV). Не per-board дані. Регуляції частот/потужності —
// звіряй зі своїм регіоном.

const RACEBAND = [
  ['R1', '5658'],
  ['R2', '5695'],
  ['R3', '5732'],
  ['R4', '5769'],
  ['R5', '5806'],
  ['R6', '5843'],
  ['R7', '5880'],
  ['R8', '5917'],
];

const VTX_POWER = [
  ['25 мВт', 'зали, гонки, налаштування на столі — мінімум перешкод'],
  ['200–400 мВт', 'фристайл / парк — золота середина, без зайвого нагріву'],
  ['800 мВт – 1 Вт+', 'далекобій / розвідка на відстань'],
];

const MOTOR_KV = [
  ['1S–2S (whoop/tiny)', '18000–25000 KV'],
  ['4S 5"', '≈2300–2600 KV'],
  ['6S 5"', '1600–2000 KV'],
];

const LIPO = [
  ['1S / 2S', 'whoop, tiny, мікро'],
  ['4S', '5" фристайл/гонки (поширений)'],
  ['6S', '5"+ — менший струм, менший нагрів за ту саму потужність'],
];

// ESC: прошивка / телеметрія / DShot / нотатка. Звірено з ArduPilot + Oscar Liang (2026-06).
const ESC_FW = [
  ['BLHeli_S', 'немає (Bluejay додає bidir DShot/RPM)', 'DShot150/300/600', '8-біт, бюджетні ESC. Сама по собі без телеметрії V/I/темп.'],
  ['BLHeli_32', 'повна: напруга / струм / темп / RPM', 'DShot300/600 + bidir', '32-біт. Ліцензію закрито у 2024 — поступово витісняється AM32.'],
  ['AM32', 'bidir DShot / RPM', 'DShot300/600 + bidir', 'Open-source 32-біт, сучасна заміна BLHeli_32.'],
];

// Радіодіапазони: проникність vs завадостійкість. Звір легальність у своєму регіоні.
const RF_BANDS = [
  ['2.4 ГГц', 'керування (ELRS) / цифрове відео', 'найзайнятіший діапазон; у щільному РЕБ глушать легше'],
  ['868 / 915 МГц', 'керування LR (ELRS)', 'краще пробиває рельєф/споруди, далекобій, менш зайнятий'],
  ['1.2 ГГц', 'аналогове відео LR', 'краще пробиває, рідше глушать ніж 5.8 ГГц; звір легальність'],
  ['5.8 ГГц', 'аналог/цифрове відео', 'найлегше глушиться; багато каналів, малий радіус'],
];

export default function ReferencePage() {
  return (
    <main className="wrap">
      <header className="masthead">
        <div className="ref">
          <Link href="/" className="back">
            ← FTOS
          </Link>{' '}
          / довідник
        </div>
        <h1>
          Довідник FPV<span className="cursor">_</span>
        </h1>
        <p>
          Швидкі довідкові таблиці: частоти, потужність VTX, акумулятори, мотори, пропи. Загальні
          факти — регуляції частот і потужності звіряй зі своїм регіоном.
        </p>
      </header>

      <section className="rf-block">
        <h2>Частоти 5.8 ГГц — Raceband (R1–R8)</h2>
        <table className="rf-table">
          <thead>
            <tr>
              <th>Канал</th>
              <th>Частота, МГц</th>
            </tr>
          </thead>
          <tbody>
            {RACEBAND.map(([ch, f]) => (
              <tr key={ch}>
                <td className="rf-key">{ch}</td>
                <td>{f}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rf-note">
          Raceband — найрозведеніший бенд (рознос 37 МГц), до 8 пілотів поряд. Є й інші бенди
          (A/B/E/F). Region 2 (US): 5650–5925 МГц. У деяких країнах ліміт 25 мВт.
        </p>
      </section>

      <section className="rf-block">
        <h2>Планувальник частот рою</h2>
        <p className="rf-note">
          Скільки бортів одночасно в повітрі — стільки рознесених VTX-каналів треба, щоб відео не
          глушило одне одного. Обери кількість:
        </p>
        <SwarmPlanner />
      </section>

      <section className="rf-block">
        <h2>Потужність VTX</h2>
        <table className="rf-table">
          <tbody>
            {VTX_POWER.map(([p, when]) => (
              <tr key={p}>
                <td className="rf-key">{p}</td>
                <td>{when}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="check-note">⚠ Ніколи не вмикай VTX без антени — вихідний каскад горить за секунди.</div>
      </section>

      <section className="rf-block">
        <h2>Акумулятори (LiPo)</h2>
        <table className="rf-table">
          <tbody>
            {LIPO.map(([cells, use]) => (
              <tr key={cells}>
                <td className="rf-key">{cells}</td>
                <td>{use}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rf-note">
          Зберігання — ~3.8 В/банка (storage). Під навантаженням не сідай нижче ~3.3–3.5 В/банка.
          Бери C-rating із запасом під споживання борту. Здуті — у брак.
        </p>
      </section>

      <section className="rf-block">
        <h2>Мотори — KV під банки</h2>
        <table className="rf-table">
          <tbody>
            {MOTOR_KV.map(([cells, kv]) => (
              <tr key={cells}>
                <td className="rf-key">{cells}</td>
                <td>{kv}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rf-note">KV падає зі збільшенням банок. Вище KV = більше тяги, але більше споживання й нагріву.</p>
      </section>

      <section className="rf-block">
        <h2>ESC — прошивки й телеметрія</h2>
        <table className="rf-table">
          <thead>
            <tr>
              <th>Прошивка</th>
              <th>Телеметрія</th>
              <th>DShot</th>
              <th>Нотатки</th>
            </tr>
          </thead>
          <tbody>
            {ESC_FW.map(([fw, tlm, ds, note]) => (
              <tr key={fw}>
                <td className="rf-key">{fw}</td>
                <td>{tlm}</td>
                <td>{ds}</td>
                <td>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="check-note">
          ⚠ desync / «сіпання» моторів: demag compensation = High, перевір motor timing і rampup;
          биті/незбалансовані пропи та слабка пайка фаз — часта причина. RPM-фільтр потребує bidir
          DShot (BLHeli_32 / AM32 / Bluejay).
        </div>
      </section>

      <section className="rf-block">
        <h2>РЕБ і діапазони · оптоволокно</h2>
        <table className="rf-table">
          <thead>
            <tr>
              <th>Діапазон</th>
              <th>Призначення</th>
              <th>Нотатки</th>
            </tr>
          </thead>
          <tbody>
            {RF_BANDS.map(([band, use, note]) => (
              <tr key={band}>
                <td className="rf-key">{band}</td>
                <td>{use}</td>
                <td>{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="rf-note">
          <b>Ознаки РЕБ (а не заліза):</b> лінк пропадає в певній зоні й відновлюється поза нею;
          дрон зависає (втрата керування), дрейфує (втрата GPS) або йде у failsafe. Залізо ж
          відмовляє стабільно скрізь. Нижчі частоти (868/915, 1.2 ГГц) краще пробивають і їх рідше
          глушать.
        </p>
        <div className="check-note">
          ⚠ <b>Оптоволокно:</b> відео й керування йдуть світлом по тонкому (~0.26 мм) волокну —
          немає радіосигнатури, <b>не глушиться РЕБ</b>. Ціна: менша дальність/маневреність і
          крихке волокно (обрив на різких маневрах, біля перешкод/дроту/води, при перевищенні
          радіуса згину). Бережи натяг і плавне змотування.
        </div>
      </section>

      <section className="rf-block">
        <h2>Пропи й приймач</h2>
        <ul className="rf-list">
          <li>5" три-лопатеві — типовий фристайл; розмір/крок під мотор і раму.</li>
          <li>Биті/незбалансовані пропи = вібрації, десинх, нагрів моторів.</li>
          <li>ELRS 2.4 ГГц — найпопулярніший приймач: низька латентність, дальній лінк, телеметрія по тому ж каналу.</li>
          <li>binding phrase ELRS має збігатися на TX і RX.</li>
        </ul>
      </section>

      <footer className="colophon">
        <span>
          джерела:{' '}
          <a href="https://oscarliang.com/fpv-channels/" target="_blank" rel="noopener noreferrer">
            Oscar Liang
          </a>
          {', '}
          <a
            href="https://www.getfpv.com/learn/fpv-essentials/fpv-frequency-reference-chart/"
            target="_blank"
            rel="noopener noreferrer"
          >
            GetFPV
          </a>
        </span>
        <span>звіряй регуляції свого регіону</span>
      </footer>
    </main>
  );
}
