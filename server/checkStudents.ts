import { query } from './src/config/database.js';

async function check() {
    try {
        const rows = await query(`
            SELECT sd.user_id, u.name, sd.cgpa, sd.specialization, c.name as college_name, u.college_id
            FROM student_details sd
            JOIN users u ON u.id = sd.user_id
            LEFT JOIN colleges c ON c.id = u.college_id
            WHERE sd.cgpa < 7.5
            LIMIT 5
        `);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}

check();
