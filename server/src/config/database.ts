import pg from "pg";
import { env } from "./env.js";
import { logger } from "./logger.js";

const { Pool } = pg;

export const pool = new Pool({
  host: env.PG_HOST,
  port: env.PG_PORT,
  user: env.PG_USER,
  password: env.PG_PASSWORD,
  database: env.PG_DATABASE,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (err) => {
  logger.error("Unexpected PostgreSQL pool error:", err);
});

/**
 * Test the database connection.
 */
export async function connectDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
    logger.info("✓ PostgreSQL connected");
  } finally {
    client.release();
  }
}

/**
 * Run a parameterized query and return all rows.
 */
export async function query<T = any>(
  text: string,
  params?: any[],
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Run a parameterized query and return the first row (or null).
 */
export async function queryOne<T = any>(
  text: string,
  params?: any[],
): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] as T) ?? null;
}
