import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
    host: "localhost",
    port: 5432,
    user: "talentsecure",
    password: "secret",
    database: "talentsecure_db",
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Adding is_active column to colleges table...");
        await client.query("ALTER TABLE colleges ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;");
        console.log("✓ Migration successful");
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
