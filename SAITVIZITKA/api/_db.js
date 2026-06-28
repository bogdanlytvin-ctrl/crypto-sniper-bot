import pg from "pg";
const { Pool } = pg;

export function getPool() {
  const connStr =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL;

  if (!connStr) throw new Error("No POSTGRES_URL env var found");

  const cleanUrl = connStr
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/[?&]channel_binding=[^&]*/g, "")
    .replace(/\?$/, "");

  return new Pool({
    connectionString: cleanUrl,
    ssl: { rejectUnauthorized: false },
    max: 1,
    connectionTimeoutMillis: 10000,
  });
}
