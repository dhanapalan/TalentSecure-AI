import { query } from './src/config/database.js';

async function check() {
    try {
        const rows = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'drive_students'
        `);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

check();
