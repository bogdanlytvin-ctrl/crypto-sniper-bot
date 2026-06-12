import Link from 'next/link';

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
