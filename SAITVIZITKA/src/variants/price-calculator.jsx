// PriceCalculator — interactive cost estimator embedded in the dark variant.
// Tri-lingual (ua/en/ru). Numbers are in $; user can switch to ₴ (×40).
//
// Usage: <PriceCalculator lang={lang} accent={accent} onSubmit={(summary) => ...} />

const DEFAULT_CALC = {
  uahRate: 40,
  types: [
    { id: "bot",     label: { ua: "Telegram-бот",  en: "Telegram bot",  ru: "Telegram-бот"   }, base: 50,  days: 4,  icon: "✈" },
    { id: "landing", label: { ua: "Лендинг",        en: "Landing page",  ru: "Лендинг"         }, base: 80,  days: 5,  icon: "▤" },
    { id: "site",    label: { ua: "Сайт-візитка",   en: "Business site", ru: "Сайт-визитка"   }, base: 100, days: 7,  icon: "▣" },
    { id: "app",     label: { ua: "Веб-додаток",    en: "Web app",       ru: "Веб-приложение" }, base: 200, days: 14, icon: "◈" },
    { id: "auto",    label: { ua: "Автоматизація",  en: "Automation",    ru: "Автоматизация"  }, base: 40,  days: 5,  icon: "⟳" },
  ],
  features: [
    { id: "admin",    price: 50,  days: 3, label: { ua: "Адмінка",            en: "Admin panel",     ru: "Админка"           } },
    { id: "i18n",     price: 30,  days: 2, label: { ua: "Мультимовність",      en: "Multi-language",  ru: "Мультиязычность"   } },
    { id: "payments", price: 80,  days: 3, label: { ua: "Платежі",             en: "Payments",        ru: "Платежи"           } },
    { id: "auth",     price: 40,  days: 2, label: { ua: "Авторизація",         en: "Auth",            ru: "Авторизация"       } },
    { id: "ai",       price: 80,  days: 4, label: { ua: "AI / GPT-інтеграція", en: "AI / GPT",        ru: "AI / GPT"          } },
    { id: "crm",      price: 50,  days: 2, label: { ua: "CRM-інтеграція",      en: "CRM integration", ru: "CRM-интеграция"    } },
    { id: "design",   price: 60,  days: 3, label: { ua: "Унікальний дизайн",   en: "Custom design",   ru: "Уникальный дизайн" } },
    { id: "seo",      price: 30,  days: 1, label: { ua: "SEO",                 en: "SEO",             ru: "SEO"               } },
  ],
  urgency: [
    { id: "normal", mult: 1,   label: { ua: "Звичайно",         en: "Normal",        ru: "Обычно"        } },
    { id: "fast",   mult: 1.3, label: { ua: "Швидко (×1.3)",   en: "Fast (×1.3)",   ru: "Быстро (×1.3)" } },
    { id: "urgent", mult: 1.7, label: { ua: "Терміново (×1.7)", en: "Urgent (×1.7)", ru: "Срочно (×1.7)" } },
  ],
};

function PriceCalculator({ lang, accent, onSubmit, calcData }) {
  const TYPES   = (calcData?.types   && calcData.types.length)   ? calcData.types   : DEFAULT_CALC.types;
  const FEATURES = (calcData?.features && calcData.features.length) ? calcData.features : DEFAULT_CALC.features;
  const URGENCY  = (calcData?.urgency  && calcData.urgency.length)  ? calcData.urgency  : DEFAULT_CALC.urgency;
  const uahRate  = calcData?.uahRate || DEFAULT_CALC.uahRate;

  const [type, setType] = React.useState(() => TYPES[0]?.id || "landing");
  const [feats, setFeats] = React.useState({});
  const [urg, setUrg] = React.useState("normal");
  const [currency, setCurrency] = React.useState("USD");
  const t = (obj) => obj?.[lang] ?? obj?.ua ?? "";

  const calc = React.useMemo(() => {
    const T = TYPES.find((x) => x.id === type) || TYPES[0];
    const U = URGENCY.find((x) => x.id === urg) || URGENCY[0];
    const featList = FEATURES.filter((f) => feats[f.id]);
    const featPrice = featList.reduce((s, f) => s + f.price, 0);
    const featDays  = featList.reduce((s, f) => s + f.days,  0);
    const subtotal = T.base + featPrice;
    const total = Math.round(subtotal * U.mult);
    const days = Math.ceil((T.days + featDays) / (urg === "urgent" ? 1.5 : urg === "fast" ? 1.2 : 1));
    return { type: T, urgency: U, feats: featList, subtotal, total, days };
  }, [type, feats, urg, TYPES, FEATURES, URGENCY]);

  const fmt = (usd) => currency === "USD" ? `$${usd.toLocaleString()}` : `₴${(usd * uahRate).toLocaleString()}`;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 0, marginTop: 60, border: "1px solid #1F1E1B" }} className="calc-grid">
      {/* LEFT — INPUTS */}
      <div style={{ padding: 32, borderRight: "1px solid #1F1E1B" }} className="calc-left">
        {/* Type */}
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5E5B54", letterSpacing: "0.15em", marginBottom: 14 }}>
          01 / {lang === "ua" ? "ТИП ПРОЕКТУ" : lang === "en" ? "PROJECT TYPE" : "ТИП ПРОЕКТА"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 36 }}>
          {TYPES.map((T) => {
            const sel = type === T.id;
            return (
              <button key={T.id} onClick={() => setType(T.id)} style={{
                background: sel ? `${accent}15` : "transparent",
                border: `1px solid ${sel ? accent : "#1F1E1B"}`,
                color: sel ? accent : "#E8E6E1",
                padding: "14px 12px",
                cursor: "pointer",
                textAlign: "left",
                borderRadius: 3,
                transition: "all .15s",
                display: "flex", flexDirection: "column", gap: 6,
                fontFamily: '"Inter", sans-serif',
              }}>
                <div style={{ fontSize: 18, color: sel ? accent : "#5E5B54" }}>{T.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t(T.label)}</div>
                <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: sel ? accent : "#5E5B54", letterSpacing: "0.05em" }}>{fmt(T.base)} · ~{T.days}d</div>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5E5B54", letterSpacing: "0.15em", marginBottom: 14 }}>
          02 / {lang === "ua" ? "ДОДАТКОВО" : lang === "en" ? "ADD-ONS" : "ДОПОЛНИТЕЛЬНО"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 6, marginBottom: 36 }}>
          {FEATURES.map((F) => {
            const sel = !!feats[F.id];
            return (
              <label key={F.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px",
                border: `1px solid ${sel ? accent + "55" : "#1F1E1B"}`,
                background: sel ? `${accent}0A` : "transparent",
                cursor: "pointer", borderRadius: 3,
                transition: "all .15s",
              }}>
                <span style={{
                  width: 14, height: 14,
                  border: `1px solid ${sel ? accent : "#3A3A3E"}`,
                  background: sel ? accent : "transparent",
                  borderRadius: 2, display: "grid", placeItems: "center",
                  color: "#0B0B0C", fontSize: 10, fontFamily: "JetBrains Mono, monospace",
                  flexShrink: 0,
                }}>{sel ? "✓" : ""}</span>
                <span style={{ fontSize: 13, flex: 1 }}>{t(F.label)}</span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: sel ? accent : "#5E5B54" }}>+{fmt(F.price)}</span>
                <input type="checkbox" checked={sel} onChange={(e) => setFeats((s) => ({ ...s, [F.id]: e.target.checked }))} style={{ display: "none" }} />
              </label>
            );
          })}
        </div>

        {/* Urgency */}
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5E5B54", letterSpacing: "0.15em", marginBottom: 14 }}>
          03 / {lang === "ua" ? "ТЕРМІНИ" : lang === "en" ? "TIMELINE" : "СРОКИ"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: "1px solid #1F1E1B", borderRadius: 3, overflow: "hidden" }}>
          {URGENCY.map((U, i) => {
            const sel = urg === U.id;
            return (
              <button key={U.id} onClick={() => setUrg(U.id)} style={{
                background: sel ? accent : "transparent",
                color: sel ? "#0B0B0C" : "#E8E6E1",
                border: "none",
                borderRight: i < URGENCY.length - 1 ? "1px solid #1F1E1B" : "none",
                padding: "12px 8px", cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: "0.05em",
                fontWeight: sel ? 600 : 400,
              }}>{t(U.label)}</button>
            );
          })}
        </div>
      </div>

      {/* RIGHT — RECEIPT */}
      <div style={{ padding: 32, background: "#0A0A0B", display: "flex", flexDirection: "column", gap: 16 }} className="calc-right">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5E5B54", letterSpacing: "0.15em" }}>$ ESTIMATE.TXT</div>
          <div style={{ display: "flex", border: "1px solid #1F1E1B", borderRadius: 3, overflow: "hidden" }}>
            {["USD", "UAH"].map((c) => (
              <button key={c} onClick={() => setCurrency(c)} style={{
                background: currency === c ? accent : "transparent",
                color: currency === c ? "#0B0B0C" : "#8B8982",
                border: "none", padding: "4px 10px", cursor: "pointer",
                fontFamily: "JetBrains Mono, monospace", fontSize: 10, letterSpacing: "0.1em",
              }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1F1E1B", paddingTop: 16 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B8982", display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>{calc.type.icon} {t(calc.type.label).toLowerCase()}</span><span>{fmt(calc.type.base)}</span>
          </div>
          {calc.feats.map((f) => (
            <div key={f.id} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B8982", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span>+ {t(f.label).toLowerCase()}</span><span>{fmt(f.price)}</span>
            </div>
          ))}
          {calc.urgency.mult !== 1 && (
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: accent, display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span>× {calc.urgency.mult} ({t(calc.urgency.label).toLowerCase()})</span><span>+{fmt(calc.total - calc.subtotal)}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid #1F1E1B", paddingTop: 16, marginTop: "auto" }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5E5B54", letterSpacing: "0.15em", marginBottom: 6 }}>
            {lang === "ua" ? "ОРІЄНТОВНО" : lang === "en" ? "ESTIMATE" : "ОРИЕНТИРОВОЧНО"}
          </div>
          <div style={{ fontSize: 56, fontFamily: '"Instrument Serif", serif', color: accent, lineHeight: 1, marginBottom: 8 }}>
            {fmt(calc.total)}
          </div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B8982" }}>
            ~ {calc.days} {lang === "ua" ? "днів" : lang === "en" ? "days" : "дней"}
          </div>
        </div>

        <button onClick={() => onSubmit && onSubmit(calc)} style={{
          width: "100%", padding: 14, background: accent, color: "#0B0B0C",
          border: "none", borderRadius: 3, cursor: "pointer",
          fontFamily: "JetBrains Mono, monospace", fontSize: 12, letterSpacing: "0.1em",
          textTransform: "uppercase", fontWeight: 600,
        }}>
          → {lang === "ua" ? "обговорити проект" : lang === "en" ? "discuss project" : "обсудить проект"}
        </button>

        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#3A3A3E", letterSpacing: "0.1em", textAlign: "center" }}>
          {lang === "ua" ? "* фінальна ціна після брифу" : lang === "en" ? "* final price after brief" : "* финальная цена после брифа"}
        </div>
      </div>
    </div>
  );
}

window.PriceCalculator = PriceCalculator;
