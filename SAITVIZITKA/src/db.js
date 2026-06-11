// PortfolioDB — saves/loads via Vercel API functions (/api/save, /api/load, /api/lead)
// The Supabase secret key lives only on the server (Vercel env vars), never in the browser.

(function () {
  const isRemote = typeof window !== "undefined" && window.location.hostname !== "localhost" ||
    (typeof window !== "undefined" && window.PORTFOLIO_CONFIG && window.PORTFOLIO_CONFIG.SUPABASE_URL);

  const api = {
    mode: "remote",

    async loadContent(defaults) {
      try {
        const r = await fetch("/api/load");
        if (!r.ok) throw new Error("load failed: " + r.status);
        const j = await r.json();
        if (!j.data) return defaults;
        return { ...defaults, ...j.data };
      } catch (e) {
        console.warn("[PortfolioDB] loadContent failed:", e.message);
        return defaults;
      }
    },

    async saveContent(data) {
      const pass = (typeof sessionStorage !== "undefined" && sessionStorage.getItem("pf_admin_pass")) || "";
      const r = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-edit-password": pass },
        body: JSON.stringify({ data }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (r.status === 401) throw new Error("Немає прав на збереження — увійдіть в адмінку");
        throw new Error(j.error || "Помилка збереження (" + r.status + ")");
      }
    },

    async verifyPassword(password) {
      try {
        const r = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (!r.ok) return { ok: false };
        return await r.json();
      } catch (e) {
        return { ok: false, error: e.message };
      }
    },

    async insertLead(lead) {
      try {
        const r = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "lead insert failed");
        return j.lead || lead;
      } catch (e) {
        console.warn("[PortfolioDB] insertLead failed:", e.message);
        return lead;
      }
    },

    async logVisit(variant) {
      // silently skip — visits stored in localStorage only
    },

    async uploadImage(file) {
      // Base64 fallback — works without Supabase Storage
      return await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = () => rej(new Error("read failed"));
        r.readAsDataURL(file);
      });
    },
  };

  window.PortfolioDB = api;
  console.info("[PortfolioDB] mode=remote (via /api/)");
})();
