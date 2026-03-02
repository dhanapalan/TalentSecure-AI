const { Client } = require('pg');
const client = new Client({ user: 'talentsecure', host: '127.0.0.1', database: 'talentsecure_db', password: 'secret', port: 5432 });

async function main() {
    await client.connect();
    try {
        const id = 'c13dfaf3-e253-4312-9ae2-ad6e3d74c440';

        console.log("Testing students query...");
        const students = await client.query(`SELECT student_id FROM drive_students WHERE drive_id = $1`, [id]);
        console.log("Students:", students.rows);

        console.log("Testing admins query...");
        const admins = await client.query(`
            SELECT u.id 
            FROM users u
            JOIN drive_assignments da ON u.college_id = da.college_id
            WHERE da.drive_id = $1 AND u.role IN ('college_admin', 'college_staff', 'college')
        `, [id]);
        console.log("Admins:", admins.rows);

    } catch (err) {
        console.error("Error:", err);
    }
    await client.end();
}
main();
