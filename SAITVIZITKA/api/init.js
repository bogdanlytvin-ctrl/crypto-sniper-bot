import { getPool } from "./_db.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  if (req.headers["x-init-secret"] !== process.env.EDIT_PASSWORD) return res.status(401).end();
  const pool = getPool();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id TEXT PRIMARY KEY,
        data JSONB,
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        contact TEXT,
        msg TEXT,
        ts BIGINT,
        new BOOLEAN DEFAULT true,
        source TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
    return res.status(200).json({ ok: true, message: "Tables created successfully" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  } finally {
    await pool.end();
  }
}
