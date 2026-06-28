import { getPool } from "./_db.js";
import crypto from "crypto";

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Validates the admin password (server-side only) and returns the protected
// fields the admin needs to manage (telegram config). The password lives in the
// EDIT_PASSWORD env var and is never sent to the public browser.
export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const allowed = ["https://saitvizitka-v2.vercel.app", "http://localhost:3000", "http://localhost:5173"];
  if (allowed.includes(origin)) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const PASS = process.env.EDIT_PASSWORD || "Bogdan93";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body || !safeEqual(body.password, PASS)) return res.status(401).json({ ok: false });

    let telegram = null;
    let leads = null;
    try {
      let pool;
      try {
        pool = getPool();
        const r = await pool.query(`SELECT data FROM site_content WHERE id = 'main' LIMIT 1`);
        telegram = r.rows[0]?.data?.telegram || null;
        leads = r.rows[0]?.data?.leads || null;
      } finally {
        if (pool) await pool.end();
      }
    } catch (dbErr) {
      // DB unavailable — auth still succeeds, protected fields just won't be pre-filled
    }
    return res.status(200).json({ ok: true, telegram, leads });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
