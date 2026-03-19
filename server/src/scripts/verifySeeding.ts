import { pool } from "../config/database.js";

async function verify() {
    try {
        const rules = await pool.query("SELECT COUNT(*) FROM assessment_rule_templates");
        const drives = await pool.query("SELECT COUNT(*) FROM assessment_drives");
        const studentsInDrives = await pool.query("SELECT COUNT(*) FROM drive_students");
        const pools = await pool.query("SELECT COUNT(*) FROM drive_question_pool");
        const questions = await pool.query("SELECT COUNT(*) FROM drive_pool_questions");

        console.log("-----------------------------------------");
        console.log("📊 TalentSecure AI - Seeding Verification");
        console.log("-----------------------------------------");
        console.log(`✅ Rules Created       : ${rules.rows[0].count}`);
        console.log(`✅ Drives Created      : ${drives.rows[0].count}`);
        console.log(`✅ Students Mapped     : ${studentsInDrives.rows[0].count}`);
        console.log(`✅ Question Pools      : ${pools.rows[0].count}`);
        console.log(`✅ Questions Generated : ${questions.rows[0].count}`);
        console.log("-----------------------------------------");

        const driveDetails = await pool.query("SELECT id, name, status, rule_id, rule_version_id, pool_id FROM assessment_drives");
        console.log("Drive Details:");
        driveDetails.rows.forEach(d => {
            console.log(`- "${d.name}": status=["${d.status}"] (id=${d.id}, rule=${d.rule_id}, pool=${d.pool_id})`);
        });
        console.log("-----------------------------------------");

        const poolDetails = await pool.query("SELECT id, drive_id, total_generated, generation_status, status FROM drive_question_pool");
        console.log("Pool Details:");
        poolDetails.rows.forEach(p => {
            console.log(`- Pool ${p.id} (Drive ${p.drive_id}): gen_status=${p.generation_status}, status=${p.status}, count=${p.total_generated}`);
        });
        console.log("-----------------------------------------");

        const sampleQuestions = await pool.query("SELECT id, drive_id, skill, difficulty, status FROM drive_pool_questions LIMIT 5");
        console.log("Sample Questions (First 5):");
        sampleQuestions.rows.forEach(q => {
            console.log(`- Q ${q.id}: drive=${q.drive_id}, skill=${q.skill}, diff=${q.difficulty}, status=${q.status}`);
        });
        console.log("-----------------------------------------");
    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        await pool.end();
    }
}

verify();
