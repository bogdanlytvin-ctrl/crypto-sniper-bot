import pg from "pg";
const { Pool } = pg;

export function getPool() {
  const connStr =
    process.env.saitvizitka_kv_url_POSTGRES_URL_NON_POOLING ||
    process.env.saitvizitka_kv_url_POSTGRES_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!connStr) throw new Error("No POSTGRES_URL env var found");

  // Strip sslmode from URL and handle via config
  const cleanUrl = connStr.replace(/[?&]sslmode=[^&]*/g, "");

  return new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });
}
