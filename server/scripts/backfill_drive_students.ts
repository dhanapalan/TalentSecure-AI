import { query } from "../src/config/database.js";

async function run() {
    console.log("Starting backfill for drive_students...");
    const sql = `
        INSERT INTO drive_students (drive_id, student_id, status)
        SELECT da.drive_id, u.id, 'registered'
        FROM drive_assignments da
        JOIN users u ON u.role = 'student'
        JOIN student_details sd ON u.id = sd.user_id AND COALESCE(u.college_id, sd.college_id) = da.college_id
        WHERE (da.segment IS NULL OR sd.specialization ILIKE '%' || da.segment || '%')
          AND NOT EXISTS (
              SELECT 1 FROM drive_students ds WHERE ds.drive_id = da.drive_id AND ds.student_id = u.id
          )
    `;
    const res = await query(sql);
    console.log(`Backfill complete. Inserted ${res.rowCount} records.`);
    process.exit(0);
}

run().catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
});
