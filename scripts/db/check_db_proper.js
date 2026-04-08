import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
    host: "localhost",
    port: 5433,
    user: "talentsecure",
    password: "secret",
    database: "talentsecure_db",
});

async function checkDB() {
    try {
        console.log("---- TABLES WITHOUT RLS ----");
        const rlsResult = await pool.query(`
            SELECT c.relname as table_name
            FROM pg_class c 
            JOIN pg_namespace n ON n.oid = c.relnamespace 
            WHERE n.nspname = 'public' 
              AND c.relkind = 'r'
              AND c.relrowsecurity = false;
        `);
        console.log(rlsResult.rows.map(r => r.table_name).join(", "));
        
        console.log("\n---- ALL TABLES IN DB ----");
        const tables = await pool.query(`
            SELECT tablename FROM pg_tables WHERE schemaname='public';
        `);
        console.log(tables.rows.map(r => r.tablename).join(", "));
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        await pool.end();
    }
}

checkDB();
