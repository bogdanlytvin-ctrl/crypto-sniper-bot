// V2 — Modern Minimal
// Vibe: warm off-white, large serif display, lots of whitespace, subtle amber accent, soft grid, friendly.

const lightStyles = {
  page: { background: "#F6F3EE", color: "#1A1815", fontFamily: '"Inter", system-ui, sans-serif', minHeight: "100%" },
  dim: { color: "#7A7469" },
};

function LightSite() {
  const [data, update] = useStore();
  const [lang, setLang] = React.useState(() => localStorage.getItem("pf_lang") || "ua");
  const [filter, setFilter] = React.useState("all");
  const [openFaq, setOpenFaq] = React.useState(null);
  const [openProject, setOpenProject] = React.useState(null);
  const [openNote, setOpenNote] = React.useState(null);
  const [form, setForm] = React.useState({ name: "", contact: "", msg: "", sent: false });
  const [hover, setHover] = React.useState(null);
  const accent = data.accent;

  React.useEffect(() => { localStorage.setItem("pf_lang", lang); }, [lang]);
  React.useEffect(() => { logVisit("light"); }, []);

  const t = (obj) => (typeof obj === "string" ? obj : (obj?.[lang] ?? obj?.ua ?? ""));
  const filtered = filter === "all" ? data.projects : data.projects.filter((p) => p.cat === filter);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.contact) return;
    update((d) => { d.leads.push({ id: "l" + Date.now(), name: form.name, contact: form.contact, msg: form.msg, ts: Date.now(), new: true }); return d; });
    setForm({ name: "", contact: "", msg: "", sent: true });
    setTimeout(() => setForm((s) => ({ ...s, sent: false })), 4000);
  };

  return (
    <div style={lightStyles.page}>
      <style>{`
        .light-root { --accent: ${accent}; }
        .light-root a { color: inherit; text-decoration: none; }
        .light-root ::selection { background: ${accent}; color: #1A1815; }
        .light-root .serif { font-family: "Instrument Serif", Georgia, serif; font-weight: 400; letter-spacing: -0.01em; }
        .light-root .mono { font-family: "JetBrains Mono", ui-monospace, monospace; }
        .light-root .chip { transition: all .2s; }
        .light-root .chip:hover { background: #1A1815; color: #F6F3EE; border-color: #1A1815; }
        .light-root .btn-primary { transition: all .25s cubic-bezier(.4,0,.2,1); }
        .light-root .btn-primary:hover { background: #1A1815; color: #F6F3EE; transform: translateY(-1px); }
        .light-root .link-arrow { position: relative; display: inline-flex; align-items: center; gap: 8px; transition: gap .2s; }
        .light-root .link-arrow:hover { gap: 14px; }
        .light-root .proj-card { transition: transform .35s cubic-bezier(.2,.8,.2,1); cursor: pointer; }
        .light-root .proj-card:hover { transform: translateY(-4px); }
        .light-root .proj-thumb { overflow: hidden; background: #EDE8E0; }
        .light-root .proj-thumb .swatch { transition: transform .6s cubic-bezier(.2,.8,.2,1); }
        .light-root .proj-card:hover .swatch { transform: scale(1.05); }
        .light-root input, .light-root textarea { transition: border-color .2s; }
        .light-root input:focus, .light-root textarea:focus { outline: none; border-color: ${accent}; }
        .light-root .underline-grow { background: linear-gradient(currentColor, currentColor) no-repeat 0 100% / 0% 1px; transition: background-size .3s; padding-bottom: 2px; }
        .light-root .underline-grow:hover { background-size: 100% 1px; }
        .light-root .marq-wrap { overflow: hidden; border-top: 1px solid #1A181522; border-bottom: 1px solid #1A181522; padding: 28px 0; }
        .light-root .marq { display: flex; white-space: nowrap; animation: marq2 50s linear infinite; }
        @keyframes marq2 { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .light-root .tag-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 100px; background: #EDE8E0; font-family: "JetBrains Mono", monospace; font-size: 11px; color: #5C5750; }
      `}</style>

      <div className="light-root" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
        {/* TOP BAR */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(246,243,238,0.85)", backdropFilter: "blur(12px)", margin: "0 -40px", padding: "20px 40px", borderBottom: "1px solid #1A181515" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 17 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: accent, display: "grid", placeItems: "center", color: "#1A1815", fontFamily: "Instrument Serif, serif", fontSize: 17, fontWeight: 600 }}>b</div>
              <span className="serif" style={{ fontSize: 20 }}>{data.name}</span>
              <span className="tag-pill" style={{ marginLeft: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: 6, background: "#6FCF6F" }} />
                {lang === "ua" ? "приймаю проекти" : lang === "en" ? "accepting projects" : "принимаю проекты"}
              </span>
            </div>
            <nav style={{ display: "flex", gap: 28, alignItems: "center", fontSize: 14 }}>
              <a href="#work" className="underline-grow">{lang === "ua" ? "Роботи" : lang === "en" ? "Work" : "Работы"}</a>
              <a href="#services" className="underline-grow">{lang === "ua" ? "Послуги" : lang === "en" ? "Services" : "Услуги"}</a>
              <a href="#pricing" className="underline-grow">{lang === "ua" ? "Тарифи" : lang === "en" ? "Pricing" : "Тарифы"}</a>
              <a href="#blog" className="underline-grow">{lang === "ua" ? "Блог" : lang === "en" ? "Blog" : "Блог"}</a>
              <div style={{ display: "flex", gap: 2, background: "#EDE8E0", padding: 3, borderRadius: 100 }}>
                {["ua", "en", "ru"].map((l) => (
                  <button key={l} onClick={() => setLang(l)} style={{ padding: "4px 12px", background: lang === l ? "#1A1815" : "transparent", color: lang === l ? "#F6F3EE" : "#7A7469", border: "none", borderRadius: 100, fontFamily: "inherit", fontSize: 12, cursor: "pointer", textTransform: "uppercase", fontWeight: 500 }}>{l}</button>
                ))}
              </div>
              <a href="#contact" className="btn-primary" style={{ padding: "10px 18px", background: accent, color: "#1A1815", borderRadius: 100, fontSize: 13, fontWeight: 500 }}>
                {lang === "ua" ? "Написати" : lang === "en" ? "Get in touch" : "Написать"} →
              </a>
            </nav>
          </div>
        </header>

        {/* HERO */}
        <section style={{ padding: "100px 0 80px", position: "relative" }}>
          <div className="mono" style={{ fontSize: 12, color: "#7A7469", letterSpacing: "0.1em", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 24, height: 1, background: accent }} />
            {lang === "ua" ? "ПОРТФОЛІО · 2024 — СЬОГОДНІ" : lang === "en" ? "PORTFOLIO · 2024 — PRESENT" : "ПОРТФОЛИО · 2024 — СЕГОДНЯ"}
          </div>
          <h1 className="serif" style={{ fontSize: "clamp(64px, 10vw, 156px)", lineHeight: 0.93, margin: 0, whiteSpace: "pre-line", letterSpacing: "-0.03em" }}>
            {t(data.heroTitle).split("\n").map((line, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {i === 1 && (
                  <div style={{ display: "inline-block", width: 120, height: 80, background: accent, borderRadius: 4, flexShrink: 0 }} />
                )}
                <span style={i === 1 ? { fontStyle: "italic" } : {}}>{line}</span>
              </div>
            ))}
          </h1>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 60, marginTop: 48, alignItems: "end" }}>
            <div style={{ fontSize: 20, lineHeight: 1.5, color: "#3A362E", maxWidth: 560 }}>
              {t(data.heroSub)}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <a href="#contact" className="btn-primary" style={{ padding: "16px 26px", background: accent, color: "#1A1815", borderRadius: 100, fontSize: 15, fontWeight: 500 }}>
                {lang === "ua" ? "Почати проект" : lang === "en" ? "Start a project" : "Начать проект"} →
              </a>
              <a href="#work" className="btn-primary" style={{ padding: "16px 26px", background: "transparent", color: "#1A1815", borderRadius: 100, fontSize: 15, fontWeight: 500, border: "1px solid #1A181530" }}>
                {lang === "ua" ? "Дивитися роботи" : lang === "en" ? "See work" : "Смотреть работы"}
              </a>
            </div>
          </div>

          {/* stats strip */}
          <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40, paddingTop: 40, borderTop: "1px solid #1A181515" }}>
            {(data.stats || []).map((s, i) => (
              <div key={i}>
                <div className="serif" style={{ fontSize: 56, lineHeight: 1, letterSpacing: "-0.02em" }}>{s.n}</div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#7A7469" }}>{typeof s.label === "object" ? (s.label[lang] || s.label.ua) : s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MARQUEE */}
        <div className="marq-wrap" style={{ margin: "0 -40px" }}>
          <div className="marq serif" style={{ fontSize: 36, letterSpacing: "-0.01em" }}>
            {Array(2).fill(0).map((_, j) => (
              <div key={j} style={{ display: "flex", gap: 48, paddingRight: 48 }}>
                {[
                  { ua: "Telegram-боти", en: "Telegram bots", ru: "Telegram-боты" },
                  { ua: "Лендинги", en: "Landings", ru: "Лендинги" },
                  { ua: "Сайти-візитки", en: "Business cards", ru: "Сайты-визитки" },
                  { ua: "Веб-додатки", en: "Web apps", ru: "Веб-приложения" },
                  { ua: "Автоматизації", en: "Automations", ru: "Автоматизации" },
                  { ua: "UI/UX", en: "UI/UX", ru: "UI/UX" },
                ].map((x, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 48 }}>
                    <em>{t(x)}</em>
                    <span style={{ color: accent }}>✳</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* WORK */}
        <section id="work" style={{ padding: "120px 0" }}>
          <LightSectionHead lang={lang} label={{ ua: "Вибрані роботи", en: "Selected work", ru: "Избранные работы" }} sub={{ ua: "Проекти, які показують, що я вмію.", en: "Projects that show what I can do.", ru: "Проекты, которые показывают, что я умею." }} accent={accent} />
          <div style={{ display: "flex", gap: 8, marginTop: 48, flexWrap: "wrap" }}>
            {data.categories.map((c) => (
              <button key={c.id} onClick={() => setFilter(c.id)} className="chip" style={{ padding: "10px 16px", background: filter === c.id ? "#1A1815" : "transparent", color: filter === c.id ? "#F6F3EE" : "#1A1815", border: `1px solid ${filter === c.id ? "#1A1815" : "#1A181530"}`, borderRadius: 100, fontFamily: "inherit", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>
                {t(c.label)}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 32 }}>
            {filtered.map((p, i) => {
              const palette = [
                ["#E89B3C", "#1A1815"],
                ["#F4DBB3", "#1A1815"],
                ["#3A362E", "#F6F3EE"],
                ["#D8D0C1", "#1A1815"],
                ["#E89B3C", "#F6F3EE"],
                ["#1A1815", "#E89B3C"],
                ["#C9BFA9", "#1A1815"],
              ];
              const [bg, fg] = palette[i % palette.length];
              return (
                <div key={p.id} onClick={() => setOpenProject(p)} className="proj-card">
                  <div className="proj-thumb" style={{ borderRadius: 8, height: 320, position: "relative" }}>
                    <div className="swatch" style={{ position: "absolute", inset: 0, background: bg, color: fg, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 28, borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: '"JetBrains Mono", monospace', fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        <span>{p.cat}</span>
                        <span>{p.year}</span>
                      </div>
                      <div>
                        <div className="serif" style={{ fontSize: 72, lineHeight: 0.9, letterSpacing: "-0.03em" }}>{p.title}</div>
                        <div style={{ marginTop: 16, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, opacity: 0.7 }}>{p.stack}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16, gap: 24 }}>
                    <div>
                      <div className="serif" style={{ fontSize: 22 }}>{p.title} <span style={{ color: "#7A7469" }}>— {t(p.tag)}</span></div>
                      <div style={{ marginTop: 6, color: "#5C5750", fontSize: 14 }}>{t(p.desc)}</div>
                    </div>
                    <span className="tag-pill" style={{ whiteSpace: "nowrap", background: accent, color: "#1A1815" }}>{p.metric}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" style={{ padding: "120px 0", borderTop: "1px solid #1A181515" }}>
          <LightSectionHead lang={lang} label={{ ua: "Послуги", en: "Services", ru: "Услуги" }} sub={{ ua: "Від швидкого боту за вечір до повноцінного веб-додатку під ключ.", en: "From a quick bot in an evening to a full web app end-to-end.", ru: "От быстрого бота за вечер до полноценного веб-приложения под ключ." }} accent={accent} />
          <div style={{ marginTop: 48 }}>
            {data.services.map((s, i) => (
              <div
                key={s.id}
                onMouseEnter={() => setHover(s.id)}
                onMouseLeave={() => setHover(null)}
                style={{ display: "grid", gridTemplateColumns: "60px 1fr 2fr 140px 40px", gap: 24, alignItems: "center", padding: "28px 0", borderTop: "1px solid #1A181515", borderBottom: i === data.services.length - 1 ? "1px solid #1A181515" : "none", cursor: "pointer", transition: "padding .3s ease" }}
              >
                <div className="mono" style={{ fontSize: 12, color: "#7A7469" }}>0{i + 1}</div>
                <div className="serif" style={{ fontSize: 32, display: "flex", alignItems: "center", gap: 16 }}>
                  <span style={{ color: hover === s.id ? accent : "#1A1815", transition: "color .2s" }}>{s.icon}</span>
                  {t(s.title)}
                </div>
                <div style={{ color: "#5C5750", fontSize: 15 }}>{t(s.desc)}</div>
                <div className="mono" style={{ fontSize: 13, color: hover === s.id ? accent : "#1A1815", transition: "color .2s" }}>{s.price}</div>
                <div style={{ fontSize: 22, color: hover === s.id ? accent : "#7A7469", transform: hover === s.id ? "translateX(4px)" : "translateX(0)", transition: "all .2s" }}>→</div>
              </div>
            ))}
          </div>
        </section>

        {/* PROCESS */}
        <section style={{ padding: "120px 0", borderTop: "1px solid #1A181515" }}>
          <LightSectionHead lang={lang} label={{ ua: "Процес", en: "Process", ru: "Процесс" }} sub={{ ua: "Чотири кроки від першого повідомлення до запуску.", en: "Four steps from first message to launch.", ru: "Четыре шага от первого сообщения до запуска." }} accent={accent} />
          <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
            {data.process.map((p, i) => (
              <div key={i} style={{ position: "relative" }}>
                <div className="serif" style={{ fontSize: 96, lineHeight: 0.9, color: accent, letterSpacing: "-0.02em" }}>{p.n}</div>
                <div className="serif" style={{ fontSize: 26, marginTop: 16 }}>{t(p.title)}</div>
                <div style={{ marginTop: 10, color: "#5C5750", fontSize: 15, lineHeight: 1.5 }}>{t(p.desc)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section style={{ padding: "120px 0", borderTop: "1px solid #1A181515" }}>
          <LightSectionHead lang={lang} label={{ ua: "Відгуки", en: "Testimonials", ru: "Отзывы" }} sub={{ ua: "Реальні слова від реальних клієнтів.", en: "Real words from real clients.", ru: "Реальные слова от реальных клиентов." }} accent={accent} />
          <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            {data.testimonials.map((x) => (
              <div key={x.id} style={{ background: "#EDE8E0", borderRadius: 16, padding: 32 }}>
                <div className="serif" style={{ fontSize: 60, lineHeight: 0.5, color: accent, marginBottom: 16 }}>"</div>
                <div style={{ fontSize: 17, lineHeight: 1.55, color: "#1A1815" }}>{t(x.text)}</div>
                <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: "#1A1815", color: "#F6F3EE", display: "grid", placeItems: "center", fontFamily: "Instrument Serif, serif", fontSize: 18 }}>{x.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{x.name}</div>
                    <div style={{ fontSize: 12, color: "#7A7469" }}>{t(x.role)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" style={{ padding: "120px 0", borderTop: "1px solid #1A181515" }}>
          <LightSectionHead lang={lang} label={{ ua: "Тарифи", en: "Pricing", ru: "Тарифы" }} sub={{ ua: "Прозорі пакети. Без прихованих сум і сюрпризів.", en: "Transparent packages. No hidden fees.", ru: "Прозрачные пакеты. Без скрытых сумм." }} accent={accent} />
          <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {data.plans.map((pl) => (
              <div key={pl.id} style={{ padding: 36, borderRadius: 20, background: pl.featured ? "#1A1815" : "transparent", color: pl.featured ? "#F6F3EE" : "#1A1815", border: pl.featured ? "none" : "1px solid #1A181520", position: "relative" }}>
                {pl.featured && <div className="mono" style={{ position: "absolute", top: 20, right: 20, fontSize: 10, color: accent, border: `1px solid ${accent}`, padding: "4px 10px", borderRadius: 100, letterSpacing: "0.1em" }}>POPULAR</div>}
                <div className="serif" style={{ fontSize: 32 }}>{t(pl.name)}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 16 }}>
                  <span className="serif" style={{ fontSize: 56, color: pl.featured ? accent : "#1A1815", letterSpacing: "-0.03em" }}>{pl.price}</span>
                  <span className="mono" style={{ fontSize: 12, color: pl.featured ? "#AAA597" : "#7A7469" }}>/ {t(pl.per)}</span>
                </div>
                <div style={{ marginTop: 28, borderTop: `1px solid ${pl.featured ? "#FFFFFF20" : "#1A181520"}`, paddingTop: 20 }}>
                  {t(pl.features).map((f, j) => (
                    <div key={j} style={{ padding: "10px 0", display: "flex", gap: 12, fontSize: 14 }}>
                      <span style={{ color: accent }}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="#contact" className="btn-primary" style={{ display: "block", marginTop: 28, padding: "14px", background: pl.featured ? accent : "#1A1815", color: pl.featured ? "#1A1815" : "#F6F3EE", textAlign: "center", borderRadius: 100, fontSize: 14, fontWeight: 500 }}>
                  {lang === "ua" ? "Обрати" : lang === "en" ? "Choose" : "Выбрать"}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "120px 0", borderTop: "1px solid #1A181515" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 80 }}>
            <div>
              <div className="mono" style={{ fontSize: 12, color: "#7A7469", letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 24, height: 1, background: accent }} />FAQ
              </div>
              <h2 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1, margin: 0 }}>
                {lang === "ua" ? "Часті питання" : lang === "en" ? "Frequent questions" : "Частые вопросы"}
              </h2>
              <div style={{ marginTop: 24, color: "#5C5750", fontSize: 16, lineHeight: 1.5 }}>
                {lang === "ua" ? "Не знайшли відповідь? " : lang === "en" ? "Didn't find an answer? " : "Не нашли ответ? "}
                <a href="#contact" style={{ color: accent, borderBottom: `1px solid ${accent}` }}>
                  {lang === "ua" ? "Напишіть мені" : lang === "en" ? "Drop me a line" : "Напишите мне"}
                </a>
              </div>
            </div>
            <div>
              {data.faq.map((f, i) => (
                <div key={f.id} style={{ borderTop: i === 0 ? "1px solid #1A181520" : "none", borderBottom: "1px solid #1A181520" }}>
                  <button onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)} style={{ width: "100%", padding: "24px 0", background: "transparent", border: "none", color: "inherit", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 20, fontFamily: "Instrument Serif, serif" }}>
                    <span>{t(f.q)}</span>
                    <span style={{ color: accent, fontSize: 28, transform: openFaq === f.id ? "rotate(45deg)" : "rotate(0)", transition: "transform .25s" }}>+</span>
                  </button>
                  {openFaq === f.id && (
                    <div style={{ paddingBottom: 24, color: "#5C5750", fontSize: 15, lineHeight: 1.6 }}>{t(f.a)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BLOG */}
        <section id="blog" style={{ padding: "120px 0", borderTop: "1px solid #1A181515" }}>
          <LightSectionHead lang={lang} label={{ ua: "Блог", en: "Blog", ru: "Блог" }} sub={{ ua: "Короткі нотатки про розробку, процеси й інструменти.", en: "Short notes on development, process, and tools.", ru: "Короткие заметки о разработке, процессах и инструментах." }} accent={accent} />
          <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {data.blog.map((b, i) => (
              <a key={b.id} href="#" onClick={(e) => { e.preventDefault(); setOpenNote(b); }} style={{ display: "block", padding: 28, borderRadius: 16, background: "#EDE8E0", transition: "transform .3s", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                <div className="mono" style={{ fontSize: 11, color: "#7A7469", letterSpacing: "0.1em" }}>{b.date} · {b.readMin} MIN</div>
                <div className="serif" style={{ fontSize: 26, marginTop: 16, lineHeight: 1.15 }}>{t(b.title)}</div>
                <div style={{ marginTop: 16, color: "#5C5750", fontSize: 14, lineHeight: 1.5 }}>{t(b.excerpt)}</div>
                <div className="link-arrow mono" style={{ marginTop: 24, fontSize: 12, color: accent }}>
                  {lang === "ua" ? "Читати" : lang === "en" ? "Read" : "Читать"} →
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* ABOUT + CONTACT */}
        <section id="contact" style={{ padding: "120px 0", borderTop: "1px solid #1A181515" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }}>
            <div>
              <LightSectionHead lang={lang} label={{ ua: "Привіт", en: "Hi", ru: "Привет" }} sub={{ ua: "", en: "", ru: "" }} accent={accent} />
              <h2 className="serif" style={{ fontSize: "clamp(44px, 5vw, 72px)", lineHeight: 1, margin: "24px 0 0", letterSpacing: "-0.02em" }}>
                {lang === "ua" ? <>Я <em style={{ color: accent, fontStyle: "italic" }}>{data.name}</em>.<br/>Давайте щось збудуємо.</> : lang === "en" ? <>I'm <em style={{ color: accent, fontStyle: "italic" }}>{data.name}</em>.<br/>Let's build something.</> : <>Я <em style={{ color: accent, fontStyle: "italic" }}>{data.name}</em>.<br/>Давайте что-то построим.</>}
              </h2>
              <div style={{ marginTop: 32, fontSize: 18, lineHeight: 1.55, color: "#3A362E", maxWidth: 480 }}>
                {t(data.bio)}
              </div>
              <div style={{ marginTop: 40 }}>
                {[
                  { label: "Email", value: data.contacts.email, href: `mailto:${data.contacts.email}` },
                  { label: "Telegram", value: data.contacts.telegram, href: `https://t.me/${data.contacts.telegram.replace("@","")}` },
                  { label: "WhatsApp", value: data.contacts.whatsapp, href: `https://wa.me/${(data.contacts.whatsapp || "").replace(/\D/g, "")}` },
                  { label: lang === "ua" ? "Локація" : lang === "en" ? "Location" : "Локация", value: t(data.contacts.location), href: "#" },
                ].map((c, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr", padding: "14px 0", borderTop: "1px solid #1A181515", alignItems: "center" }}>
                    <span className="mono" style={{ fontSize: 11, color: "#7A7469", letterSpacing: "0.1em", textTransform: "uppercase" }}>{c.label}</span>
                    <a href={c.href} className="underline-grow" style={{ fontSize: 16 }}>{c.value}</a>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "#1A1815", color: "#F6F3EE", borderRadius: 24, padding: 40 }}>
              <div className="mono" style={{ fontSize: 11, color: accent, letterSpacing: "0.1em", marginBottom: 16 }}>
                {lang === "ua" ? "НОВИЙ ЗАПИТ" : lang === "en" ? "NEW REQUEST" : "НОВЫЙ ЗАПРОС"}
              </div>
              <div className="serif" style={{ fontSize: 40, lineHeight: 1, letterSpacing: "-0.02em", marginBottom: 32 }}>
                {lang === "ua" ? "Розкажіть про проект" : lang === "en" ? "Tell me about the project" : "Расскажите о проекте"}
              </div>
              <form onSubmit={submit}>
                <LightField lang={lang} label={{ ua: "Ваше ім'я", en: "Your name", ru: "Ваше имя" }} value={form.name} onChange={(v) => setForm((s) => ({ ...s, name: v }))} />
                <LightField lang={lang} label={{ ua: "Telegram або email", en: "Telegram or email", ru: "Telegram или email" }} value={form.contact} onChange={(v) => setForm((s) => ({ ...s, contact: v }))} />
                <LightField lang={lang} label={{ ua: "Коротко про задачу", en: "Briefly about the task", ru: "Кратко о задаче" }} value={form.msg} onChange={(v) => setForm((s) => ({ ...s, msg: v }))} textarea />
                <button type="submit" className="btn-primary" style={{ width: "100%", padding: 16, background: accent, color: "#1A1815", border: "none", borderRadius: 100, fontSize: 15, cursor: "pointer", fontWeight: 500, marginTop: 12 }}>
                  {form.sent ? (lang === "ua" ? "✓ Відправлено" : lang === "en" ? "✓ Sent" : "✓ Отправлено") : (lang === "ua" ? "Надіслати →" : lang === "en" ? "Send →" : "Отправить →")}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: "60px 0 40px", borderTop: "1px solid #1A181515" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
            <div className="serif" style={{ fontSize: 72, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
              {lang === "ua" ? "Поговоримо?" : lang === "en" ? "Let's talk?" : "Поговорим?"}
            </div>
            <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#7A7469" }} className="mono">
              <span>© 2026 {data.name}</span>
              <span>v.1.0.0</span>
            </div>
          </div>
        </footer>
      </div>

      {/* PROJECT MODAL */}
      {/* BLOG MODAL */}
      {openNote && (
        <div onClick={() => setOpenNote(null)} style={{ position: "fixed", inset: 0, background: "rgba(26,24,21,0.4)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, width: "100%", background: "#F6F3EE", padding: 48, position: "relative", borderRadius: 20, maxHeight: "80vh", overflowY: "auto" }}>
            <button onClick={() => setOpenNote(null)} style={{ position: "absolute", top: 20, right: 20, background: "#EDE8E0", border: "none", color: "#1A1815", width: 36, height: 36, borderRadius: 18, cursor: "pointer", fontSize: 18 }}>×</button>
            <div className="mono" style={{ fontSize: 11, color: "#7A7469", marginBottom: 16, letterSpacing: "0.1em" }}>{openNote.date} · {openNote.readMin} MIN READ</div>
            <div className="serif" style={{ fontSize: 48, lineHeight: 1, letterSpacing: "-0.02em", marginBottom: 24 }}>{t(openNote.title)}</div>
            <div style={{ fontSize: 16, color: "#5C5750", lineHeight: 1.7 }}>{t(openNote.body || openNote.excerpt)}</div>
          </div>
        </div>
      )}

      {openProject && (
        <div onClick={() => setOpenProject(null)} style={{ position: "fixed", inset: 0, background: "rgba(26,24,21,0.4)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, width: "100%", background: "#F6F3EE", padding: 48, position: "relative", borderRadius: 20 }}>
            <button onClick={() => setOpenProject(null)} style={{ position: "absolute", top: 20, right: 20, background: "#EDE8E0", border: "none", color: "#1A1815", width: 36, height: 36, borderRadius: 18, cursor: "pointer", fontSize: 18 }}>×</button>
            <div className="mono" style={{ fontSize: 11, color: accent, marginBottom: 12, letterSpacing: "0.1em" }}>{openProject.year} · {openProject.cat?.toUpperCase()}</div>
            <div className="serif" style={{ fontSize: 72, lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: 16 }}>{openProject.title}</div>
            <div style={{ fontSize: 18, color: "#5C5750", marginBottom: 24 }}>{t(openProject.tag)}</div>
            <div style={{ borderTop: "1px solid #1A181520", paddingTop: 24, fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>{t(openProject.desc)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, borderTop: "1px solid #1A181520", paddingTop: 24 }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "#7A7469", marginBottom: 6, letterSpacing: "0.1em" }}>STACK</div>
                <div className="mono" style={{ fontSize: 13 }}>{openProject.stack}</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "#7A7469", marginBottom: 6, letterSpacing: "0.1em" }}>RESULT</div>
                <div className="mono" style={{ fontSize: 13, color: accent }}>{openProject.metric}</div>
              </div>
            </div>
            {openProject.url && (
              <a href={openProject.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 24, padding: "13px 24px", background: "#1A1815", color: "#F6F3EE", borderRadius: 100, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                {lang === "ua" ? "Відкрити проект" : lang === "en" ? "View project" : "Открыть проект"} ↗
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LightSectionHead({ lang, label, sub, accent }) {
  const t = (obj) => (typeof obj === "string" ? obj : (obj?.[lang] ?? obj?.ua ?? ""));
  return (
    <div>
      <div className="mono" style={{ fontSize: 12, color: "#7A7469", letterSpacing: "0.1em", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 24, height: 1, background: accent }} />
        {t(label).toUpperCase()}
      </div>
      <h2 className="serif" style={{ fontSize: "clamp(40px, 5vw, 64px)", lineHeight: 1, margin: 0, letterSpacing: "-0.02em" }}>
        {t(sub)}
      </h2>
    </div>
  );
}

function LightField({ lang, label, value, onChange, textarea }) {
  const t = (obj) => (typeof obj === "string" ? obj : (obj?.[lang] ?? obj?.ua ?? ""));
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="mono" style={{ fontSize: 10, color: "#AAA597", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t(label)}</div>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} style={{ width: "100%", background: "transparent", border: "1px solid #3A362E", color: "#F6F3EE", padding: 14, fontSize: 15, resize: "vertical", borderRadius: 12, fontFamily: "inherit" }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", background: "transparent", border: "1px solid #3A362E", color: "#F6F3EE", padding: 14, fontSize: 15, borderRadius: 12, fontFamily: "inherit" }} />
      )}
    </div>
  );
}

Object.assign(window, { LightSite });
