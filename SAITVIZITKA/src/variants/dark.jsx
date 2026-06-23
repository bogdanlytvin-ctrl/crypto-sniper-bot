// V1 — Bento Modern
// Vibe: Linear/Vercel-grade SaaS. Bento card grid, soft accent glows, glass surfaces,
// clean Inter typography, generous radii. All site logic preserved from the store.

const T = {
  bg: "#08080B",
  card: "rgba(255,255,255,0.025)",
  cardSolid: "#101015",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  text: "#ECECEF",
  text2: "#9A9AA6",
  text3: "#5C5C68",
  mono: '"JetBrains Mono", ui-monospace, monospace',
  sans: '"Inter", system-ui, sans-serif',
};

function DarkSite() {
  const [data, update] = useStore();
  const [lang, setLang] = React.useState(() => localStorage.getItem("pf_lang") || "ua");
  const [filter, setFilter] = React.useState("all");
  const [openFaq, setOpenFaq] = React.useState(null);
  const [openProject, setOpenProject] = React.useState(null);
  const [openNote, setOpenNote] = React.useState(null);
  const [formState, setFormState] = React.useState({ name: "", contact: "", msg: "", website: "", sent: false });
  const [navOpen, setNavOpen] = React.useState(false);
  const [prog, setProg] = React.useState(0);
  const accent = data.accent;

  // top scroll-progress indicator
  React.useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setProg(max > 0 ? Math.min(1, h.scrollTop / max) : 0);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => { localStorage.setItem("pf_lang", lang); }, [lang]);
  React.useEffect(() => { logVisit("dark"); }, []);

  // Lenis smooth scroll + anchor interception (respects reduced-motion)
  React.useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || typeof Lenis === "undefined") return;
    const lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, touchMultiplier: 1.6 });
    window.__lenis = lenis;
    let raf;
    const loop = (time) => { lenis.raf(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.length < 2) return;
      const el = document.querySelector(href);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -76 }); }
    };
    document.addEventListener("click", onClick);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("click", onClick); lenis.destroy(); window.__lenis = null; };
  }, []);

  // Scroll-reveal: fade+rise cards as they enter the viewport
  React.useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = document.querySelectorAll(".bento-root .bento");
    els.forEach((el) => { if (!el.classList.contains("io-in")) el.classList.add("io-init"); });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.remove("io-init"); en.target.classList.add("io-in"); io.unobserve(en.target); } });
    }, { threshold: 0.08, rootMargin: "0px 0px -48px 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // URL routing for projects: ?p=id opens modal; closing clears the param
  React.useEffect(() => {
    const sync = () => {
      const id = new URLSearchParams(window.location.search).get("p");
      if (id) {
        const p = data.projects.find((x) => x.id === id);
        if (p) setOpenProject(p);
      } else {
        setOpenProject(null);
      }
    };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [data.projects]);
  const openProj = (p) => {
    setOpenProject(p);
    const url = new URL(window.location.href); url.searchParams.set("p", p.id);
    window.history.pushState({}, "", url);
  };
  const closeProj = () => {
    setOpenProject(null);
    const url = new URL(window.location.href); url.searchParams.delete("p");
    window.history.pushState({}, "", url);
  };

  const t = (obj) => (typeof obj === "string" ? obj : (obj?.[lang] ?? obj?.ua ?? ""));
  const tr = (ua, en, ru) => (lang === "ua" ? ua : lang === "en" ? en : ru);

  const filtered = filter === "all" ? data.projects : data.projects.filter((p) => p.cat === filter);

  const submit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.contact) return;
    if (formState.website) return; // honeypot caught a bot
    const lead = { name: formState.name, contact: formState.contact, msg: formState.msg, ts: Date.now() };
    if (window.PortfolioDB && window.PortfolioDB.insertLead) {
      window.PortfolioDB.insertLead(lead).catch(() => {});
    }
    setFormState({ name: "", contact: "", msg: "", website: "", sent: true });
  };

  const navItems = [["work", tr("роботи", "work", "работы")], ["services", tr("послуги", "services", "услуги")], ["stack", tr("стек", "stack", "стек")], ["blog", tr("блог", "blog", "блог")], ["contact", tr("контакт", "contact", "контакт")]];

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: T.sans, minHeight: "100%" }}>
      <style>{`
        .bento-root { --accent: ${accent}; }
        .bento-root * { box-sizing: border-box; }
        .bento-root a { color: inherit; text-decoration: none; }
        .bento-root ::selection { background: ${accent}; color: #08080B; }
        .bento-root .mono { font-family: ${T.mono}; }
        .bento-root .hover-accent { transition: color .2s; }
        .bento-root .hover-accent:hover { color: var(--accent); }

        .bento-root .bento {
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 20px;
          position: relative;
          transition: border-color .35s ease, transform .35s ease, background .35s ease;
          overflow: hidden;
        }
        .bento-root .bento.lift:hover { transform: translateY(-3px); border-color: ${T.borderHover}; background: rgba(255,255,255,0.04); }
        .bento-root .bento.glow::before {
          content: ""; position: absolute; width: 240px; height: 240px; border-radius: 50%;
          background: radial-gradient(circle, ${accent}22 0%, transparent 70%);
          top: -120px; right: -80px; opacity: 0; transition: opacity .4s ease; pointer-events: none;
        }
        .bento-root .bento.glow:hover::before { opacity: 1; }

        .bento-root .pill {
          font-family: ${T.mono}; font-size: 11px; letter-spacing: .04em;
          padding: 7px 13px; border-radius: 999px; border: 1px solid ${T.border};
          color: ${T.text2}; cursor: pointer; background: transparent; transition: all .2s;
        }
        .bento-root .pill:hover { border-color: ${T.borderHover}; color: ${T.text}; }
        .bento-root .pill.active { background: ${accent}; color: #08080B; border-color: ${accent}; font-weight: 500; }

        .bento-root .cta-primary {
          display: inline-flex; align-items: center; gap: 8px; font-weight: 500; font-size: 15px;
          padding: 13px 24px; border-radius: 12px; cursor: pointer; transition: all .25s ease;
          background: ${accent}; color: #08080B; border: 1px solid ${accent};
          box-shadow: 0 8px 30px ${accent}33;
        }
        .bento-root .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px ${accent}55; }
        .bento-root .cta-ghost {
          display: inline-flex; align-items: center; gap: 8px; font-weight: 500; font-size: 15px;
          padding: 13px 24px; border-radius: 12px; cursor: pointer; transition: all .25s ease;
          background: ${T.card}; color: ${T.text}; border: 1px solid ${T.border};
        }
        .bento-root .cta-ghost:hover { border-color: ${T.borderHover}; background: rgba(255,255,255,0.05); }

        .bento-root input, .bento-root textarea {
          font-family: ${T.sans}; width: 100%; background: rgba(255,255,255,0.03);
          border: 1px solid ${T.border}; color: ${T.text}; padding: 13px 15px; font-size: 15px;
          border-radius: 12px; transition: border-color .2s, background .2s;
        }
        .bento-root input:focus, .bento-root textarea:focus { outline: none; border-color: ${accent}; background: rgba(255,255,255,0.05); }

        .bento-root .h-display { font-weight: 600; letter-spacing: -0.035em; line-height: 1.0; margin: 0; }
        .bento-root .grad-text { background: linear-gradient(135deg, #fff 30%, ${accent}); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

        .bento-root .marquee { animation: bm-marq 38s linear infinite; }
        @keyframes bm-marq { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .bento-root .marquee-mask { -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
        .bento-root .live-dot { position: relative; }
        .bento-root .live-dot::after { content: ""; position: absolute; inset: -4px; border-radius: 50%; border: 1px solid var(--accent); animation: bm-pulse 2s ease-out infinite; }
        @keyframes bm-pulse { 0% { transform: scale(0.8); opacity: .8; } 100% { transform: scale(2.2); opacity: 0; } }
        @keyframes bm-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bm-slide { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        .bento-root .reveal { animation: bm-fade .6s ease both; }

        .bento-root .io-init { opacity: 0; transform: translateY(18px); transition: opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1); }
        .bento-root .io-in { opacity: 1; transform: none; }

        .grain-overlay {
          position: fixed; inset: 0; z-index: 60; pointer-events: none;
          opacity: 0.05; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        @media (prefers-reduced-motion: reduce) {
          .bento-root .io-init { opacity: 1 !important; transform: none !important; }
        }

        .bento-root .burger { display: none; background: ${T.card}; border: 1px solid ${T.border}; color: ${T.text}; width: 42px; height: 38px; border-radius: 10px; cursor: pointer; padding: 0; align-items: center; justify-content: center; }
        .bento-root .burger span, .bento-root .burger span::before, .bento-root .burger span::after { display: block; width: 16px; height: 1.5px; background: currentColor; transition: all .2s; }
        .bento-root .burger span { position: relative; }
        .bento-root .burger span::before, .bento-root .burger span::after { content: ""; position: absolute; left: 0; }
        .bento-root .burger span::before { top: -5px; } .bento-root .burger span::after { top: 5px; }
        .bento-root .burger.open span { background: transparent; }
        .bento-root .burger.open span::before { top: 0; transform: rotate(45deg); }
        .bento-root .burger.open span::after { top: 0; transform: rotate(-45deg); }

        .bento-root .wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .bento-root .grid { display: grid; gap: 16px; }

        @media (max-width: 920px) {
          .bento-root .nav-desktop { display: none !important; }
          .bento-root .burger { display: inline-flex; }
          .bento-root .hero-grid { grid-template-columns: 1fr !important; }
          .bento-root .hero-side { display: grid !important; grid-template-columns: 1fr 1fr !important; }
          .bento-root .auto-1 { grid-template-columns: 1fr !important; }
          .bento-root .auto-2 { grid-template-columns: 1fr !important; }
          .bento-root .auto-3 { grid-template-columns: 1fr !important; }
          .bento-root .auto-4 { grid-template-columns: 1fr 1fr !important; }
          .bento-root .contact-grid { grid-template-columns: 1fr !important; }
          .bento-root .work-cols { display: none !important; }
        }
        @media (max-width: 560px) {
          .bento-root .auto-4 { grid-template-columns: 1fr !important; }
          .bento-root .hero-side { grid-template-columns: 1fr !important; }
          .bento-root .sec { padding: 56px 0 !important; }
          .bento-root .hero-cta { flex-direction: column !important; }
          .bento-root .hero-cta a { width: 100% !important; justify-content: center !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bento-root .marquee { animation: none !important; }
          .bento-root .reveal { animation: none !important; }
        }
      `}</style>

      <div className="bento-root">
        {/* scroll progress */}
        <div style={{ position: "fixed", top: 0, left: 0, height: 2, width: `${prog * 100}%`, background: `linear-gradient(90deg, ${accent}, ${accent}99)`, boxShadow: `0 0 10px ${accent}`, zIndex: 80, transition: "width .1s linear" }} aria-hidden="true" />
        {/* film grain texture */}
        <div className="grain-overlay" aria-hidden="true" />
        {/* ambient background glow */}
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-10%", left: "20%", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${accent}14 0%, transparent 65%)`, filter: "blur(40px)" }} />
          <div style={{ position: "absolute", top: "30%", right: "-5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${accent}0C 0%, transparent 65%)`, filter: "blur(40px)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* NAV */}
          <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(8,8,11,0.72)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${T.border}` }}>
            <div className="wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
              <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 17, letterSpacing: "-0.02em" }}>
                <span style={{ width: 9, height: 9, borderRadius: 9, background: accent, boxShadow: `0 0 12px ${accent}` }} />
                {data.name.toLowerCase()}<span style={{ color: T.text3 }}>.dev</span>
              </a>
              <nav className="nav-desktop" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {navItems.map(([id, label]) => (
                  <a key={id} href={`#${id}`} style={{ padding: "8px 14px", fontSize: 14, color: T.text2, borderRadius: 9, transition: "all .2s" }} className="hover-accent">{label}</a>
                ))}
                <div style={{ display: "flex", gap: 2, marginLeft: 8, padding: 3, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                  {["ua", "en", "ru"].map((l) => (
                    <button key={l} onClick={() => setLang(l)} style={{ padding: "5px 10px", background: lang === l ? accent : "transparent", color: lang === l ? "#08080B" : T.text2, border: "none", fontFamily: T.mono, fontSize: 11, cursor: "pointer", textTransform: "uppercase", borderRadius: 7, fontWeight: lang === l ? 600 : 400 }}>{l}</button>
                  ))}
                </div>
              </nav>
              <button className={`burger ${navOpen ? "open" : ""}`} onClick={() => setNavOpen(!navOpen)} aria-label="Menu"><span /></button>
            </div>
            {navOpen && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: "16px 24px 24px", animation: "bm-slide .25s ease", background: T.bg }}>
                <nav style={{ display: "flex", flexDirection: "column" }}>
                  {navItems.map(([id, label], i) => (
                    <a key={id} href={`#${id}`} onClick={() => setNavOpen(false)} style={{ padding: "15px 0", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 18, fontWeight: 500 }}>
                      <span>{label}</span><span style={{ color: accent, fontSize: 12, fontFamily: T.mono }}>0{i + 1}</span>
                    </a>
                  ))}
                </nav>
                <div style={{ display: "flex", gap: 3, marginTop: 18, padding: 4, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, width: "fit-content" }}>
                  {["ua", "en", "ru"].map((l) => (
                    <button key={l} onClick={() => setLang(l)} style={{ padding: "7px 16px", background: lang === l ? accent : "transparent", color: lang === l ? "#08080B" : T.text2, border: "none", fontFamily: T.mono, fontSize: 12, cursor: "pointer", textTransform: "uppercase", borderRadius: 7 }}>{l}</button>
                  ))}
                </div>
              </div>
            )}
          </header>

          <a id="top" />

          {/* HERO — bento */}
          <section className="wrap sec" style={{ padding: "72px 24px 40px" }}>
            <div className="hero-grid grid reveal" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
              {/* main hero card */}
              <div className="bento glow" style={{ padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 360 }}>
                <div>
                  <div className="mono" style={{ fontSize: 12, color: accent, letterSpacing: "0.08em", marginBottom: 22, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span className="live-dot" style={{ width: 6, height: 6, borderRadius: 6, background: accent }} />
                    {tr("ДОСТУПНИЙ ДЛЯ ПРОЄКТІВ", "AVAILABLE FOR WORK", "ДОСТУПЕН ДЛЯ ПРОЕКТОВ")}
                  </div>
                  <h1 className="h-display" style={{ fontSize: "clamp(38px, 5.4vw, 68px)" }}>
                    {t(data.heroTitle).split("\n").map((line, i) => (
                      <div key={i} className={i === 1 ? "grad-text" : ""}>{line}</div>
                    ))}
                  </h1>
                </div>
                <div style={{ marginTop: 32 }}>
                  <p style={{ fontSize: 17, lineHeight: 1.55, color: T.text2, maxWidth: 480, margin: "0 0 28px" }}>{t(data.heroSub)}</p>
                  <div className="hero-cta" style={{ display: "flex", gap: 12 }}>
                    <a href="#contact" className="cta-primary">{tr("Почати проєкт", "Start a project", "Начать проект")} →</a>
                    <a href="#work" className="cta-ghost">{tr("Дивитися роботи", "See work", "Смотреть работы")}</a>
                  </div>
                </div>
              </div>

              {/* side stat cards */}
              <div className="hero-side grid" style={{ gridTemplateRows: "auto auto auto", gap: 16 }}>
                <div className="bento lift" style={{ padding: "26px 28px" }}>
                  <div className="h-display" style={{ fontSize: 46, color: accent }}>2024</div>
                  <div style={{ color: T.text2, fontSize: 14, marginTop: 4 }}>{tr("рік старту в IT", "year I started", "год старта в IT")}</div>
                </div>
                <div className="bento lift" style={{ padding: "26px 28px" }}>
                  <div className="h-display" style={{ fontSize: 46 }}>1+<span style={{ fontSize: 22, color: T.text2 }}>{tr("рік", "yr", "год")}</span></div>
                  <div style={{ color: T.text2, fontSize: 14, marginTop: 4 }}>{tr("самонавчання", "self-learning", "самообучения")}</div>
                </div>
                <a href="https://learn.microsoft.com/en-us/users/38035639/" target="_blank" rel="noopener noreferrer" className="bento lift glow" style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.05)" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24"><rect x="1" y="1" width="10.5" height="10.5" fill="#f25022" /><rect x="12.5" y="1" width="10.5" height="10.5" fill="#7fba00" /><rect x="1" y="12.5" width="10.5" height="10.5" fill="#00a4ef" /><rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#ffb900" /></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Microsoft Learn</div>
                    <div className="mono" style={{ fontSize: 11, color: accent, marginTop: 2 }}>Agentic AI ✓</div>
                  </div>
                  <span style={{ color: T.text3 }}>↗</span>
                </a>
              </div>
            </div>

            {/* marquee strip */}
            <div className="bento" style={{ marginTop: 16, padding: "16px 0", overflow: "hidden" }}>
              <div className="marquee marquee-mask" style={{ display: "flex", whiteSpace: "nowrap", fontFamily: T.mono, fontSize: 14, color: T.text2 }}>
                {Array(2).fill(0).map((_, j) => (
                  <div key={j} style={{ display: "flex", gap: 40, paddingRight: 40 }}>
                    {["TELEGRAM BOTS", "LANDING PAGES", "BUSINESS CARDS", "WEB APPS", "AUTOMATIONS", "UI/UX", "CONSULTING"].map((x, i) => (
                      <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 40 }}>{x}<span style={{ color: accent }}>✳</span></span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SERVICES */}
          <section id="services" className="wrap sec" style={{ padding: "72px 24px" }}>
            <SectionHead index="01" label={tr("ПОСЛУГИ", "SERVICES", "УСЛУГИ")} title={tr("Що я будую", "What I build", "Что я делаю")} accent={accent} />
            <div className="grid auto-3" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: 36 }}>
              {data.services.map((s, i) => (
                <div key={s.id} className="bento lift glow" style={{ padding: "28px 28px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div style={{ width: 46, height: 46, borderRadius: 12, display: "grid", placeItems: "center", fontSize: 22, color: accent, background: `${accent}14`, border: `1px solid ${accent}26` }}>{s.icon}</div>
                    <span className="mono" style={{ fontSize: 11, color: T.text3 }}>0{i + 1}</span>
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 8, letterSpacing: "-0.01em" }}>{t(s.title)}</div>
                  <div style={{ color: T.text2, fontSize: 14, lineHeight: 1.5 }}>{t(s.desc)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* WORK */}
          <section id="work" className="wrap sec" style={{ padding: "72px 24px" }}>
            <SectionHead index="02" label={tr("РОБОТИ", "WORK", "РАБОТЫ")} title={tr("Вибрані проєкти", "Selected work", "Избранные проекты")} accent={accent} />
            <div style={{ display: "flex", gap: 8, marginTop: 28, flexWrap: "wrap" }}>
              {data.categories.map((c) => (
                <button key={c.id} onClick={() => setFilter(c.id)} className={`pill ${filter === c.id ? "active" : ""}`}>{t(c.label)}</button>
              ))}
            </div>
            <div className="grid auto-2" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 28 }}>
              {filtered.map((p, i) => (
                <div key={p.id} onClick={() => openProj(p)} className="bento lift glow" style={{ padding: 0, cursor: "pointer", display: "flex", flexDirection: "column" }}>
                  <div style={{ aspectRatio: "16/9", background: p.image ? `url(${p.image}) center/cover no-repeat` : `linear-gradient(135deg, ${accent}1A, transparent 70%), ${T.cardSolid}`, borderBottom: `1px solid ${T.border}`, display: "grid", placeItems: "center" }}>
                    {!p.image && <span style={{ fontSize: 40, color: `${accent}55` }}>{p.title.charAt(0)}</span>}
                  </div>
                  <div style={{ padding: "22px 24px", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                      <span style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em" }}>{p.title}</span>
                      <span className="mono" style={{ fontSize: 12, color: accent }}>{p.metric}</span>
                    </div>
                    <div style={{ color: T.text2, fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>{t(p.tag)} — {t(p.desc)}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="mono" style={{ fontSize: 11, color: T.text3 }}>{p.stack}</span>
                      <span className="mono" style={{ fontSize: 11, color: T.text3 }}>{p.year} →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PROCESS */}
          <section id="process" className="wrap sec" style={{ padding: "72px 24px" }}>
            <SectionHead index="03" label={tr("ПРОЦЕС", "PROCESS", "ПРОЦЕСС")} title={tr("Як ми працюємо", "How we work", "Как мы работаем")} accent={accent} />
            <div className="grid auto-2" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: 36 }}>
              {data.process.map((p, i) => (
                <div key={i} className="bento lift" style={{ padding: "28px 26px" }}>
                  <div className="mono" style={{ fontSize: 13, color: accent, marginBottom: 16 }}>{p.n}</div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{t(p.title)}</div>
                  <div style={{ color: T.text2, fontSize: 13.5, lineHeight: 1.5 }}>{t(p.desc)}</div>
                </div>
              ))}
            </div>
          </section>

          {/* TESTIMONIALS */}
          <section className="wrap sec" style={{ padding: "72px 24px" }}>
            <SectionHead index="04" label={tr("ВІДГУКИ", "TESTIMONIALS", "ОТЗЫВЫ")} title={tr("Що кажуть клієнти", "What clients say", "Что говорят клиенты")} accent={accent} />
            <div className="grid auto-3" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: 36 }}>
              {data.testimonials.map((x) => (
                <div key={x.id} className="bento lift" style={{ padding: "30px 28px", display: "flex", flexDirection: "column" }}>
                  <div style={{ color: accent, fontSize: 44, fontWeight: 700, lineHeight: 0.6, marginBottom: 18 }}>"</div>
                  <div style={{ fontSize: 16, lineHeight: 1.55, flex: 1, marginBottom: 22 }}>{t(x.text)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 999, background: `${accent}22`, color: accent, display: "grid", placeItems: "center", fontWeight: 600, fontSize: 15 }}>{x.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{x.name}</div>
                      <div style={{ color: T.text2, fontSize: 13 }}>{t(x.role)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TECH STACK */}
          <section id="stack" className="wrap sec" style={{ padding: "72px 24px" }}>
            <SectionHead index="05" label={tr("СТЕК", "STACK", "СТЕК")} title={tr("Мови та технології", "Languages & technologies", "Языки и технологии")} accent={accent} />
            <p style={{ color: T.text2, fontSize: 16, lineHeight: 1.55, maxWidth: 560, marginTop: 18 }}>{tr("Те, чим я працюю щодня — від ідеї до продакшну. Підбираю інструмент під задачу, а не навпаки.", "What I work with daily — from idea to production. I pick the tool for the task, not the other way around.", "То, чем я работаю каждый день — от идеи до продакшна. Подбираю инструмент под задачу, а не наоборот.")}</p>

            {/* featured primary techs */}
            <div className="grid auto-4" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginTop: 32 }}>
              {(data.techStack?.featured || []).map((tech) => (
                <div key={tech.name} className="bento lift glow" style={{ padding: "22px 22px", display: "flex", alignItems: "center", gap: 15 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 700, fontSize: 22, color: accent, background: `${accent}14`, border: `1px solid ${accent}26`, fontFamily: T.mono }}>{tech.name.charAt(0)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{tech.name}</div>
                    <div style={{ color: T.text2, fontSize: 12.5, marginTop: 2 }}>{t(tech.cat)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* grouped chips */}
            <div className="grid auto-2" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
              {(data.techStack?.groups || []).map((g) => (
                <div key={g.id} className="bento lift" style={{ padding: "24px 26px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>{t(g.label)}</div>
                    <span className="mono" style={{ fontSize: 11, color: T.text3 }}>{String(g.items.length).padStart(2, "0")}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {g.items.map((it) => (
                      <span key={it} className="mono" style={{ fontSize: 13, padding: "7px 12px", borderRadius: 9, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}`, color: T.text2, transition: "all .2s" }}>{it}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="wrap sec" style={{ padding: "72px 24px" }}>
            <SectionHead index="06" label="FAQ" title={tr("Часті питання", "Frequent questions", "Частые вопросы")} accent={accent} />
            <div className="bento" style={{ marginTop: 36, padding: "8px 32px", maxWidth: 860 }}>
              {data.faq.map((f, i) => (
                <div key={f.id} style={{ borderBottom: i === data.faq.length - 1 ? "none" : `1px solid ${T.border}` }}>
                  <button onClick={() => setOpenFaq(openFaq === f.id ? null : f.id)} style={{ width: "100%", padding: "22px 0", background: "transparent", border: "none", color: "inherit", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 17, fontWeight: 500 }}>
                    <span>{t(f.q)}</span>
                    <span style={{ color: accent, fontSize: 22, transform: openFaq === f.id ? "rotate(45deg)" : "rotate(0)", transition: "transform .25s", flexShrink: 0, marginLeft: 16 }}>+</span>
                  </button>
                  {openFaq === f.id && <div style={{ paddingBottom: 22, color: T.text2, fontSize: 15, lineHeight: 1.6, maxWidth: 680 }}>{t(f.a)}</div>}
                </div>
              ))}
            </div>
          </section>

          {/* BLOG */}
          <section id="blog" className="wrap sec" style={{ padding: "72px 24px" }}>
            <SectionHead index="07" label={tr("БЛОГ", "BLOG", "БЛОГ")} title={tr("Нотатки", "Notes", "Заметки")} accent={accent} />
            <div className="grid auto-3" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: 36 }}>
              {data.blog.map((b) => (
                <a key={b.id} href="#" onClick={(e) => { e.preventDefault(); setOpenNote(b); }} className="bento lift glow" style={{ padding: "28px 28px", display: "flex", flexDirection: "column", cursor: "pointer" }}>
                  <div className="mono" style={{ fontSize: 11, color: T.text3, marginBottom: 16 }}>{b.date} · {b.readMin} min</div>
                  <div style={{ fontSize: 19, fontWeight: 600, marginBottom: 12, letterSpacing: "-0.01em", lineHeight: 1.25 }}>{t(b.title)}</div>
                  <div style={{ color: T.text2, fontSize: 14, lineHeight: 1.55, flex: 1, marginBottom: 20 }}>{t(b.excerpt)}</div>
                  <div className="mono" style={{ fontSize: 12, color: accent }}>{tr("читати", "read", "читать")} →</div>
                </a>
              ))}
            </div>
          </section>

          {/* CONTACT */}
          <section id="contact" className="wrap sec" style={{ padding: "72px 24px 96px" }}>
            <div className="contact-grid grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="bento" style={{ padding: "44px 40px", display: "flex", flexDirection: "column" }}>
                <SectionHead index="08" label={tr("ПРО МЕНЕ", "ABOUT", "ОБО МНЕ")} title={tr("Привіт, я Богдан", "Hey, I'm Bohdan", "Привет, я Богдан")} accent={accent} />
                <p style={{ marginTop: 28, fontSize: 17, lineHeight: 1.6, color: T.text2 }}>{t(data.bio)}</p>

                {/* code snippet profile */}
                <div className="bento" style={{ marginTop: 28, padding: 0, overflow: "hidden", background: "#0B0B0F" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 16px", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ width: 11, height: 11, borderRadius: 11, background: "#ff5f57" }} />
                    <span style={{ width: 11, height: 11, borderRadius: 11, background: "#febc2e" }} />
                    <span style={{ width: 11, height: 11, borderRadius: 11, background: "#28c840" }} />
                    <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: T.text3 }}>developer.ts</span>
                  </div>
                  <pre className="mono" style={{ margin: 0, padding: "18px 20px", fontSize: 13, lineHeight: 1.75, color: T.text2, overflowX: "auto" }}>
<span style={{ color: "#c678dd" }}>const</span> <span style={{ color: T.text }}>dev</span> <span style={{ color: "#56b6c2" }}>=</span> {"{"}
{"\n  "}<span style={{ color: accent }}>role</span>: <span style={{ color: "#98c379" }}>"Self-taught Developer"</span>,
{"\n  "}<span style={{ color: accent }}>focus</span>: [<span style={{ color: "#98c379" }}>"bots"</span>, <span style={{ color: "#98c379" }}>"sites"</span>, <span style={{ color: "#98c379" }}>"automation"</span>],
{"\n  "}<span style={{ color: accent }}>stack</span>: [<span style={{ color: "#98c379" }}>"Python"</span>, <span style={{ color: "#98c379" }}>"JS"</span>, <span style={{ color: "#98c379" }}>"aiogram"</span>, <span style={{ color: "#98c379" }}>"React"</span>],
{"\n  "}<span style={{ color: accent }}>available</span>: <span style={{ color: "#d19a66" }}>true</span>,
{"\n"}{"}"}
                  </pre>
                </div>

                {/* stats */}
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {(data.stats || []).map((s, i) => (
                    <div key={i} style={{ padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
                      <div className="h-display" style={{ fontSize: 30, color: accent }}>{s.n}</div>
                      <div style={{ color: T.text2, fontSize: 13, marginTop: 3 }}>{t(s.label)}</div>
                    </div>
                  ))}
                </div>

                {/* direct contacts — phone hidden, email + telegram only */}
                <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "110px 1fr", gap: "12px 16px", fontSize: 14, fontFamily: T.mono, alignItems: "center" }}>
                  <span style={{ color: T.text3 }}>email</span><a href={`mailto:${data.contacts.email}`} className="hover-accent">{data.contacts.email}</a>
                  <span style={{ color: T.text3 }}>telegram</span><a href={`https://t.me/${data.contacts.telegram.replace("@", "")}`} className="hover-accent">{data.contacts.telegram}</a>
                  <span style={{ color: T.text3 }}>location</span><span>{t(data.contacts.location)}</span>
                </div>
              </div>

              <div className="bento glow" style={{ padding: "44px 40px", position: "relative" }}>
                <div className="mono" style={{ fontSize: 11, color: T.text3, marginBottom: 18, letterSpacing: "0.08em" }}>{tr("НОВИЙ ЗАПИТ", "NEW REQUEST", "НОВЫЙ ЗАПРОС")}</div>
                <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 28, letterSpacing: "-0.02em" }}>{tr("Є ідея? Напишіть.", "Got an idea? Drop a line.", "Есть идея? Напишите.")}</div>
                {formState.sent ? (
                  <div style={{ border: `1px solid ${accent}44`, background: `${accent}0F`, padding: 28, borderRadius: 14 }}>
                    <div className="mono" style={{ fontSize: 11, color: accent, marginBottom: 12, letterSpacing: "0.08em" }}>✓ {tr("ЗАЯВКУ ПРИЙНЯТО", "LEAD REGISTERED", "ЗАЯВКА ПРИНЯТА")}</div>
                    <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 12 }}>{tr("Дякую! Я отримав повідомлення.", "Thanks! Got your message.", "Спасибо! Получил сообщение.")}</div>
                    <div style={{ color: T.text2, fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>{tr("Відповім протягом 24 годин у Telegram або email.", "I'll reply within 24h via Telegram or email.", "Отвечу в течение 24ч в Telegram или email.")}</div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      {data.contacts?.telegram && <a href={`https://t.me/${data.contacts.telegram.replace("@", "")}`} target="_blank" className="cta-ghost" style={{ fontSize: 13, padding: "9px 16px" }}>→ Telegram</a>}
                      <button onClick={() => setFormState({ name: "", contact: "", msg: "", website: "", sent: false })} className="cta-ghost" style={{ fontSize: 13, padding: "9px 16px" }}>← {tr("Нове", "New", "Новое")}</button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submit}>
                    <Field label={tr("Ваше ім'я", "Your name", "Ваше имя")} value={formState.name} onChange={(v) => setFormState((s) => ({ ...s, name: v }))} />
                    <Field label="Telegram / Email" value={formState.contact} onChange={(v) => setFormState((s) => ({ ...s, contact: v }))} />
                    <Field label={tr("Коротко про задачу", "Briefly about the task", "Кратко о задаче")} value={formState.msg} onChange={(v) => setFormState((s) => ({ ...s, msg: v }))} textarea />
                    <input tabIndex={-1} autoComplete="off" type="text" name="website" value={formState.website} onChange={(e) => setFormState((s) => ({ ...s, website: e.target.value }))} style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} aria-hidden="true" />
                    <button type="submit" className="cta-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>{tr("Відправити", "Send", "Отправить")} →</button>
                  </form>
                )}
              </div>
            </div>
          </section>

          {/* FOOTER */}
          <footer style={{ borderTop: `1px solid ${T.border}` }}>
            <div className="wrap" style={{ padding: "32px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, fontFamily: T.mono, fontSize: 12, color: T.text3 }}>
              <div>© 2026 {data.name.toLowerCase()}.dev</div>
              <div>{tr("Зроблено з увагою до деталей", "Built with care", "Сделано с вниманием к деталям")}</div>
            </div>
          </footer>
        </div>

        {/* PROJECT MODAL */}
        {openProject && (
          <div onClick={closeProj} style={{ position: "fixed", inset: 0, background: "rgba(4,4,7,0.8)", backdropFilter: "blur(10px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} className="bento" style={{ maxWidth: 720, width: "100%", maxHeight: "90vh", overflowY: "auto", background: T.cardSolid, padding: 0, animation: "bm-fade .25s ease" }}>
              {openProject.image
                ? <div style={{ aspectRatio: "16/9", background: `url(${openProject.image}) center/cover no-repeat` }} />
                : <div style={{ aspectRatio: "16/7", background: `linear-gradient(135deg, ${accent}22, transparent 70%), ${T.cardSolid}`, display: "grid", placeItems: "center", fontSize: 64, color: `${accent}55` }}>{openProject.title.charAt(0)}</div>}
              <div style={{ padding: "36px 40px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="mono" style={{ fontSize: 12, color: accent, marginBottom: 14 }}>{openProject.year} · {openProject.cat.toUpperCase()}</div>
                  <button onClick={closeProj} style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text2, width: 34, height: 34, borderRadius: 10, cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
                <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 14 }}>{openProject.title}</div>
                <div style={{ fontSize: 17, color: T.text2, marginBottom: 22 }}>{t(openProject.tag)}</div>
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 22, fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>{t(openProject.desc)}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="bento" style={{ padding: "16px 18px" }}>
                    <div className="mono" style={{ fontSize: 10, color: T.text3, marginBottom: 6 }}>STACK</div>
                    <div className="mono" style={{ fontSize: 13 }}>{openProject.stack}</div>
                  </div>
                  <div className="bento" style={{ padding: "16px 18px" }}>
                    <div className="mono" style={{ fontSize: 10, color: T.text3, marginBottom: 6 }}>RESULT</div>
                    <div className="mono" style={{ fontSize: 13, color: accent }}>{openProject.metric}</div>
                  </div>
                </div>
                {openProject.url && (
                  <a href={openProject.url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 20, padding: "12px 22px", background: accent, color: "#0E0E10", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                    {tr("Відкрити проект", "View project", "Открыть проект")} ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NOTE MODAL */}
        {openNote && (
          <div onClick={() => setOpenNote(null)} style={{ position: "fixed", inset: 0, background: "rgba(4,4,7,0.85)", backdropFilter: "blur(10px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "bm-fade .2s ease" }}>
            <div onClick={(e) => e.stopPropagation()} className="bento" style={{ maxWidth: 760, width: "100%", maxHeight: "90vh", overflowY: "auto", background: T.cardSolid, padding: "48px 48px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div className="mono" style={{ fontSize: 11, color: accent, letterSpacing: "0.08em" }}>{openNote.date} · {openNote.readMin} MIN READ</div>
                <button onClick={() => setOpenNote(null)} style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text2, width: 34, height: 34, borderRadius: 10, cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
              <div style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 28 }}>{t(openNote.title)}</div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 28, color: T.text2, fontSize: 16, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {t(openNote.excerpt)}
                {(!openNote.body || !t(openNote.body)) && <div style={{ color: T.text3, fontStyle: "italic", marginTop: 22, fontSize: 14 }}>— {tr("Повний текст ще не опубліковано.", "Full text not published yet.", "Полный текст ещё не опубликован.")}</div>}
                {openNote.body && t(openNote.body) && <div style={{ marginTop: 22, color: T.text }}>{t(openNote.body)}</div>}
              </div>
              <div style={{ marginTop: 36, paddingTop: 22, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="mono" style={{ fontSize: 12, color: T.text3 }}>— {data.name}</div>
                <button onClick={() => setOpenNote(null)} className="mono" style={{ fontSize: 12, color: accent, background: "transparent", border: "none", cursor: "pointer" }}>← {tr("закрити", "close", "закрыть")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHead({ index, label, title, accent }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.text3 }}>№ {index}</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: accent, letterSpacing: "0.15em" }}>{label}</span>
      </div>
      <h2 className="h-display" style={{ fontSize: "clamp(30px, 4vw, 48px)" }}>{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, textarea }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text3, marginBottom: 7, letterSpacing: "0.04em" }}>{label}</div>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} style={{ resize: "vertical" }} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

Object.assign(window, { DarkSite });
