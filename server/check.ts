import { query } from "./src/config/database.js";

async function run() {
    try {
        const driveId = "caf440ad-fe1a-4a08-9971-c38a06ba2c82";
        const r = await query(
            `SELECT ds.*,
            u.name as first_name, '' as last_name, u.email, sd.student_identifier as roll_number
         FROM drive_students ds
         LEFT JOIN users u ON u.id = ds.student_id
         LEFT JOIN student_details sd ON sd.user_id = ds.student_id
         WHERE ds.drive_id = $1
         ORDER BY u.name LIMIT 5`,
            [driveId],
        );
        console.log("students count:", r.length);
        console.log("first student:", r[0]);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
run();
