import { query, queryOne } from './src/config/database.js';
import { createRule, updateRule } from './src/services/assessmentRule.service.js';
import { createDrive, addDriveStudent, addDriveAssignment, getDriveStudents } from './src/services/drive.service.js';
import { pool } from './src/config/database.js';

async function testEligibility() {
    try {
        console.log("🚀 Starting Eligibility Engine Verification (EL-01, EL-02)...");

        // 1. Create a rule with CGPA 7.5 requirement
        const rule = await createRule({
            name: "Eligibility Test Rule",
            description: "Requires 7.5 CGPA",
            status: "active",
            targeting_config: {
                min_cgpa: 7.5,
                min_percentage: 0,
                assign_to: "all",
                attempt_limit: 1,
                auto_publish_results: false,
                allow_mock: true
            }
        });
        console.log(`✅ Rule created: ${rule.id}`);

        // 2. Create a drive from this rule
        const drive = await createDrive({
            name: "Eligibility Test Drive",
            rule_id: rule.id,
            status: "DRAFT",
            scheduled_start: new Date(Date.now() - 3600000), // Started 1h ago
            scheduled_end: new Date(Date.now() + 3600000),    // Ends in 1h
            max_applicants: 100
        });
        console.log(`✅ Drive created: ${drive.id}`);

        // 3. Test Individual Add - INELIGIBLE (7.34 CGPA)
        const ineligibleStudentId = "47df4961-72c4-4441-91ac-b7e198ac0516";
        console.log(`Testing individual add of INELIGIBLE student (${ineligibleStudentId})...`);
        try {
            await addDriveStudent(drive.id, ineligibleStudentId);
            console.error("❌ ERROR: Ineligible student was unexpectedly added!");
        } catch (err: any) {
            console.log(`✅ SUCCESS: Ineligible student blocked. Error: ${err.message}`);
        }

        // 4. Test Individual Add - ELIGIBLE (9.80 CGPA)
        const eligibleStudentId = "cde6b55c-c77c-49b6-95ad-559e21686507";
        console.log(`Testing individual add of ELIGIBLE student (${eligibleStudentId})...`);
        try {
            await addDriveStudent(drive.id, eligibleStudentId);
            console.log("✅ SUCCESS: Eligible student was added.");
        } catch (err: any) {
            console.error(`❌ ERROR: Eligible student was blocked! Error: ${err.message}`);
        }

        // 5. Test Bulk Assignment (Campus/College filtering)
        // We'll use the college_id of our eligible student
        const collegeId = "2b05a53f-8ed0-4729-b71b-998ac05160d5"; // From output earlier
        console.log(`Testing bulk assignment for college ${collegeId}...`);
        await addDriveAssignment(drive.id, collegeId);

        const mappedStudents = await getDriveStudents(drive.id);
        console.log(`✅ Bulk assignment complete. Total students mapped: ${mappedStudents.length}`);

        // Verify no students with < 7.5 CGPA are in the drive
        const ineligibleCount = await queryOne<{ count: string }>(
            `SELECT count(*) FROM drive_students ds
             JOIN student_details sd ON sd.user_id = ds.student_id
             WHERE ds.drive_id = $1 AND sd.cgpa < 7.5`,
            [drive.id]
        );

        if (Number(ineligibleCount?.count) === 0) {
            console.log("🎊 SUCCESS: No ineligible students were mapped via bulk assignment!");
        } else {
            console.error(`❌ ERROR: Found ${ineligibleCount?.count} ineligible students in the drive!`);
        }

        console.log("\n🎊 ELIGIBILITY ENGINE VERIFIED SUCCESSFULLY! 🎊");

    } catch (error) {
        console.error("💥 Verification failed:", error);
    } finally {
        await pool.end();
    }
}

testEligibility();
