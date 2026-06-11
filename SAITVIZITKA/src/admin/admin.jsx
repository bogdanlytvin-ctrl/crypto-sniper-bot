// Admin panel — /admin.html
// Password gate, then tabs: Dashboard, Content, Services, Portfolio, Categories, Reviews, Plans, FAQ, Blog, Contacts, Theme, Leads.

const ADMIN_SESSION_KEY = "pf_admin_session";

function AdminApp() {
  const [data, update] = useStore();
  const isRemote = !!(window.PortfolioDB && window.PortfolioDB.mode === "remote");
  const [authed, setAuthed] = React.useState(() => sessionStorage.getItem(ADMIN_SESSION_KEY) === "yes");
  const [email, setEmail] = React.useState((window.PORTFOLIO_CONFIG && window.PORTFOLIO_CONFIG.ADMIN_EMAIL) || "");
  const [pass, setPass] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [tab, setTab] = React.useState("dashboard");
  const [lang, setLang] = React.useState("ua");
  const [toast, setToast] = React.useState(null);
  const [saveStatus, setSaveStatus] = React.useState(null); // null | 'saving' | 'saved' | 'error'

  const accent = data.accent;

  // nothing to restore — auth is sessionStorage-only

  const login = async (e) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const res = await window.PortfolioDB.verifyPassword(pass);
      if (res && res.ok) {
        sessionStorage.setItem("pf_admin_pass", pass);
        sessionStorage.setItem(ADMIN_SESSION_KEY, "yes");
        if (res.telegram) update(d => { d.telegram = res.telegram; return d; });
        setAuthed(true);
      } else {
        setErr("Невірний пароль"); setBusy(false); return;
      }
    } catch (ex) { setErr(ex.message || "Помилка"); }
    setBusy(false);
  };
  const logout = async () => {
    sessionStorage.removeItem("pf_admin_pass");
    sessionStorage.removeItem(ADMIN_SESSION_KEY); setAuthed(false); setPass("");
  };

  // On reload with an active session, re-fetch the protected telegram config
  // (the public /api/load strips it, so it isn't in the hydrated store).
  React.useEffect(() => {
    if (!authed) return;
    const p = sessionStorage.getItem("pf_admin_pass");
    if (!p || (data.telegram && data.telegram.botToken)) return;
    window.PortfolioDB.verifyPassword(p).then(res => {
      if (res && res.ok && res.telegram) update(d => { d.telegram = res.telegram; return d; });
    }).catch(() => {});
  }, [authed]);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const saveToDb = async () => {
    if (!isRemote) { notify("Supabase не підключений — дані в localStorage"); return; }
    setSaveStatus("saving");
    try {
      await window.PortfolioDB.saveContent(data);
      setSaveStatus("saved");
      notify("Збережено в базу даних!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      setSaveStatus("error");
      notify("Помилка збереження: " + (e.message || "невідома"));
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0E0E10", padding: 40 }}>
        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        <form onSubmit={login} style={{ width: 420, background: "#151517", border: "1px solid #232327", borderRadius: 16, padding: 40, animation: "fadeIn .5s ease" }}>
          <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 48, lineHeight: 1, marginBottom: 8 }}>Admin</div>
          <div style={{ color: "#8B8982", fontSize: 14, marginBottom: 24 }}>
            Введіть пароль, щоб керувати сайтом
          </div>
          <div style={{ display: "inline-flex", gap: 6, marginBottom: 24, padding: "4px 10px", borderRadius: 999, background: isRemote ? "rgba(92,191,127,0.1)" : "rgba(232,124,90,0.1)", border: `1px solid ${isRemote ? "#5CBF7F" : "#E87C5A"}33`, fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: isRemote ? "#5CBF7F" : "#E87C5A", letterSpacing: "0.1em" }}>
            <span>●</span><span>{isRemote ? "REMOTE · DB" : "LOCAL · LOCALSTORAGE"}</span>
          </div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5E5B54", marginBottom: 8, letterSpacing: "0.1em" }}>PASSWORD</div>
          <input autoFocus={!isRemote} type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={{ width: "100%", background: "#0E0E10", border: "1px solid #232327", color: "#E8E6E1", padding: 14, fontSize: 15, borderRadius: 10, outline: "none" }} />
          {err && <div style={{ color: "#E87C5A", fontSize: 13, marginTop: 12 }}>{err}</div>}
          <button type="submit" disabled={busy} style={{ width: "100%", marginTop: 20, padding: 14, background: accent, color: "#0E0E10", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1 }}>{busy ? "Вхід..." : "Увійти →"}</button>
          {!isRemote && (
            <div style={{ marginTop: 24, fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#5E5B54", textAlign: "center" }}>
              Введіть свій пароль
            </div>
          )}
          <a href="index.html" style={{ display: "block", textAlign: "center", marginTop: 16, color: "#8B8982", fontSize: 12, textDecoration: "none" }}>← на сайт</a>
        </form>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Дашборд", icon: "◉" },
    { id: "leads", label: "Заявки", icon: "✉", badge: (data.leads || []).filter(l => l.new).length },
    { id: "content", label: "Контент", icon: "✎" },
    { id: "portfolio", label: "Портфоліо", icon: "▣" },
    { id: "services", label: "Послуги", icon: "◆" },
    { id: "categories", label: "Категорії", icon: "#" },
    { id: "plans", label: "Тарифи", icon: "$" },
    { id: "calculator", label: "Калькулятор", icon: "≈" },
    { id: "testimonials", label: "Відгуки", icon: "★" },
    { id: "faq", label: "FAQ", icon: "?" },
    { id: "blog", label: "Блог", icon: "⚘" },
    { id: "contacts", label: "Контакти", icon: "⚿" },
    { id: "telegram", label: "Telegram-бот", icon: "✈" },
    { id: "theme", label: "Тема", icon: "◐" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100vh" }}>
      <style>{`
        .adm { --accent: ${accent}; }
        .adm .tab { transition: all .15s; }
        .adm .tab:hover { background: #1E1E22; }
        .adm .tab.active { background: ${accent}18; color: ${accent}; }
        .adm .tab.active .dot { background: ${accent}; }
        .adm button.btn { transition: all .15s; cursor: pointer; }
        .adm button.btn:hover { filter: brightness(1.1); }
        .adm input, .adm textarea, .adm select { transition: border-color .15s; }
        .adm input:focus, .adm textarea:focus, .adm select:focus { outline: none; border-color: ${accent} !important; }
        .adm .card { background: #151517; border: 1px solid #232327; border-radius: 14px; }
        .adm .row { transition: background .15s; }
        .adm .row:hover { background: #1B1B1E; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .adm .toast { animation: slideDown .2s ease; }
      `}</style>

      <aside className="adm" style={{ background: "#0A0A0C", borderRight: "1px solid #1C1C20", padding: "24px 16px", position: "sticky", top: 0, height: "100vh", overflow: "auto" }}>
        <div style={{ padding: "4px 12px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: accent, display: "grid", placeItems: "center", color: "#0E0E10", fontFamily: "Instrument Serif, serif", fontSize: 20, fontWeight: 600 }}>b</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Admin</div>
            <div style={{ fontSize: 11, color: "#8B8982" }}>{data.name}'s portfolio</div>
          </div>
        </div>
        {tabs.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "transparent", border: "none", color: tab === t.id ? accent : "#C4C1B9", fontSize: 13, cursor: "pointer", borderRadius: 8, marginBottom: 2, textAlign: "left", fontFamily: "inherit" }}>
            <span className="dot" style={{ width: 20, height: 20, borderRadius: 5, background: "#232327", display: "grid", placeItems: "center", fontSize: 11, color: tab === t.id ? "#0E0E10" : "#8B8982", fontFamily: "JetBrains Mono, monospace" }}>{t.icon}</span>
            <span style={{ flex: 1 }}>{t.label}</span>
            {t.badge > 0 && <span style={{ background: accent, color: "#0E0E10", fontSize: 10, padding: "2px 7px", borderRadius: 8, fontWeight: 600 }}>{t.badge}</span>}
          </button>
        ))}
        <div style={{ marginTop: 24, padding: "0 12px" }}>
          <button
            onClick={saveToDb}
            disabled={saveStatus === "saving"}
            style={{
              width: "100%", padding: "11px 0", marginBottom: 10,
              background: saveStatus === "saved" ? "#5CBF7F" : saveStatus === "error" ? "#E87C5A" : saveStatus === "saving" ? "#555" : accent,
              color: "#0E0E10", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: saveStatus === "saving" ? "wait" : "pointer", transition: "background .3s",
            }}>
            {saveStatus === "saving" ? "Зберігаю..." : saveStatus === "saved" ? "✓ Збережено" : saveStatus === "error" ? "✗ Помилка" : "💾 Зберегти в БД"}
          </button>
          <div style={{ fontSize: 10, color: "#5E5B54", fontFamily: "JetBrains Mono, monospace", textAlign: "center", marginBottom: 16, lineHeight: 1.4 }}>
            {isRemote ? "● DB · зміни видно звідусіль" : "○ LOCAL · тільки цей браузер"}
          </div>
          <a href="index.html" style={{ color: "#8B8982", fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>↗ Дивитись сайт</a>
          <button onClick={logout} style={{ background: "transparent", border: "none", color: "#8B8982", fontSize: 12, padding: "8px 0", cursor: "pointer", textAlign: "left", width: "100%" }}>← Вийти</button>
          <button onClick={() => { if (confirm("Скинути всі дані до дефолтних?")) { resetStore(); notify("Дані скинуті"); } }} style={{ background: "transparent", border: "1px solid #2E2E33", color: "#E87C5A", fontSize: 11, padding: "8px", cursor: "pointer", textAlign: "center", width: "100%", marginTop: 8, borderRadius: 6 }}>Reset data</button>
        </div>
      </aside>

      <main className="adm" style={{ padding: "32px 40px", maxWidth: 1100, width: "100%" }}>
        {tab === "dashboard" && <Dashboard data={data} />}
        {tab === "leads" && <Leads data={data} update={update} notify={notify} />}
        {tab === "content" && <ContentTab data={data} update={update} lang={lang} setLang={setLang} notify={notify} />}
        {tab === "portfolio" && <PortfolioTab data={data} update={update} lang={lang} setLang={setLang} notify={notify} />}
        {tab === "services" && <ServicesTab data={data} update={update} lang={lang} setLang={setLang} notify={notify} />}
        {tab === "categories" && <CategoriesTab data={data} update={update} lang={lang} setLang={setLang} notify={notify} />}
        {tab === "plans" && <PlansTab data={data} update={update} lang={lang} setLang={setLang} notify={notify} />}
        {tab === "calculator" && <CalculatorTab data={data} update={update} notify={notify} />}
        {tab === "testimonials" && <TestimonialsTab data={data} update={update} lang={lang} setLang={setLang} notify={notify} />}
        {tab === "faq" && <FaqTab data={data} update={update} lang={lang} setLang={setLang} notify={notify} />}
        {tab === "blog" && <BlogTab data={data} update={update} lang={lang} setLang={setLang} notify={notify} />}
        {tab === "contacts" && <ContactsTab data={data} update={update} lang={lang} setLang={setLang} notify={notify} />}
        {tab === "telegram" && <TelegramTab data={data} update={update} notify={notify} />}
        {tab === "theme" && <ThemeTab data={data} update={update} notify={notify} />}
      </main>

      {toast && (
        <div className="toast" style={{ position: "fixed", top: 24, right: 24, background: accent, color: "#0E0E10", padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 1000, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>✓ {toast}</div>
      )}
    </div>
  );
}

// ========== SHARED UI ==========

function PageHead({ title, sub, actions }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginBottom: 28, gap: 20 }}>
      <div>
        <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 42, lineHeight: 1 }}>{title}</div>
        {sub && <div style={{ color: "#8B8982", fontSize: 14, marginTop: 8 }}>{sub}</div>}
      </div>
      <div>{actions}</div>
    </div>
  );
}

function LangSwitch({ lang, setLang }) {
  return (
    <div style={{ display: "inline-flex", gap: 2, background: "#151517", padding: 3, borderRadius: 8, border: "1px solid #232327" }}>
      {["ua", "en", "ru"].map((l) => (
        <button key={l} onClick={() => setLang(l)} style={{ padding: "5px 12px", background: lang === l ? "var(--accent)" : "transparent", color: lang === l ? "#0E0E10" : "#8B8982", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", textTransform: "uppercase", fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}>{l}</button>
      ))}
    </div>
  );
}

function Input({ label, value, onChange, textarea, rows = 3, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#8B8982", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>}
      {textarea ? (
        <textarea value={value ?? ""} rows={rows} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", background: "#0E0E10", border: "1px solid #232327", color: "#E8E6E1", padding: 12, fontSize: 14, borderRadius: 8, resize: "vertical", fontFamily: "inherit" }} />
      ) : (
        <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", background: "#0E0E10", border: "1px solid #232327", color: "#E8E6E1", padding: 12, fontSize: 14, borderRadius: 8 }} />
      )}
    </div>
  );
}

function TriField({ label, value, onChange, lang, textarea }) {
  // edits the field ONLY in the currently selected lang
  return <Input label={`${label} (${lang.toUpperCase()})`} value={value?.[lang] ?? ""} onChange={(v) => onChange({ ...(value || {}), [lang]: v })} textarea={textarea} />;
}

function Btn({ children, onClick, kind = "primary", small }) {
  const styles = {
    primary: { background: "var(--accent)", color: "#0E0E10" },
    ghost: { background: "transparent", color: "#E8E6E1", border: "1px solid #2E2E33" },
    danger: { background: "transparent", color: "#E87C5A", border: "1px solid #3A2A26" },
  };
  return (
    <button className="btn" onClick={onClick} style={{ padding: small ? "6px 12px" : "10px 18px", border: "none", borderRadius: 8, fontSize: small ? 12 : 13, fontWeight: 600, cursor: "pointer", ...styles[kind] }}>
      {children}
    </button>
  );
}

// ========== DASHBOARD ==========

function Dashboard({ data }) {
  const now = Date.now();
  const last7 = (data.visits || []).filter(v => now - v.ts < 7 * 24 * 3600e3);
  const last30 = (data.visits || []).filter(v => now - v.ts < 30 * 24 * 3600e3);
  const byDay = {};
  last7.forEach(v => { const d = new Date(v.ts).toLocaleDateString("uk-UA"); byDay[d] = (byDay[d] || 0) + 1; });
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 24 * 3600e3).toLocaleDateString("uk-UA");
    days.push({ d: d.slice(0, 5), n: byDay[d] || 0 });
  }
  const maxN = Math.max(1, ...days.map(x => x.n));
  const newLeads = (data.leads || []).filter(l => l.new).length;

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `portfolio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const stats = [
    { label: "Візитів / 30 днів", value: last30.length, sub: `${last7.length} за тиждень` },
    { label: "Нових заявок", value: newLeads, sub: `${(data.leads || []).length} всього` },
    { label: "Проектів у портфоліо", value: (data.projects || []).length, sub: `${(data.categories || []).length - 1} категорій` },
    { label: "Опубліковано статей", value: (data.blog || []).length, sub: "в блозі" },
  ];

  return (
    <div>
      <PageHead title="Дашборд" sub={`Привіт, ${data.name}! Ось короткий огляд.`} actions={<Btn onClick={exportJSON}>↓ Бекап JSON</Btn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ padding: 24 }}>
            <div style={{ color: "#8B8982", fontSize: 12, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.05em" }}>{s.label}</div>
            <div style={{ fontFamily: "Instrument Serif, serif", fontSize: 48, lineHeight: 1, margin: "10px 0 6px" }}>{s.value}</div>
            <div style={{ color: "#8B8982", fontSize: 12 }}>{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>Візити за 7 днів</div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#8B8982" }}>всього: {last7.length}</div>
        </div>
        <div style={{ display: "flex", alignItems: "end", gap: 8, height: 160, marginTop: 20 }}>
          {days.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "end" }}>
                <div style={{ width: "100%", height: `${(d.n / maxN) * 100}%`, background: "var(--accent)", borderRadius: "4px 4px 0 0", minHeight: 2, transition: "height .3s" }} />
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#8B8982" }}>{d.d}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>{d.n}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ color: "#5E5B54", fontSize: 12, marginTop: 20, fontFamily: "JetBrains Mono, monospace" }}>
        ℹ статистика у прототипі збирається в localStorage — відкривайте сайт у сусідньому вікні, щоб бачити цифри.
      </div>
    </div>
  );
}

// ========== LEADS ==========

function Leads({ data, update, notify }) {
  const leads = (data.leads || []).slice().reverse();
  const markRead = (id) => update(d => { d.leads = d.leads.map(l => l.id === id ? { ...l, new: false } : l); return d; });
  const del = (id) => { if (!confirm("Видалити заявку?")) return; update(d => { d.leads = d.leads.filter(l => l.id !== id); return d; }); notify("Видалено"); };
  const exportCSV = () => {
    if (!leads.length) { notify("Немає заявок для експорту"); return; }
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Дата", "Ім'я", "Контакт", "Повідомлення", "Новий"]];
    leads.forEach(l => rows.push([new Date(l.ts).toISOString(), l.name, l.contact, l.msg || "", l.new ? "так" : "ні"]));
    const csv = "\uFEFF" + rows.map(r => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    notify(`Експортовано ${leads.length} заявок`);
  };
  return (
    <div>
      <PageHead title="Заявки" sub={`Заявки з форми — ${leads.length} всього`} actions={<><Btn onClick={exportCSV}>↓ CSV</Btn> <Btn kind="ghost" onClick={() => { if (!confirm("Очистити всі заявки?")) return; update(d => { d.leads = []; return d; }); notify("Очищено"); }}>Очистити всі</Btn></>} />
      {leads.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center", color: "#8B8982" }}>Поки що немає заявок. Заповніть форму на сайті, щоб побачити її тут.</div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          {leads.map((l, i) => (
            <div key={l.id} className="row" onClick={() => markRead(l.id)} style={{ padding: 20, borderTop: i > 0 ? "1px solid #232327" : "none", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 20, alignItems: "center", cursor: "pointer" }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: l.new ? "var(--accent)" : "#2E2E33" }} />
              <div>
                <div style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{l.name}</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#8B8982" }}>{l.contact}</span>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#5E5B54", marginLeft: "auto" }}>{new Date(l.ts).toLocaleString("uk-UA")}</span>
                </div>
                {l.msg && <div style={{ color: "#C4C1B9", fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>{l.msg}</div>}
              </div>
              <Btn kind="danger" small onClick={(e) => { e.stopPropagation(); del(l.id); }}>Del</Btn>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== CONTENT (hero + bio + name) ==========

function ContentTab({ data, update, lang, setLang, notify }) {
  const up = (mut) => update(d => { mut(d); return d; });
  return (
    <div>
      <PageHead title="Контент головної" sub="Ім'я, заголовок героя, підзаголовок, біо." actions={<LangSwitch lang={lang} setLang={setLang} />} />
      <div className="card" style={{ padding: 28 }}>
        <Input label="Ім'я (одне на всі мови)" value={data.name} onChange={(v) => up(d => { d.name = v; })} />
        <TriField label="Hero Title — основний заголовок (перенос рядків через Enter)" lang={lang} value={data.heroTitle} onChange={(v) => up(d => { d.heroTitle = v; })} textarea />
        <TriField label="Hero Subtitle — опис під заголовком" lang={lang} value={data.heroSub} onChange={(v) => up(d => { d.heroSub = v; })} textarea />
        <TriField label="Tagline — коротко про вас" lang={lang} value={data.tagline} onChange={(v) => up(d => { d.tagline = v; })} />
        <TriField label="Bio — для секції 'Про мене'" lang={lang} value={data.bio} onChange={(v) => up(d => { d.bio = v; })} textarea />
      </div>
    </div>
  );
}

// ========== PORTFOLIO ==========

function PortfolioTab({ data, update, lang, setLang, notify }) {
  const [edit, setEdit] = React.useState(null);
  const up = (mut) => update(d => { mut(d); return d; });
  const add = () => {
    const newP = { id: "p" + Date.now(), title: "Новий проект", cat: data.categories[1]?.id || "telegram", year: "2026", tag: { ua: "", en: "", ru: "" }, desc: { ua: "", en: "", ru: "" }, stack: "", metric: "" };
    up(d => { d.projects.push(newP); });
    setEdit(newP.id);
    notify("Додано");
  };
  const del = (id) => { if (!confirm("Видалити проект?")) return; up(d => { d.projects = d.projects.filter(p => p.id !== id); }); setEdit(null); notify("Видалено"); };
  const move = (id, dir) => up(d => { const i = d.projects.findIndex(p => p.id === id); const j = i + dir; if (j < 0 || j >= d.projects.length) return; [d.projects[i], d.projects[j]] = [d.projects[j], d.projects[i]]; });

  return (
    <div>
      <PageHead title="Портфоліо" sub={`${data.projects.length} проектів`} actions={<><LangSwitch lang={lang} setLang={setLang} /> <Btn onClick={add}>+ Додати</Btn></>} />
      <div className="card" style={{ overflow: "hidden" }}>
        {data.projects.map((p, i) => (
          <React.Fragment key={p.id}>
            <div className="row" style={{ padding: 16, borderTop: i > 0 ? "1px solid #232327" : "none", display: "grid", gridTemplateColumns: "40px 1fr 120px 80px auto", gap: 16, alignItems: "center" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#8B8982" }}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: "#8B8982", marginTop: 2 }}>{p.tag?.[lang] || p.tag?.ua}</div>
              </div>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B8982", background: "#0E0E10", padding: "3px 8px", borderRadius: 6, textAlign: "center" }}>{p.cat}</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--accent)" }}>{p.year}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small kind="ghost" onClick={() => move(p.id, -1)}>↑</Btn>
                <Btn small kind="ghost" onClick={() => move(p.id, 1)}>↓</Btn>
                <Btn small kind="ghost" onClick={() => setEdit(edit === p.id ? null : p.id)}>{edit === p.id ? "×" : "✎"}</Btn>
                <Btn small kind="danger" onClick={() => del(p.id)}>Del</Btn>
              </div>
            </div>
            {edit === p.id && (
              <div style={{ padding: 24, background: "#0E0E10", borderTop: "1px solid #232327", borderBottom: "1px solid #232327" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <Input label="Назва" value={p.title} onChange={(v) => up(d => { d.projects.find(x => x.id === p.id).title = v; })} />
                  <div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#8B8982", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>КАТЕГОРІЯ</div>
                    <select value={p.cat} onChange={(e) => up(d => { d.projects.find(x => x.id === p.id).cat = e.target.value; })} style={{ width: "100%", background: "#151517", border: "1px solid #232327", color: "#E8E6E1", padding: 11, fontSize: 14, borderRadius: 8 }}>
                      {data.categories.filter(c => c.id !== "all").map(c => <option key={c.id} value={c.id}>{c.label?.ua || c.id}</option>)}
                    </select>
                  </div>
                  <Input label="Рік" value={p.year} onChange={(v) => up(d => { d.projects.find(x => x.id === p.id).year = v; })} />
                  <Input label="Метрика" value={p.metric} onChange={(v) => up(d => { d.projects.find(x => x.id === p.id).metric = v; })} />
                </div>
                <Input label="Стек" value={p.stack} onChange={(v) => up(d => { d.projects.find(x => x.id === p.id).stack = v; })} />
                <TriField label="Тег (короткий опис)" lang={lang} value={p.tag} onChange={(v) => up(d => { d.projects.find(x => x.id === p.id).tag = v; })} />
                <TriField label="Опис" lang={lang} value={p.desc} onChange={(v) => up(d => { d.projects.find(x => x.id === p.id).desc = v; })} textarea />
                <ImageUpload value={p.image || ""} onChange={(url) => up(d => { d.projects.find(x => x.id === p.id).image = url; })} accent={data.accent} label="Обкладинка проекту" aspect="16/10" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ========== SERVICES ==========

function ServicesTab({ data, update, lang, setLang, notify }) {
  const [edit, setEdit] = React.useState(null);
  const up = (mut) => update(d => { mut(d); return d; });
  const add = () => { const n = { id: "s" + Date.now(), icon: "◆", title: { ua: "Нова послуга", en: "", ru: "" }, desc: { ua: "", en: "", ru: "" }, price: "від $100" }; up(d => { d.services.push(n); }); setEdit(n.id); notify("Додано"); };
  const del = (id) => { if (!confirm("Видалити?")) return; up(d => { d.services = d.services.filter(x => x.id !== id); }); notify("Видалено"); };
  const move = (id, dir) => up(d => { const i = d.services.findIndex(p => p.id === id); const j = i + dir; if (j < 0 || j >= d.services.length) return; [d.services[i], d.services[j]] = [d.services[j], d.services[i]]; });
  return (
    <div>
      <PageHead title="Послуги" sub={`${data.services.length} послуг`} actions={<><LangSwitch lang={lang} setLang={setLang} /> <Btn onClick={add}>+ Додати</Btn></>} />
      <div className="card" style={{ overflow: "hidden" }}>
        {data.services.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="row" style={{ padding: 16, borderTop: i > 0 ? "1px solid #232327" : "none", display: "grid", gridTemplateColumns: "40px 40px 1fr 120px auto", gap: 16, alignItems: "center" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#8B8982" }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontSize: 24, color: "var(--accent)", textAlign: "center" }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{s.title?.[lang] || s.title?.ua}</div>
                <div style={{ fontSize: 12, color: "#8B8982", marginTop: 2 }}>{s.desc?.[lang] || s.desc?.ua}</div>
              </div>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--accent)" }}>{s.price}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small kind="ghost" onClick={() => move(s.id, -1)}>↑</Btn>
                <Btn small kind="ghost" onClick={() => move(s.id, 1)}>↓</Btn>
                <Btn small kind="ghost" onClick={() => setEdit(edit === s.id ? null : s.id)}>{edit === s.id ? "×" : "✎"}</Btn>
                <Btn small kind="danger" onClick={() => del(s.id)}>Del</Btn>
              </div>
            </div>
            {edit === s.id && (
              <div style={{ padding: 24, background: "#0E0E10", borderTop: "1px solid #232327" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Іконка (символ — ◆ ▲ ● ■ ◈ ◉ ✳)" value={s.icon} onChange={(v) => up(d => { d.services.find(x => x.id === s.id).icon = v; })} />
                  <Input label="Ціна" value={s.price} onChange={(v) => up(d => { d.services.find(x => x.id === s.id).price = v; })} />
                </div>
                <TriField label="Назва" lang={lang} value={s.title} onChange={(v) => up(d => { d.services.find(x => x.id === s.id).title = v; })} />
                <TriField label="Опис" lang={lang} value={s.desc} onChange={(v) => up(d => { d.services.find(x => x.id === s.id).desc = v; })} textarea />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ========== CATEGORIES ==========

function CategoriesTab({ data, update, lang, setLang, notify }) {
  const up = (mut) => update(d => { mut(d); return d; });
  const add = () => { const id = "c" + Date.now(); up(d => { d.categories.push({ id, label: { ua: "Нова", en: "New", ru: "Новая" } }); }); notify("Додано"); };
  const del = (id) => { if (id === "all") { alert("Категорію 'Все' не можна видалити"); return; } if (!confirm("Видалити?")) return; up(d => { d.categories = d.categories.filter(x => x.id !== id); }); notify("Видалено"); };
  return (
    <div>
      <PageHead title="Категорії" sub="Категорії (фільтри) у секції портфоліо" actions={<><LangSwitch lang={lang} setLang={setLang} /> <Btn onClick={add}>+ Додати</Btn></>} />
      <div className="card" style={{ padding: 24 }}>
        {data.categories.map((c, i) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "150px 1fr auto", gap: 16, alignItems: "center", padding: "12px 0", borderTop: i > 0 ? "1px solid #232327" : "none" }}>
            <code style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--accent)", background: "#0E0E10", padding: "4px 10px", borderRadius: 6 }}>{c.id}</code>
            <input value={c.label?.[lang] || ""} onChange={(e) => up(d => { d.categories.find(x => x.id === c.id).label[lang] = e.target.value; })} style={{ background: "#0E0E10", border: "1px solid #232327", color: "#E8E6E1", padding: 10, fontSize: 14, borderRadius: 8 }} placeholder={`Назва (${lang.toUpperCase()})`} />
            <Btn small kind="danger" onClick={() => del(c.id)}>Del</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ========== PLANS ==========

function PlansTab({ data, update, lang, setLang, notify }) {
  const [edit, setEdit] = React.useState(null);
  const up = (mut) => update(d => { mut(d); return d; });
  const add = () => { const n = { id: "pl" + Date.now(), name: { ua: "Новий", en: "New", ru: "Новый" }, price: "$0", per: { ua: "разово", en: "once", ru: "разово" }, features: { ua: [], en: [], ru: [] }, featured: false }; up(d => { d.plans.push(n); }); setEdit(n.id); notify("Додано"); };
  const del = (id) => { if (!confirm("Видалити?")) return; up(d => { d.plans = d.plans.filter(x => x.id !== id); }); notify("Видалено"); };
  return (
    <div>
      <PageHead title="Тарифи" sub={`${data.plans.length} пакетів`} actions={<><LangSwitch lang={lang} setLang={setLang} /> <Btn onClick={add}>+ Додати</Btn></>} />
      <div className="card" style={{ overflow: "hidden" }}>
        {data.plans.map((p, i) => (
          <React.Fragment key={p.id}>
            <div className="row" style={{ padding: 16, borderTop: i > 0 ? "1px solid #232327" : "none", display: "grid", gridTemplateColumns: "1fr 120px 120px auto", gap: 16, alignItems: "center" }}>
              <div style={{ fontWeight: 500 }}>{p.name?.[lang] || p.name?.ua} {p.featured && <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "var(--accent)", marginLeft: 8, border: "1px solid var(--accent)", padding: "2px 6px", borderRadius: 4 }}>POPULAR</span>}</div>
              <span style={{ fontFamily: "Instrument Serif, serif", fontSize: 24, color: "var(--accent)" }}>{p.price}</span>
              <label style={{ fontSize: 12, color: "#8B8982", display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={p.featured} onChange={(e) => up(d => { d.plans.forEach(x => x.featured = false); d.plans.find(x => x.id === p.id).featured = e.target.checked; })} /> Featured
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small kind="ghost" onClick={() => setEdit(edit === p.id ? null : p.id)}>{edit === p.id ? "×" : "✎"}</Btn>
                <Btn small kind="danger" onClick={() => del(p.id)}>Del</Btn>
              </div>
            </div>
            {edit === p.id && (
              <div style={{ padding: 24, background: "#0E0E10", borderTop: "1px solid #232327" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="Ціна" value={p.price} onChange={(v) => up(d => { d.plans.find(x => x.id === p.id).price = v; })} />
                  <TriField label="Період" lang={lang} value={p.per} onChange={(v) => up(d => { d.plans.find(x => x.id === p.id).per = v; })} />
                </div>
                <TriField label="Назва" lang={lang} value={p.name} onChange={(v) => up(d => { d.plans.find(x => x.id === p.id).name = v; })} />
                <Input label={`Пункти (по одному на рядок) · ${lang.toUpperCase()}`} textarea rows={5} value={(p.features?.[lang] || []).join("\n")} onChange={(v) => up(d => { const pl = d.plans.find(x => x.id === p.id); pl.features = pl.features || {}; pl.features[lang] = v.split("\n").filter(Boolean); })} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ========== CALCULATOR ==========

function CalculatorTab({ data, update, notify }) {
  const up = (mut) => update(d => { mut(d); return d; });
  const calc = data.calculator || {};
  const types = calc.types || [];
  const features = calc.features || [];

  const setUahRate = (v) => {
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) up(d => { d.calculator.uahRate = n; });
  };

  const setTypeBase = (id, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    up(d => { const t = d.calculator.types.find(x => x.id === id); if (t) t.base = n; });
  };
  const setTypeDays = (id, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    up(d => { const t = d.calculator.types.find(x => x.id === id); if (t) t.days = n; });
  };
  const setTypeLabel = (id, val) => {
    up(d => { const t = d.calculator.types.find(x => x.id === id); if (t) t.label.ua = val; });
  };

  const setFeatPrice = (id, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    up(d => { const f = d.calculator.features.find(x => x.id === id); if (f) f.price = n; });
  };
  const setFeatDays = (id, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n)) return;
    up(d => { const f = d.calculator.features.find(x => x.id === id); if (f) f.days = n; });
  };
  const setFeatLabel = (id, val) => {
    up(d => { const f = d.calculator.features.find(x => x.id === id); if (f) f.label.ua = val; });
  };

  const numInput = (val, onChange) => (
    <input type="number" min="0" value={val} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: "#0E0E10", border: "1px solid #232327", color: "#E8E6E1", padding: "8px 10px", fontSize: 13, borderRadius: 8 }} />
  );
  const txtInput = (val, onChange) => (
    <input type="text" value={val} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: "#0E0E10", border: "1px solid #232327", color: "#E8E6E1", padding: "8px 10px", fontSize: 13, borderRadius: 8 }} />
  );

  return (
    <div>
      <PageHead title="Калькулятор вартості" sub="Ціни у секції «Порахуйте вартість самі»" />

      {/* UAH rate */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B8982", letterSpacing: "0.1em", marginBottom: 12 }}>КУРС ГРИВНІ</div>
        <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#8B8982", marginBottom: 6 }}>1 USD = ? UAH</div>
            {numInput(calc.uahRate || 40, setUahRate)}
          </div>
          <div style={{ fontSize: 12, color: "#5E5B54" }}>Використовується для конвертації в гривні в калькуляторі.</div>
        </div>
      </div>

      {/* Types */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 24 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #232327", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B8982", letterSpacing: "0.1em" }}>ТИП ПРОЕКТУ — БАЗОВІ ЦІНИ</div>
        <div style={{ display: "grid", gridTemplateColumns: "32px 1fr 120px 100px", gap: 0 }}>
          {["", "Назва", "Базова ціна ($)", "Терміни (дні)"].map((h, i) => (
            <div key={i} style={{ padding: "10px 16px", fontSize: 11, color: "#5E5B54", fontFamily: "JetBrains Mono, monospace", borderBottom: "1px solid #232327", background: "#0A0A0C" }}>{h}</div>
          ))}
          {types.map((t) => (
            <React.Fragment key={t.id}>
              <div style={{ padding: "12px 16px", fontSize: 18, borderBottom: "1px solid #1A1A1E", display: "grid", placeItems: "center", color: "var(--accent)" }}>{t.icon}</div>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1A1A1E" }}>{txtInput(t.label.ua, v => setTypeLabel(t.id, v))}</div>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1A1A1E" }}>{numInput(t.base, v => setTypeBase(t.id, v))}</div>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1A1A1E" }}>{numInput(t.days, v => setTypeDays(t.id, v))}</div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #232327", fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B8982", letterSpacing: "0.1em" }}>ДОДАТКОВО (ОПЦІЇ) — ЦІНИ</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px", gap: 0 }}>
          {["Назва", "Ціна (+$)", "Терміни (дні)"].map((h, i) => (
            <div key={i} style={{ padding: "10px 16px", fontSize: 11, color: "#5E5B54", fontFamily: "JetBrains Mono, monospace", borderBottom: "1px solid #232327", background: "#0A0A0C" }}>{h}</div>
          ))}
          {features.map((f) => (
            <React.Fragment key={f.id}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1A1A1E" }}>{txtInput(f.label.ua, v => setFeatLabel(f.id, v))}</div>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1A1A1E" }}>{numInput(f.price, v => setFeatPrice(f.id, v))}</div>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #1A1A1E" }}>{numInput(f.days, v => setFeatDays(f.id, v))}</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// ========== TESTIMONIALS ==========

function TestimonialsTab({ data, update, lang, setLang, notify }) {
  const [edit, setEdit] = React.useState(null);
  const up = (mut) => update(d => { mut(d); return d; });
  const add = () => { const n = { id: "t" + Date.now(), name: "Ім'я", role: { ua: "", en: "", ru: "" }, text: { ua: "", en: "", ru: "" } }; up(d => { d.testimonials.push(n); }); setEdit(n.id); };
  const del = (id) => { if (!confirm("Видалити?")) return; up(d => { d.testimonials = d.testimonials.filter(x => x.id !== id); }); notify("Видалено"); };
  return (
    <div>
      <PageHead title="Відгуки" sub={`${data.testimonials.length} відгуків`} actions={<><LangSwitch lang={lang} setLang={setLang} /> <Btn onClick={add}>+ Додати</Btn></>} />
      <div className="card" style={{ overflow: "hidden" }}>
        {data.testimonials.map((t, i) => (
          <React.Fragment key={t.id}>
            <div className="row" style={{ padding: 16, borderTop: i > 0 ? "1px solid #232327" : "none", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{t.name} <span style={{ color: "#8B8982", fontWeight: 400, fontSize: 13 }}>— {t.role?.[lang] || t.role?.ua}</span></div>
                <div style={{ fontSize: 13, color: "#C4C1B9", marginTop: 6, fontStyle: "italic" }}>"{(t.text?.[lang] || t.text?.ua || "").slice(0, 80)}..."</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small kind="ghost" onClick={() => setEdit(edit === t.id ? null : t.id)}>{edit === t.id ? "×" : "✎"}</Btn>
                <Btn small kind="danger" onClick={() => del(t.id)}>Del</Btn>
              </div>
            </div>
            {edit === t.id && (
              <div style={{ padding: 24, background: "#0E0E10", borderTop: "1px solid #232327" }}>
                <Input label="Ім'я (одне на всі мови)" value={t.name} onChange={(v) => up(d => { d.testimonials.find(x => x.id === t.id).name = v; })} />
                <TriField label="Роль" lang={lang} value={t.role} onChange={(v) => up(d => { d.testimonials.find(x => x.id === t.id).role = v; })} />
                <TriField label="Текст відгуку" lang={lang} value={t.text} onChange={(v) => up(d => { d.testimonials.find(x => x.id === t.id).text = v; })} textarea rows={4} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ========== FAQ ==========

function FaqTab({ data, update, lang, setLang, notify }) {
  const [edit, setEdit] = React.useState(null);
  const up = (mut) => update(d => { mut(d); return d; });
  const add = () => { const n = { id: "f" + Date.now(), q: { ua: "Нове питання?", en: "", ru: "" }, a: { ua: "", en: "", ru: "" } }; up(d => { d.faq.push(n); }); setEdit(n.id); };
  const del = (id) => { if (!confirm("Видалити?")) return; up(d => { d.faq = d.faq.filter(x => x.id !== id); }); notify("Видалено"); };
  return (
    <div>
      <PageHead title="FAQ" sub={`${data.faq.length} питань`} actions={<><LangSwitch lang={lang} setLang={setLang} /> <Btn onClick={add}>+ Додати</Btn></>} />
      <div className="card" style={{ overflow: "hidden" }}>
        {data.faq.map((f, i) => (
          <React.Fragment key={f.id}>
            <div className="row" style={{ padding: 16, borderTop: i > 0 ? "1px solid #232327" : "none", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{f.q?.[lang] || f.q?.ua}</div>
                <div style={{ fontSize: 13, color: "#8B8982", marginTop: 4, lineHeight: 1.4 }}>{(f.a?.[lang] || f.a?.ua || "").slice(0, 100)}...</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small kind="ghost" onClick={() => setEdit(edit === f.id ? null : f.id)}>{edit === f.id ? "×" : "✎"}</Btn>
                <Btn small kind="danger" onClick={() => del(f.id)}>Del</Btn>
              </div>
            </div>
            {edit === f.id && (
              <div style={{ padding: 24, background: "#0E0E10", borderTop: "1px solid #232327" }}>
                <TriField label="Питання" lang={lang} value={f.q} onChange={(v) => up(d => { d.faq.find(x => x.id === f.id).q = v; })} />
                <TriField label="Відповідь" lang={lang} value={f.a} onChange={(v) => up(d => { d.faq.find(x => x.id === f.id).a = v; })} textarea rows={4} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ========== BLOG ==========

function BlogTab({ data, update, lang, setLang, notify }) {
  const [edit, setEdit] = React.useState(null);
  const up = (mut) => update(d => { mut(d); return d; });
  const add = () => { const n = { id: "b" + Date.now(), title: { ua: "Нова стаття", en: "", ru: "" }, excerpt: { ua: "", en: "", ru: "" }, date: new Date().toLocaleDateString("uk-UA"), readMin: 5 }; up(d => { d.blog.unshift(n); }); setEdit(n.id); };
  const del = (id) => { if (!confirm("Видалити?")) return; up(d => { d.blog = d.blog.filter(x => x.id !== id); }); notify("Видалено"); };
  return (
    <div>
      <PageHead title="Блог" sub={`${data.blog.length} статей`} actions={<><LangSwitch lang={lang} setLang={setLang} /> <Btn onClick={add}>+ Додати</Btn></>} />
      <div className="card" style={{ overflow: "hidden" }}>
        {data.blog.map((b, i) => (
          <React.Fragment key={b.id}>
            <div className="row" style={{ padding: 16, borderTop: i > 0 ? "1px solid #232327" : "none", display: "grid", gridTemplateColumns: "1fr 140px auto", gap: 16, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{b.title?.[lang] || b.title?.ua}</div>
                <div style={{ fontSize: 13, color: "#8B8982", marginTop: 4 }}>{(b.excerpt?.[lang] || b.excerpt?.ua || "").slice(0, 90)}...</div>
              </div>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B8982" }}>{b.date} · {b.readMin} min</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn small kind="ghost" onClick={() => setEdit(edit === b.id ? null : b.id)}>{edit === b.id ? "×" : "✎"}</Btn>
                <Btn small kind="danger" onClick={() => del(b.id)}>Del</Btn>
              </div>
            </div>
            {edit === b.id && (
              <div style={{ padding: 24, background: "#0E0E10", borderTop: "1px solid #232327" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
                  <Input label="Дата" value={b.date} onChange={(v) => up(d => { d.blog.find(x => x.id === b.id).date = v; })} />
                  <Input label="Хв читання" value={String(b.readMin)} onChange={(v) => up(d => { d.blog.find(x => x.id === b.id).readMin = parseInt(v) || 1; })} />
                </div>
                <TriField label="Заголовок" lang={lang} value={b.title} onChange={(v) => up(d => { d.blog.find(x => x.id === b.id).title = v; })} />
                <TriField label="Превʼю (коротко, для картки)" lang={lang} value={b.excerpt} onChange={(v) => up(d => { d.blog.find(x => x.id === b.id).excerpt = v; })} textarea rows={3} />
                <TriField label="Повний текст статті (показується у модалці)" lang={lang} value={b.body} onChange={(v) => up(d => { d.blog.find(x => x.id === b.id).body = v; })} textarea rows={12} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ========== CONTACTS ==========

function ContactsTab({ data, update, lang, setLang, notify }) {
  const up = (mut) => update(d => { mut(d); return d; });
  return (
    <div>
      <PageHead title="Контакти" sub="Як з вами зв'язатись" actions={<LangSwitch lang={lang} setLang={setLang} />} />
      <div className="card" style={{ padding: 28 }}>
        <Input label="Email" value={data.contacts.email} onChange={(v) => up(d => { d.contacts.email = v; })} />
        <Input label="Telegram (з @ або без)" value={data.contacts.telegram} onChange={(v) => up(d => { d.contacts.telegram = v; })} />
        <Input label="WhatsApp / Phone" value={data.contacts.whatsapp} onChange={(v) => up(d => { d.contacts.whatsapp = v; })} />
        <TriField label="Локація" lang={lang} value={data.contacts.location} onChange={(v) => up(d => { d.contacts.location = v; })} />
      </div>
    </div>
  );
}

// ========== TELEGRAM ==========

function TelegramTab({ data, update, notify }) {
  const tg = data.telegram || { enabled: false, botToken: "", chatId: "" };
  const [testing, setTesting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [result, setResult] = React.useState(tg.lastTest || null);
  const [botInfo, setBotInfo] = React.useState(null);   // { ok, name, username } | { ok:false, err }
  const [checkingBot, setCheckingBot] = React.useState(false);
  const [gettingId, setGettingId] = React.useState(false);
  const [idHint, setIdHint] = React.useState(null);
  const up = (mut) => update(d => { if (!d.telegram) d.telegram = { enabled: false, botToken: "", chatId: "" }; mut(d); return d; });

  const saveSettings = async () => {
    setSaving(true);
    try {
      await window.PortfolioDB.saveContent(data);
      notify("Налаштування Telegram збережено в БД ✓");
    } catch (e) {
      notify("Помилка збереження: " + (e.message || "невідома"));
    }
    setSaving(false);
  };

  // Step 1: validate token via getMe
  const checkBot = async () => {
    if (!tg.botToken) return;
    setCheckingBot(true); setBotInfo(null);
    try {
      const r = await fetch(`https://api.telegram.org/bot${tg.botToken}/getMe`);
      const j = await r.json();
      if (j.ok) {
        setBotInfo({ ok: true, name: j.result.first_name, username: j.result.username });
      } else {
        setBotInfo({ ok: false, err: j.description || "Невірний токен" });
      }
    } catch (e) {
      setBotInfo({ ok: false, err: e.message });
    }
    setCheckingBot(false);
  };

  // Step 2: get Chat ID from getUpdates (user must send /start to bot first)
  const fetchChatId = async () => {
    if (!tg.botToken) return;
    setGettingId(true); setIdHint(null);
    try {
      const r = await fetch(`https://api.telegram.org/bot${tg.botToken}/getUpdates?limit=10&timeout=0`);
      const j = await r.json();
      if (!j.ok) { setIdHint({ err: j.description || "Помилка" }); setGettingId(false); return; }
      const updates = j.result || [];
      if (updates.length === 0) {
        setIdHint({ err: "Немає повідомлень. Спочатку відкрийте свого бота в Telegram і натисніть /start, потім натисніть кнопку знову." });
        setGettingId(false); return;
      }
      const last = updates[updates.length - 1];
      const chat = last.message?.chat || last.my_chat_member?.chat;
      if (!chat) { setIdHint({ err: "Не вдалось знайти chat у відповіді. Напишіть /start боту і спробуйте ще раз." }); setGettingId(false); return; }
      const id = String(chat.id);
      up(d => { d.telegram.chatId = id; });
      setIdHint({ id, name: chat.first_name || chat.title || chat.username || "" });
    } catch (e) {
      setIdHint({ err: e.message });
    }
    setGettingId(false);
  };

  const test = async () => {
    setTesting(true); setResult(null);
    const r = await sendToTelegram(
      { name: "Тест", contact: "admin panel", msg: "Це тестове повідомлення з адмінки вашого портфоліо. Якщо ви це бачите — все працює! ✓", ts: Date.now() },
      tg
    );
    setResult(r);
    up(d => { d.telegram.lastTest = { ...r, ts: Date.now() }; });
    setTesting(false);
    notify(r.ok ? "Повідомлення відправлено!" : "Помилка: " + r.msg);
  };

  const errorHint = (msg) => {
    if (!msg) return null;
    if (msg.includes("chat not found"))
      return "Бот не знає цього чату. Відкрийте свого бота в Telegram і натисніть /start — це обов'язково перед першим повідомленням. Потім скористайтесь кнопкою «Отримати Chat ID автоматично».";
    if (msg.includes("bot was blocked"))
      return "Ви заблокували бота. Відкрийте чат з ботом і натисніть Unblock / Розблокувати.";
    if (msg.includes("Unauthorized") || msg.includes("401"))
      return "Невірний Bot Token. Перевірте у @BotFather.";
    if (msg.includes("not configured"))
      return "Увімкніть бота (перемикач угорі) та заповніть Token і Chat ID.";
    return null;
  };

  const mono = { fontFamily: "JetBrains Mono, monospace" };

  return (
    <div>
      <PageHead title="Telegram-бот" sub="Підключіть свого бота — всі заявки з форми будуть приходити вам в Telegram." />

      {/* STEP 1 — TOKEN */}
      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ ...mono, fontSize: 10, color: "#5E5B54", letterSpacing: "0.15em", marginBottom: 16 }}>КРОК 1 — BOT TOKEN</div>
        <div style={{ color: "#C4C1B9", fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
          Відкрийте <a href="https://t.me/BotFather" target="_blank" style={{ color: "var(--accent)" }}>@BotFather</a> → <code style={{ background: "#0E0E10", padding: "2px 6px", borderRadius: 4, ...mono, fontSize: 12 }}>/newbot</code> → дайте ім'я → отримайте токен.
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input label="Bot Token" value={tg.botToken} onChange={(v) => { up(d => { d.telegram.botToken = v.trim(); }); setBotInfo(null); }} placeholder="1234567890:AAHxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <button className="btn" onClick={checkBot} disabled={checkingBot || !tg.botToken} style={{ padding: "12px 16px", background: "#232327", color: "#E8E6E1", border: "1px solid #3A3A3E", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginBottom: 14, opacity: !tg.botToken ? 0.4 : 1 }}>
            {checkingBot ? "Перевіряю..." : "✓ Перевірити токен"}
          </button>
        </div>
        {botInfo && (
          <div style={{ padding: 12, borderRadius: 8, background: "#0E0E10", border: `1px solid ${botInfo.ok ? "#5CBF7F44" : "#E87C5A44"}`, fontSize: 13, color: botInfo.ok ? "#5CBF7F" : "#E87C5A" }}>
            {botInfo.ok ? `✓ Бот знайдений: ${botInfo.name} (@${botInfo.username})` : `✗ ${botInfo.err}`}
          </div>
        )}
      </div>

      {/* STEP 2 — CHAT ID */}
      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ ...mono, fontSize: 10, color: "#5E5B54", letterSpacing: "0.15em", marginBottom: 16 }}>КРОК 2 — CHAT ID</div>
        <div style={{ color: "#C4C1B9", fontSize: 13, marginBottom: 14, lineHeight: 1.6 }}>
          Відкрийте свого бота в Telegram і натисніть <b>Start</b> (або напишіть <code style={{ background: "#0E0E10", padding: "2px 6px", borderRadius: 4, ...mono, fontSize: 12 }}>/start</code>). Потім натисніть кнопку нижче — Chat ID підставиться автоматично.
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input label="Chat ID" value={tg.chatId} onChange={(v) => up(d => { d.telegram.chatId = v.trim(); })} placeholder="123456789" />
          </div>
          <button className="btn" onClick={fetchChatId} disabled={gettingId || !tg.botToken} style={{ padding: "12px 16px", background: "var(--accent)", color: "#0E0E10", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginBottom: 14, opacity: !tg.botToken ? 0.4 : 1 }}>
            {gettingId ? "Шукаю..." : "⚡ Отримати Chat ID"}
          </button>
        </div>
        {idHint && (
          <div style={{ padding: 12, borderRadius: 8, background: "#0E0E10", border: `1px solid ${idHint.err ? "#E87C5A44" : "#5CBF7F44"}`, fontSize: 13, color: idHint.err ? "#E87C5A" : "#5CBF7F", lineHeight: 1.5 }}>
            {idHint.err ? `✗ ${idHint.err}` : `✓ Chat ID: ${idHint.id}${idHint.name ? ` (${idHint.name})` : ""} — підставлено автоматично`}
          </div>
        )}
      </div>

      {/* STEP 3 — TEST */}
      <div className="card" style={{ padding: 28, marginBottom: 16 }}>
        <div style={{ ...mono, fontSize: 10, color: "#5E5B54", letterSpacing: "0.15em", marginBottom: 16 }}>КРОК 3 — ТЕСТ І ЗБЕРЕЖЕННЯ</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ color: "#8B8982", fontSize: 13 }}>
            {tg.enabled && tg.botToken && tg.chatId
              ? <span style={{ color: "#5CBF7F" }}>● Активно — заявки надсилаються у Telegram</span>
              : <span>○ Не активно</span>}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
            <input type="checkbox" checked={!!tg.enabled} onChange={e => up(d => { d.telegram.enabled = e.target.checked; })} style={{ width: 16, height: 16, accentColor: "var(--accent)" }} />
            <span>{tg.enabled ? "Увімкнено" : "Вимкнено"}</span>
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn" onClick={saveSettings} disabled={saving} style={{ padding: "10px 18px", background: "#232327", color: "#E8E6E1", border: "1px solid #3A3A3E", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Зберігаю..." : "💾 Зберегти в БД"}
          </button>
          <button className="btn" onClick={test} disabled={testing || !tg.botToken || !tg.chatId} style={{ padding: "10px 18px", background: "var(--accent)", color: "#0E0E10", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (!tg.botToken || !tg.chatId || testing) ? 0.5 : 1 }}>
            {testing ? "Відправляю..." : "→ Тестове повідомлення"}
          </button>
          {result && (
            <span style={{ fontSize: 13, color: result.ok ? "#5CBF7F" : "#E87C5A", ...mono }}>
              {result.ok ? "✓ відправлено" : "✗ " + result.msg}
            </span>
          )}
        </div>
        {result && !result.ok && errorHint(result.msg) && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#0E0E10", border: "1px solid #E87C5A44", fontSize: 13, color: "#C4C1B9", lineHeight: 1.6 }}>
            💡 {errorHint(result.msg)}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== THEME ==========

function ThemeTab({ data, update, notify }) {
  const up = (mut) => update(d => { mut(d); return d; });
  const presets = [
    { name: "Amber (за замовч.)", c: "#E89B3C" },
    { name: "Blue", c: "#4B7CF0" },
    { name: "Green", c: "#5CBF7F" },
    { name: "Violet", c: "#9B6BE8" },
    { name: "Pink", c: "#E86BA0" },
    { name: "Red", c: "#E25C5C" },
    { name: "Cyan", c: "#4BC4D8" },
    { name: "Lime", c: "#A8D840" },
  ];
  return (
    <div>
      <PageHead title="Тема сайту" sub="Акцентний колір використовується на обох варіантах сайту" />
      <div className="card" style={{ padding: 28 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#8B8982", marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>ПРЕСЕТИ</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {presets.map((p) => (
            <button key={p.c} onClick={() => { up(d => { d.accent = p.c; }); notify("Колір змінено"); }} style={{ padding: 16, background: "#0E0E10", border: data.accent === p.c ? `2px solid ${p.c}` : "1px solid #232327", borderRadius: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit", color: "#E8E6E1" }}>
              <div style={{ width: "100%", height: 40, background: p.c, borderRadius: 6, marginBottom: 10 }} />
              <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B8982", marginTop: 2 }}>{p.c}</div>
            </button>
          ))}
        </div>
        <div style={{ borderTop: "1px solid #232327", paddingTop: 20 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#8B8982", marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>ВЛАСНИЙ КОЛІР</div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input type="color" value={data.accent} onChange={(e) => up(d => { d.accent = e.target.value; })} style={{ width: 60, height: 40, border: "1px solid #232327", borderRadius: 8, background: "#0E0E10", cursor: "pointer" }} />
            <input value={data.accent} onChange={(e) => up(d => { d.accent = e.target.value; })} style={{ flex: 1, background: "#0E0E10", border: "1px solid #232327", color: "#E8E6E1", padding: 12, fontSize: 14, borderRadius: 8, fontFamily: "JetBrains Mono, monospace" }} />
          </div>
        </div>
        <div style={{ borderTop: "1px solid #232327", paddingTop: 20, marginTop: 24 }}>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#8B8982", marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>ПАРОЛЬ АДМІНКИ</div>
          <div style={{ fontSize: 12, color: "#5E5B54", lineHeight: 1.6 }}>Пароль зберігається на сервері (Vercel → Environment Variables → <code style={{ background: "#0E0E10", padding: "2px 6px", borderRadius: 4 }}>EDIT_PASSWORD</code>). Щоб змінити — онови змінну в Vercel і передеплой.</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AdminApp });
