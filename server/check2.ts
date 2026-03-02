import { query } from "./src/config/database.js";

async function run() {
    try {
        const r = await query('SELECT id, name, status FROM assessment_drives');
        console.log('drives:', r);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
