import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
    host: "localhost",
    port: 5433,
    user: "talentsecure",
    password: "secret",
    database: "talentsecure_db",
});

async function enableRLS() {
    try {
        console.log("---- Fetching tables without RLS ----");
        const rlsResult = await pool.query(`
            SELECT c.relname as table_name
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE n.nspname = 'public' 
              AND c.relkind = 'r'
              AND c.relrowsecurity = false;
        `);
        
        const tables = rlsResult.rows.map(r => r.table_name);
        console.log("Found tables:", tables.join(", "));
        
        for (const table of tables) {
            console.log(`Enabling RLS on ${table}...`);
            await pool.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        }
        
        console.log("✓ Successfully enabled RLS on all tables.");
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

enableRLS();
