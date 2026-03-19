import { pool } from "../config/database.js";

async function run() {
    const driveId = "4079ea33-df4f-449e-be7f-cf3979230a8d"; // From previous verification

    try {
        console.log("-----------------------------------------");
        console.log("📊 Pool Matrix Validation for Drive");
        console.log("-----------------------------------------");

        // 1. Get the Rule Requirements
        const ruleRes = await pool.query(`
            SELECT art.name, art.skill_distribution, art.difficulty_distribution
            FROM assessment_drives ad
            JOIN assessment_rule_templates art ON ad.rule_id = art.id
            WHERE ad.id = $1
        `, [driveId]);

        if (ruleRes.rows.length === 0) {
            console.log("❌ Drive or Rule not found.");
            return;
        }

        const rule = ruleRes.rows[0];
        console.log(`Target Rule: ${rule.name}`);
        console.log("Expected Skill Distribution:", JSON.stringify(rule.skill_distribution, null, 2));
        console.log("Expected Difficulty Distribution:", JSON.stringify(rule.difficulty_distribution, null, 2));

        // 2. Get Actual Distribution from drive_pool_questions
        const questions = await pool.query(`
            SELECT skill, difficulty, count(*) as count
            FROM drive_pool_questions
            WHERE drive_id = $1
            GROUP BY skill, difficulty
        `, [driveId]);

        console.log("\nActual Question Breakdown:");
        const skills: Record<string, number> = {};
        const diffs: Record<string, number> = {};
        let total = 0;

        questions.rows.forEach(q => {
            const count = parseInt(q.count);
            skills[q.skill] = (skills[q.skill] || 0) + count;
            diffs[q.difficulty] = (diffs[q.difficulty] || 0) + count;
            total += count;
            console.log(`- ${q.skill} (${q.difficulty}): ${count}`);
        });

        console.log(`\nTotal Questions: ${total}`);

        // 3. Validate Test Cases (for coding questions)
        const codingQuestions = await pool.query(`
            SELECT id, question_text, ai_metadata
            FROM drive_pool_questions
            WHERE drive_id = $1 AND (ai_metadata->>'type' = 'coding' OR skill ILIKE '%programming%')
        `, [driveId]);

        if (codingQuestions.rows.length > 0) {
            console.log("\n🛠 Coding Questions & Test Cases Check:");
            codingQuestions.rows.forEach(cq => {
                const meta = cq.ai_metadata;
                const hasTestCases = meta?.hidden_test_cases && meta.hidden_test_cases.length > 0;
                console.log(`- ID: ${cq.id}`);
                console.log(`  Text: ${cq.question_text.substring(0, 50)}...`);
                console.log(`  Hidden Test Cases: ${hasTestCases ? meta.hidden_test_cases.length : "NONE"}`);
                if (hasTestCases) {
                    meta.hidden_test_cases.forEach((tc: any, i: number) => {
                        const output = tc.expectedOutput || tc.expected_output || tc.output;
                        console.log(`    [${i}] Input: ${tc.input}, Output: ${output}`);
                    });
                }
            });
        } else {
            console.log("\nℹ️ No coding questions found in this pool.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

run();
