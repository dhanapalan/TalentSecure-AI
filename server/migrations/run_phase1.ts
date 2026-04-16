// Run: npx ts-node migrations/run_phase1.ts
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pool } from "../src/config/database.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const sql = readFileSync(join(__dirname, "phase1_lms_practice_development.sql"), "utf8");
  const client = await pool.connect();
  try {
    console.log("Running Phase 1 migration...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✓ Phase 1 migration applied successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("✗ Migration failed — rolled back:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
