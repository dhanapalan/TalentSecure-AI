import { createDrive, addDriveStudent, updateDrive, listDrives } from "./src/services/drive.service.js";
import { queryOne, pool } from "./src/config/database.js";
import { AppError } from "./src/middleware/errorHandler.js";

async function runTests() {
    try {
        console.log("🚀 Starting Drive Enforcement Tests...");

        // Get an active rule for drive creation
        const rule = await queryOne('SELECT id FROM assessment_rule_templates WHERE status = $1 LIMIT 1', ['active']);
        if (!rule) {
            console.error("❌ No active rule found for testing. Please seed rules first.");
            return;
        }

        const student = await queryOne('SELECT id FROM users WHERE role = $1 LIMIT 1', ['student']);
        if (!student) {
            console.error("❌ No student found for testing. Please seed students first.");
            return;
        }

        // --- TEST 1: Max Applicant Enforcement (DR-04) ---
        console.log("\n🧪 Test 1: Max Applicant Enforcement");
        const drive1 = await createDrive({
            name: "Test Limit Drive",
            rule_id: rule.id,
            max_applicants: 1, // Limit to 1 student
        });
        if (!drive1) throw new Error("Drive 1 creation failed");
        console.log(`✅ Drive created: ${drive1.id} (Status: ${(drive1 as any).status}, Limit: 1)`);

        console.log("Adding first student...");
        await addDriveStudent(drive1.id, student.id);
        console.log("✅ First student added successfully.");

        console.log("Adding second student (should fail)...");
        try {
            // Find another student
            const student2 = await queryOne('SELECT id FROM users WHERE role = $1 AND id != $2 LIMIT 1', ['student', student.id]);
            if (student2) {
                await addDriveStudent(drive1.id, student2.id);
                console.error("❌ ERROR: Second student was added despite limit!");
            } else {
                console.log("⚠️ Only one student in DB, skipping second add attempt.");
            }
        } catch (error: any) {
            if (error.statusCode === 409) {
                console.log("✅ SUCCESS: Caught expected 409 error:", error.message);
            } else {
                console.error("❌ Unexpected error:", error);
            }
        }

        // --- TEST 2: Registration Window Validation (DR-03) ---
        console.log("\n🧪 Test 2: Registration Window Validation (Future Start)");
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const drive2 = await createDrive({
            name: "Test Future Drive",
            rule_id: rule.id,
            scheduled_start: futureDate,
        });
        if (!drive2) throw new Error("Drive 2 creation failed");
        console.log(`✅ Drive created: ${drive2.id} (Starts in future: ${futureDate.toLocaleString()})`);

        console.log("Attempting to add student to future drive...");
        try {
            await addDriveStudent(drive2.id, student.id);
            console.error("❌ ERROR: Student was added to a future drive!");
        } catch (error: any) {
            if (error.statusCode === 403) {
                console.log("✅ SUCCESS: Caught expected 403 error:", error.message);
            } else {
                console.error("❌ Unexpected error:", error);
            }
        }

        console.log("\n🧪 Test 3: Registration Window Validation (Past End)");
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);

        const drive3 = await createDrive({
            name: "Test Past Drive",
            rule_id: rule.id,
            scheduled_end: pastDate,
        });
        if (!drive3) throw new Error("Drive 3 creation failed");
        console.log(`✅ Drive created: ${drive3.id} (Ended in past: ${pastDate.toLocaleString()})`);

        console.log("Attempting to add student to past drive...");
        try {
            await addDriveStudent(drive3.id, student.id);
            console.error("❌ ERROR: Student was added to a past drive!");
        } catch (error: any) {
            if (error.statusCode === 403) {
                console.log("✅ SUCCESS: Caught expected 403 error:", error.message);
            } else {
                console.error("❌ Unexpected error:", error);
            }
        }

        console.log("\n🎊 All Drive Enforcement Tests Completed!");

    } catch (error) {
        console.error("💥 Critical test failure:", error);
    } finally {
        await pool.end();
    }
}

runTests();
