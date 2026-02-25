/**
 * Quick-fix seeder: inserts test student users into the ACTUAL database schema.
 *
 * The original seed.ts uses Prisma model names (Campus, StudentProfile, Role, etc.)
 * that don't match the real DB tables (colleges, student_details, etc.), so it
 * never created student rows.  This script uses raw SQL against the real tables.
 *
 * Usage:  npx tsx prisma/seed-students.ts
 */

import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const STUDENTS = [
    { name: "Aarav Patel", email: "aarav.patel@student.edu" },
    { name: "Aditi Kumar", email: "aditi.kumar@student.edu" },
    { name: "Arjun Singh", email: "arjun.singh@student.edu" },
    { name: "Diya Sharma", email: "diya.sharma@student.edu" },
    { name: "Ishaan Gupta", email: "ishaan.gupta@student.edu" },
    { name: "Kavya Nair", email: "kavya.nair@student.edu" },
    { name: "Rahul Reddy", email: "rahul.reddy@student.edu" },
    { name: "Priya Das", email: "priya.das@student.edu" },
    { name: "Rohan Joshi", email: "rohan.joshi@student.edu" },
    { name: "Shreya Iyer", email: "shreya.iyer@student.edu" },
];

const DEFAULT_PASSWORD = "student123";

async function seed() {
    const client = await pool.connect();
    console.log("🌱 Seeding test students…\n");

    try {
        // Pick the first active college to assign students to
        const collegeResult = await client.query(
            "SELECT id FROM colleges WHERE is_active = TRUE LIMIT 1"
        );

        if (collegeResult.rows.length === 0) {
            console.error("❌ No active college found. Please create a campus first.");
            process.exit(1);
        }

        const collegeId = collegeResult.rows[0].id;
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

        let created = 0;
        let skipped = 0;

        for (const s of STUDENTS) {
            // Skip if email already exists
            const existing = await client.query(
                "SELECT id FROM users WHERE email = $1",
                [s.email.toLowerCase()]
            );
            if (existing.rows.length > 0) {
                console.log(`  ⏭  ${s.email} (already exists)`);
                skipped++;
                continue;
            }

            // Insert user
            const userResult = await client.query(
                `INSERT INTO users
           (role, name, email, password, college_id, is_active, is_profile_complete, must_change_password)
         VALUES
           ('student', $1, $2, $3, $4, TRUE, FALSE, FALSE)
         RETURNING id`,
                [s.name, s.email.toLowerCase(), hashedPassword, collegeId]
            );
            const userId = userResult.rows[0].id;

            // Insert student_details row
            await client.query(
                `INSERT INTO student_details (user_id, college_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO NOTHING`,
                [userId, collegeId]
            );

            console.log(`  ✅ ${s.email}`);
            created++;
        }

        console.log(`\n✅ Done!  Created: ${created}  |  Skipped: ${skipped}`);
        console.log(`\n  Default credentials:`);
        console.log(`    Email   : aarav.patel@student.edu`);
        console.log(`    Password: ${DEFAULT_PASSWORD}\n`);
    } catch (err) {
        console.error("❌ Seed failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
