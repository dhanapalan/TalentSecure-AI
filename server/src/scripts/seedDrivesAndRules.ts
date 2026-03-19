/**
 * TalentSecure AI — Rules and Drives Seeder
 * Seeds Assessment Rule Templates and Assessment Drives to populate the HR dashboard.
 *
 * Usage:  npx tsx src/scripts/seedDrivesAndRules.ts
 */

import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database.js";
import { generateDrive } from "../services/drive.service.js";

const RULE_TEMPLATES = [
    {
        name: "Full Stack Developer Assessment",
        target_role: "Full Stack Developer",
        description: "Comprehensive assessment covering Frontend (React), Backend (Node.js/SQL), and System Design.",
        duration_minutes: 90,
        total_questions: 40,
        skill_distribution: [
            { category: "JavaScript", percentage: 30 },
            { category: "React", percentage: 20 },
            { category: "Programming", percentage: 30 },
            { category: "Logical Reasoning", percentage: 20 }
        ],
        difficulty_distribution: { easy: 30, medium: 50, hard: 20 }
    },
    {
        name: "Frontend Engineer (React/TS)",
        target_role: "Frontend Engineer",
        description: "Focus on UI/UX, Component Architecture, and Modern JavaScript.",
        duration_minutes: 60,
        total_questions: 30,
        skill_distribution: [
            { category: "JavaScript", percentage: 40 },
            { category: "TypeScript", percentage: 30 },
            { category: "Logic", percentage: 30 }
        ],
        difficulty_distribution: { easy: 40, medium: 40, hard: 20 }
    },
    {
        name: "Java Backend Specialist",
        target_role: "Java Backend Developer",
        description: "Focus on Core Java, Spring Boot, Microservices, and Database Optimization.",
        duration_minutes: 75,
        total_questions: 35,
        skill_distribution: [
            { category: "Java", percentage: 50 },
            { category: "Aptitude", percentage: 30 },
            { category: "Programming", percentage: 20 }
        ],
        difficulty_distribution: { easy: 20, medium: 60, hard: 20 }
    },
    {
        name: "Data Analyst Associate",
        target_role: "Data Analyst",
        description: "Assessment of Statistics, SQL, and Logical Reasoning.",
        duration_minutes: 60,
        total_questions: 30,
        skill_distribution: [
            { category: "Aptitude", percentage: 40 },
            { category: "Math", percentage: 40 },
            { category: "Programming", percentage: 20 }
        ],
        difficulty_distribution: { easy: 50, medium: 30, hard: 20 }
    },
    {
        name: "Graduate Management Trainee",
        target_role: "Management Trainee",
        description: "Focus on Aptitude, Reasoning, and General Awareness.",
        duration_minutes: 45,
        total_questions: 25,
        skill_distribution: [
            { category: "Aptitude", percentage: 60 },
            { category: "Logical Reasoning", percentage: 40 }
        ],
        difficulty_distribution: { easy: 60, medium: 30, hard: 10 }
    }
];

async function main() {
    const client = await pool.connect();

    console.log("🚀  TalentSecure AI — Rules and Drives Seeder");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        await client.query("BEGIN");

        // 1. Clear existing drives and rules (optional, but keep it clean for seeding)
        console.log("🗑   Cleaning existing rules and drives…");
        await client.query("DELETE FROM drive_pool_questions");
        await client.query("DELETE FROM drive_question_pool");
        await client.query("DELETE FROM drive_students");
        await client.query("DELETE FROM assessment_drives");
        await client.query("DELETE FROM assessment_rule_versions");
        await client.query("DELETE FROM assessment_rule_templates");

        // 2. Insert Rules
        console.log("\n📜  Seeding Assessment Rules…");
        const ruleIds: string[] = [];
        for (const r of RULE_TEMPLATES) {
            const ruleId = uuidv4();
            await client.query(`
                INSERT INTO assessment_rule_templates (
                    id, name, description, target_role, duration_minutes, total_questions,
                    total_marks, status, skill_distribution, difficulty_distribution, proctoring_mode, version
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                ruleId, r.name, r.description, r.target_role, r.duration_minutes, r.total_questions,
                r.total_questions * 5, 'active', JSON.stringify(r.skill_distribution),
                JSON.stringify(r.difficulty_distribution), 'moderate', 1
            ]);
            ruleIds.push(ruleId);
            console.log(`   ✓  ${r.name}`);
        }

        // 3. Create Drives
        console.log("\n🚗  Seeding Assessment Drives…");
        const now = new Date();
        const drives = [
            {
                name: "Spring Global Hiring Drive 2026",
                rule_id: ruleIds[0],
                status: "ACTIVE",
                start: now,
                end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            },
            {
                name: "Modern Tech Internship 2026",
                rule_id: ruleIds[1],
                status: "SCHEDULED",
                start: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
                end: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
            },
            {
                name: "Winter Engineering Recap 2025",
                rule_id: ruleIds[2],
                status: "COMPLETED",
                start: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
                end: new Date(now.getTime() - 53 * 24 * 60 * 60 * 1000)
            }
        ];

        for (const dr of drives) {
            const driveId = uuidv4();
            // We need a version ID for the drive
            const versionRes = await client.query(`
                INSERT INTO assessment_rule_versions (rule_id, version_number, snapshot, is_locked)
                SELECT id, 1, row_to_json(assessment_rule_templates), true 
                FROM assessment_rule_templates WHERE id = $1
                RETURNING id
            `, [dr.rule_id]);
            const versionId = versionRes.rows[0].id;

            await client.query(`
                INSERT INTO assessment_drives (
                    id, name, rule_id, rule_version_id, status, scheduled_start, scheduled_end,
                    total_students, proctoring_mode, duration_minutes, attempt_limit
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 'moderate', 60, 1)
            `, [driveId, dr.name, dr.rule_id, versionId, dr.status, dr.start, dr.end]);

            // Map some students
            console.log(`   Mapping students to ${dr.name}…`);
            await client.query(`
                INSERT INTO drive_students (drive_id, student_id, status)
                SELECT $1, id, 'INVITED'
                FROM users 
                WHERE role = 'student' 
                LIMIT 40
            `, [driveId]);

            // Sync count
            await client.query(`
                UPDATE assessment_drives SET total_students = (
                    SELECT count(*) FROM drive_students WHERE drive_id = $1
                ) WHERE id = $1
            `, [driveId]);

            console.log(`   ✓  ${dr.name} created with 40 students.`);

            // Generate pool for active drive
            if (dr.status === "ACTIVE") {
                console.log(`   🌊  Generating pool for ${dr.name}…`);
                // We'll call the service function after commit to avoid transaction issues if it uses its own connections
            }
        }

        await client.query("COMMIT");
        console.log("\n✅  Seeding complete (Rules, Drives, Mappings).");

        // Trigger pool generation for active drives (outside transaction)
        const activeDrives = await pool.query("SELECT id, name FROM assessment_drives WHERE status = 'ACTIVE'");
        for (const row of activeDrives.rows) {
            await generateDrive(row.id);
            console.log(`   🌊  Started pool generation for ${row.name} (${row.id})`);

            // Wait for it to finish (poll)
            console.log(`   ⏳  Waiting for generation to complete...`);
            let finished = false;
            let attempts = 0;
            while (!finished && attempts < 120) {
                const check = await pool.query(`
                    SELECT generation_status 
                    FROM drive_question_pool 
                    WHERE drive_id = $1
                `, [row.id]);

                const genStatus = check.rows[0]?.generation_status;

                const questions = await pool.query("SELECT count(*) FROM drive_pool_questions WHERE drive_id = $1", [row.id]);
                const actualCount = parseInt(questions.rows[0].count);

                process.stdout.write(`       📊 Progress: GenStatus=${genStatus}, Questions=${actualCount}\r`);

                if (actualCount >= 40 || genStatus === 'completed' || genStatus === 'failed') {
                    finished = true;
                    console.log(`\n   ✓  Pool generation ${genStatus} for ${row.name}.`);
                } else {
                    attempts++;
                    await new Promise(r => setTimeout(r, 5000));
                }
            }
        }

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("\n❌  Seed failed.");
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
