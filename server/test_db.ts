import { getStudentDrives } from "./src/services/examSession.service.js";
import { query } from "./src/config/database.js";

async function testApi() {
    try {
        // Pick a student from the published drive
        const students = await query(`
            SELECT ds.student_id 
            FROM drive_students ds 
            WHERE drive_id = 'c13dfaf3-e253-4312-9ae2-ad6e3d74c440' 
            LIMIT 1
        `);
        const studentId = students[0].student_id;
        console.log("Testing with student id:", studentId);

        const drives = await getStudentDrives(studentId);
        console.log("Returned drives for student:", drives.length);
        if (drives.length > 0) {
            console.log("First drive status:", drives[0].drive_status);
            console.log("First drive session status:", drives[0].session_status);
        } else {
            console.log("NO DRIVES RETURNED.");
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testApi();
