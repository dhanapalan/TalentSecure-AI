/**
 * TalentSecure AI — Student Generation Script
 * Generates mock students for existing campuses to ensure each has at least 50 students.
 *
 * Usage:  npx tsx src/scripts/generateStudentsForExistingCampuses.ts
 */

import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const TARGET_STUDENTS_PER_CAMPUS = 50;

const DEPARTMENTS = [
    { name: "Computer Science Engineering", code: "CSE" },
    { name: "Electronics & Communication Engineering", code: "ECE" },
    { name: "Mechanical Engineering", code: "ME" },
    { name: "Civil Engineering", code: "CE" },
    { name: "Information Technology", code: "IT" },
    { name: "Electrical Engineering", code: "EE" },
    { name: "Chemical Engineering", code: "CHE" },
    { name: "Aerospace Engineering", code: "AE" },
    { name: "Biomedical Engineering", code: "BME" },
    { name: "Data Science & AI", code: "DS" },
];

const FIRST_NAMES = [
    "Aarav", "Aditi", "Arjun", "Ananya", "Aditya", "Bhavna", "Charan", "Deepa",
    "Dinesh", "Esha", "Faiz", "Gayathri", "Harsh", "Indira", "Jai", "Kavya",
    "Kiran", "Lakshmi", "Manoj", "Meena", "Nandita", "Nikhil", "Priya", "Pranav",
    "Rahul", "Riya", "Rohit", "Sandhya", "Sanjay", "Sneha", "Suresh", "Swati",
    "Tarun", "Uday", "Uma", "Varun", "Vijay", "Vinita", "Yamini", "Yash",
    "Aakash", "Bharat", "Chirag", "Darshan", "Divya", "Ekta", "Farhan", "Geetha",
    "Hemant", "Ishaan", "Jatin", "Kriti", "Lokesh", "Maya", "Nitin", "Ojas",
    "Parth", "Rashi", "Sahil", "Tanya", "Utkarsh", "Vanya", "Zayan", "Ishita",
    "Kabir", "Mira", "Reyansh", "Saanvi", "Vivaan", "Zara", "Aarohi", "Aaryan",
];

const LAST_NAMES = [
    "Kumar", "Sharma", "Patel", "Reddy", "Nair", "Singh", "Gupta", "Menon",
    "Pillai", "Rao", "Joshi", "Mehta", "Verma", "Iyer", "Krishnan", "Bose",
    "Ghosh", "Sinha", "Chauhan", "Malhotra", "Agarwal", "Chatterjee", "Dubey",
    "Pandey", "Mishra", "Tiwari", "Saxena", "Kapoor", "Chaudhary", "Shah",
    "Kulkarni", "Deshmukh", "Pande", "Gaikwad", "Patil", "Bhardwaj", "Trivedi",
    "Pathak", "Sari", "Rathore", "Shekhawat", "Solanki", "Bansal", "Singhal",
];
const MIDDLE_INITIALS = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "H.", "I.", "J.", "K.", "L.", "M.", "P.", "R.", "S.", "T.", "V."];

const PASSING_YEARS = [2024, 2025, 2026, 2027];
const SECTIONS = ["A", "B", "C", "D"];
const GENDERS = ["male", "female"];
const SKILLS_POOL = [
    ["Python", "Machine Learning", "Data Analysis", "TensorFlow", "SQL"],
    ["Java", "Spring Boot", "REST APIs", "Microservices", "Docker"],
    ["C++", "Embedded Systems", "RTOS", "Arduino", "IoT"],
    ["JavaScript", "React", "Node.js", "TypeScript", "MongoDB"],
    ["MATLAB", "Simulink", "PLC Programming", "Control Systems", "AutoCAD"],
    ["Android", "Kotlin", "Flutter", "Firebase", "UI/UX"],
    ["C", "VLSI", "Digital Signal Processing", "Verilog", "FPGA"],
    ["Python", "Django", "PostgreSQL", "Redis", "Celery"],
    ["Cloud Computing", "AWS", "Azure", "Kubernetes", "Terraform"],
    ["R", "Statistics", "SPSS", "Data Visualization", "Tableau"],
];
const PLACEMENT_STATUSES = [
    "Not Shortlisted", "Shortlisted", "Interviewed", "Offered", "Joined", "Rejected"
];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randFloat(min: number, max: number, dec = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(dec));
}
function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function slugify(s: string) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    const client = await pool.connect();
    const hashedPassword = await bcrypt.hash("Student@123", 10);

    console.log("🚀  TalentSecure AI — Student Data Generator");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        // 1. Fetch all active campuses
        console.log("\n🔍  Fetching active campuses…");
        const campusesRes = await client.query<{ id: string, name: string, college_code: string }>(
            "SELECT id, name, college_code FROM colleges WHERE is_active IS NOT FALSE"
        );
        const campuses = campusesRes.rows;
        console.log(`   Found ${campuses.length} campuses.`);

        let totalNewStudents = 0;

        for (const college of campuses) {
            // 2. Check current student count
            const countRes = await client.query<{ count: string }>(
                "SELECT COUNT(*) FROM student_details WHERE college_id = $1",
                [college.id]
            );
            const currentCount = parseInt(countRes.rows[0].count, 10);

            if (currentCount >= TARGET_STUDENTS_PER_CAMPUS) {
                console.log(`   ⏭️  ${college.name} already has ${currentCount} students. Skipping.`);
                continue;
            }

            const needed = TARGET_STUDENTS_PER_CAMPUS - currentCount;
            console.log(`   ➕  ${college.name} has ${currentCount} students. Generating ${needed} more…`);

            await client.query("BEGIN");

            for (let i = 0; i < needed; i++) {
                const di = randInt(0, DEPARTMENTS.length - 1);
                const dept = DEPARTMENTS[di];
                const skills = SKILLS_POOL[di % SKILLS_POOL.length];

                const firstName = rand(FIRST_NAMES);
                const lastName = rand(LAST_NAMES);
                const initial = rand(MIDDLE_INITIALS);

                const fullName = `${firstName} ${initial} ${lastName}`;
                const passingYear = rand(PASSING_YEARS);
                const section = rand(SECTIONS);
                const gender = rand(GENDERS) as "male" | "female";
                const cgpa = randFloat(6.0, 9.5);
                const percentage = parseFloat((cgpa * 10 + randFloat(-2, 2)).toFixed(1));
                const phone = `9${String(randInt(100000000, 999999999))}`;
                const studentCode = `${college.college_code.slice(0, 3)}${passingYear % 100}${dept.code}${String(currentCount + i + 1).padStart(3, "0")}${randInt(10, 99)}`;
                const email = `${firstName.toLowerCase()}.${studentCode.toLowerCase()}@student.nallas.edu.in`;

                const dob = new Date(2000 + randInt(0, 3), randInt(0, 11), randInt(1, 28)).toISOString().split("T")[0];
                const linkedin = `https://linkedin.com/in/${slugify(firstName)}-${slugify(lastName)}-${studentCode.toLowerCase()}`;
                const github = `https://github.com/${slugify(firstName)}${slugify(lastName)}${currentCount + i}`;
                const placementStatus = rand(PLACEMENT_STATUSES);
                const isShortlisted = ["Shortlisted", "Interviewed", "Offered", "Joined"].includes(placementStatus);
                const hasJoined = placementStatus === "Joined";
                const offerReleased = ["Offered", "Joined"].includes(placementStatus);
                const offerAccepted = hasJoined;
                const eligibleForHiring = cgpa >= 6.5;
                const placedCompany = hasJoined ? `Company ${randInt(1, 20)} Pvt Ltd` : null;
                const placementPackage = hasJoined ? randFloat(3.5, 18.0, 1) : null;
                const avgIntegrity = randFloat(75, 99);
                const totalViolations = randInt(0, 2);
                const riskCategory = avgIntegrity >= 85 ? "Low" : avgIntegrity >= 70 ? "Medium" : "High";
                const skillsArr = [...skills, dept.name, "Problem Solving"];

                const className = `${dept.code}-${section}`;
                const userId = uuidv4();

                // Check if user exists
                const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
                if (existing.rows.length > 0) {
                    continue;
                }

                // Insert user row
                await client.query(`
                    INSERT INTO users
                    (id, role, name, email, password, phone_number, is_active, college_id, is_profile_complete, login_type, status, created_at, updated_at)
                    VALUES
                    ($1, 'student', $2, $3, $4, $5, true, $6, true, 'LOCAL', 'active', NOW(), NOW())
                `, [userId, fullName, email, hashedPassword, phone, college.id]);

                // Insert student_details
                await client.query(`
                    INSERT INTO student_details (
                        user_id, college_id,
                        first_name, middle_name, last_name,
                        student_identifier, phone_number, dob, gender,
                        degree, specialization, class_name, section, passing_year,
                        cgpa, percentage, skills, linkedin_url, github_url,
                        eligible_for_hiring, placement_status, placed_company, placement_package,
                        is_blacklisted, is_suspended, interview_status, is_shortlisted,
                        offer_released, offer_accepted, has_joined,
                        avg_integrity_score, total_violations, risk_category
                    ) VALUES (
                        $1, $2,
                        $3, '', $4,
                        $5, $6, $7, $8,
                        'B.Tech', $9, $10, $11, $12,
                        $13, $14, $15, $16, $17,
                        $18, $19, $20, $21,
                        false, false, $22, $23,
                        $24, $25, $26,
                        $27, $28, $29
                    )
                `, [
                    userId, college.id,
                    firstName, lastName,
                    studentCode, phone, dob, gender,
                    dept.name, className, section, passingYear,
                    cgpa, percentage, skillsArr, linkedin, github,
                    eligibleForHiring, placementStatus, placedCompany, placementPackage,
                    placementStatus === "Interviewed" ? "Pending" : null, isShortlisted,
                    offerReleased, offerAccepted, hasJoined,
                    avgIntegrity, totalViolations, riskCategory,
                ]);

                totalNewStudents++;
            }

            await client.query("COMMIT");
            console.log(`   ✅  Finished ${college.name}.`);
        }

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🎉  Generation complete!");
        console.log(`    New Students Created : ${totalNewStudents}`);
        console.log(`    Default Password     : Student@123`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    } catch (err) {
        await client.query("ROLLBACK");
        console.error("\n❌  Generation failed — transaction rolled back.");
        console.error(err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
