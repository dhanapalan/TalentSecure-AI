import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
    user: 'talentsecure',
    host: 'localhost',
    database: 'talentsecure_db',
    password: 'secret',
    port: 5432,
});
async function run() {
    const res = await pool.query('SELECT * FROM colleges LIMIT 1');
    console.log(JSON.stringify(res.rows[0], null, 2));
    pool.end();
}
run();
