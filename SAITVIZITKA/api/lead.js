import { getPool } from "./_db.js";

// Sends a Telegram notification using the server-side token (env var preferred,
// falls back to the stored config which is never exposed to the public site).
// Plain text only — user-provided fields must never be interpreted as markup.
async function notifyTelegram(lead, tg) {
  const token = process.env.TELEGRAM_BOT_TOKEN || tg?.botToken;
  const chatId = process.env.TELEGRAM_CHAT_ID || tg?.chatId;
  const enabled = process.env.TELEGRAM_BOT_TOKEN ? true : !!tg?.enabled;
  if (!enabled || !token || !chatId) return { ok: false, msg: "not configured" };
  const text = [
    "🔔 Нова заявка з сайту",
    "",
    `👤 Ім'я: ${lead.name}`,
    `📞 Контакт: ${lead.contact}`,
    lead.msg ? `💬 Повідомлення:\n${lead.msg}` : "",
    "",
    `🕒 ${new Date(lead.ts).toLocaleString("uk-UA")}`,
  ].filter(Boolean).join("\n");
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    const j = await r.json();
    return j.ok ? { ok: true, msg: "sent" } : { ok: false, msg: j.description || "telegram error" };
  } catch (e) {
    return { ok: false, msg: e.message };
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  let pool;
  try {
    pool = getPool();
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const name = String(body.name || "").slice(0, 200).trim();
    const contact = String(body.contact || "").slice(0, 200).trim();
    const msg = String(body.msg || "").slice(0, 2000).trim();
    if (!name || !contact) return res.status(400).json({ error: "name and contact required" });
    const ts = Date.now();
    const lead = { id: "l" + ts, name, contact, msg, ts, new: true, source: "site" };

    // Telegram via server env (no DB read needed); fall back to stored config only
    // if the env token is absent.
    let tg = null;
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      const r = await pool.query(`SELECT data->'telegram' AS tg FROM site_content WHERE id = 'main' LIMIT 1`);
      tg = r.rows[0]?.tg || null;
    }
    const deliv = await notifyTelegram(lead, tg);
    lead.delivery = { ok: deliv.ok, msg: deliv.msg, ts: Date.now() };

    // Atomic append — avoids the read-modify-write race that drops concurrent leads.
    await pool.query(
      `INSERT INTO site_content (id, data, updated_at)
       VALUES ('main', jsonb_build_object('leads', jsonb_build_array($1::jsonb)), now())
       ON CONFLICT (id) DO UPDATE
       SET data = jsonb_set(
             COALESCE(site_content.data, '{}'::jsonb),
             '{leads}',
             COALESCE(site_content.data->'leads', '[]'::jsonb) || $1::jsonb,
             true
           ),
           updated_at = now()`,
      [JSON.stringify(lead)]
    );
    return res.status(200).json({ ok: true, lead });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  } finally {
    if (pool) await pool.end();
  }
}
