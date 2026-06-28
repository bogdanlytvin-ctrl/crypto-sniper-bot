import { getPool } from "./_db.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  let pool;
  try {
    pool = getPool();
    const result = await pool.query(
      `SELECT data FROM site_content WHERE id = 'main' LIMIT 1`
    );
    const raw = result.rows[0]?.data || null;
    // Never expose server-side secrets to the public site.
    if (raw && typeof raw === "object") {
      const { telegram, adminPassHash, ...safe } = raw;
      return res.status(200).json({ data: safe });
    }
    return res.status(200).json({ data: raw });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  } finally {
    if (pool) await pool.end();
  }
}
