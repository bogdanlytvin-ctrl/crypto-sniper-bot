import { getPool } from "./_db.js";
import crypto from "crypto";

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-edit-password");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const PASS = process.env.EDIT_PASSWORD || "Bogdan93";
  if (!safeEqual(req.headers["x-edit-password"], PASS)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  let pool;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    pool = getPool();
    await pool.query(
      `INSERT INTO site_content (id, data, updated_at)
       VALUES ('main', $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = now()`,
      [JSON.stringify(body.data)]
    );
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  } finally {
    if (pool) await pool.end();
  }
}
