const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'talentsecure_db',
    password: 'admin',
    port: 5432,
});

async function checkStudentDrives() {
    try {
        const res = await pool.query(`
            SELECT ds.student_id, ds.drive_id, ds.status as session_status, ad.status as drive_status, ad.name
            FROM drive_students ds
            JOIN assessment_drives ad ON ad.id = ds.drive_id
            WHERE ad.status = 'PUBLISHED'
        `);
        console.log("Published drives in drive_students:", res.rows);

        const countRes = await pool.query(`
            SELECT count(*) from drive_students WHERE drive_id = 'c13dfaf3-e253-4312-9ae2-ad6e3d74c440'
        `);
        console.log("Students in test drive c13dfaf3-e253-4312-9ae2-ad6e3d74c440:", countRes.rows[0].count);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkStudentDrives();
