import { query } from './src/config/database.js';

async function check() {
    try {
        const rows = await query('SELECT id, status FROM assessment_drives LIMIT 5');
        console.log("Drives:");
        console.dir(rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
