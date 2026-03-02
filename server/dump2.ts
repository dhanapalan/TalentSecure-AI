import { pool } from "./src/config/database.js";

async function run() {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'colleges'");
    console.log(res.rows);
    process.exit(0);
}

run().catch(console.error);
