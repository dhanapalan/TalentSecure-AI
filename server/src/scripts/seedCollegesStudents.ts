/**
 * TalentSecure AI — Full Seed Script
 * Seeds 25 engineering colleges (each with a college_admin user)
 * and 500 students per college (10 depts × 50 students), ALL fields populated.
 *
 * Usage:  npx tsx src/scripts/seedCollegesStudents.ts
 */

import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../config/database.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const STUDENTS_PER_DEPT = 50;

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

const COLLEGES = [
    { name: "IIT Madras", city: "Chennai", slug: "iit-madras" },
    { name: "NIT Trichy", city: "Trichy", slug: "nit-trichy" },
    { name: "VIT Vellore", city: "Vellore", slug: "vit" },
    { name: "Anna University", city: "Chennai", slug: "anna-univ" },
    { name: "PSG College of Technology", city: "Coimbatore", slug: "psg" },
    { name: "Amrita University", city: "Coimbatore", slug: "amrita" },
    { name: "SRM Institute of Science", city: "Chennai", slug: "srm" },
    { name: "Manipal Institute of Technology", city: "Manipal", slug: "manipal" },
    { name: "BITS Pilani", city: "Pilani", slug: "bits" },
    { name: "Jadavpur University", city: "Kolkata", slug: "jadavpur" },
    { name: "SASTRA University", city: "Thanjavur", slug: "sastra" },
    { name: "Kalasalingam University", city: "Srivilliputtur", slug: "klu" },
    { name: "College of Engineering Guindy", city: "Chennai", slug: "ceg" },
    { name: "Thiagarajar College of Engineering", city: "Madurai", slug: "tce" },
    { name: "Bannari Amman Institute of Technology", city: "Erode", slug: "bait" },
    { name: "Kongu Engineering College", city: "Perundurai", slug: "kongu" },
    { name: "Sri Krishna College of Engineering", city: "Coimbatore", slug: "skce" },
    { name: "Coimbatore Institute of Technology", city: "Coimbatore", slug: "cit" },
    { name: "RVR and JC College of Engineering", city: "Guntur", slug: "rvrjc" },
    { name: "Mepco Schlenk Engineering College", city: "Sivakasi", slug: "mepco" },
    { name: "SSN College of Engineering", city: "Chennai", slug: "ssn" },
    { name: "Sona College of Technology", city: "Salem", slug: "sona" },
    { name: "Kumaraguru College of Technology", city: "Coimbatore", slug: "kct" },
    { name: "Sri Venkateswara College of Engg", city: "Chennai", slug: "svce" },
    { name: "Rajalakshmi Engineering College", city: "Chennai", slug: "rec" },
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
    const hashedPassword = await bcrypt.hash("TalentSecure@2025", 10);

    console.log("🚀  TalentSecure AI — Database Seeder");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    try {
        await client.query("BEGIN");

        // ── 1. Clear existing college / student data ───────────────────────────────
        console.log("\n🗑   Clearing existing data…");
        await client.query(`DELETE FROM student_summary`);
        await client.query(`DELETE FROM student_details sd USING users u WHERE u.id = sd.user_id AND LOWER(u.role::text) = 'student'`);
        await client.query(`DELETE FROM users WHERE LOWER(role::text) = 'student'`);
        await client.query(`UPDATE users SET college_id = NULL WHERE LOWER(role::text) IN ('college','college_admin','college_staff')`);
        await client.query(`DELETE FROM colleges`);
        await client.query(`DELETE FROM users WHERE LOWER(role::text) IN ('college','college_admin','college_staff')`);
        console.log("   ✅  Done.");

        // ── 2. Create 25 colleges + college admin users ───────────────────────────
        console.log("\n🏫   Creating colleges…");

        const collegeRecords: { collegeId: string; code: string; name: string }[] = [];

        for (let i = 0; i < COLLEGES.length; i++) {
            const col = COLLEGES[i];
            const code = `COL${String(i + 1).padStart(2, "0")}`;
            const adminEmail = `admin.${col.slug}@nallasconnect.edu.in`;
            const adminId = uuidv4();
            const collegeId = uuidv4();

            // Insert college admin user
            await client.query(`
        INSERT INTO users
          (id, role, name, email, password, is_active, is_profile_complete, login_type, status, created_at, updated_at)
        VALUES
          ($1, 'college', $2, $3, $4, true, true, 'LOCAL', 'active', NOW(), NOW())
      `, [adminId, col.name, adminEmail, hashedPassword]);

            // Insert into colleges table (with legacy_user_id pointing to admin user)
            await client.query(`
        INSERT INTO colleges (id, college_code, name, legacy_user_id, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $4, NOW(), NOW())
      `, [collegeId, code, col.name, adminId]);

            // Back-fill college admin's college_id → colleges.id
            await client.query(`UPDATE users SET college_id = $1 WHERE id = $2`, [collegeId, adminId]);

            collegeRecords.push({ collegeId, code, name: col.name });
            console.log(`   ✓  [${code}] ${col.name}`);
        }

        // ── 3. Create 500 students per college ────────────────────────────────────
        console.log("\n👨‍🎓   Creating students (25 colleges × 10 depts × 50 students = 12,500 students)…");
        console.log("   This will take a minute…\n");

        let totalStudents = 0;

        for (const college of collegeRecords) {
            const colShort = college.code.replace("COL", "C");

            for (let di = 0; di < DEPARTMENTS.length; di++) {
                const dept = DEPARTMENTS[di];
                const skills = SKILLS_POOL[di];

                for (let s = 1; s <= STUDENTS_PER_DEPT; s++) {
                    const collegeIdx = collegeRecords.indexOf(college);
                    const nameIdx = (collegeIdx * 500) + (di * 50) + (s - 1);

                    const firstName = FIRST_NAMES[nameIdx % FIRST_NAMES.length];
                    const lastName = LAST_NAMES[nameIdx % LAST_NAMES.length];
                    const initial = MIDDLE_INITIALS[nameIdx % MIDDLE_INITIALS.length];

                    const fullName = `${firstName} ${initial} ${lastName}`;
                    const passingYear = PASSING_YEARS[(s - 1) % PASSING_YEARS.length];
                    const section = SECTIONS[(s - 1) % SECTIONS.length];
                    const gender = GENDERS[(s - 1) % 2] as "male" | "female";
                    const cgpa = randFloat(6.0, 9.8);
                    const percentage = parseFloat((cgpa * 10 + randFloat(-2, 2)).toFixed(1));
                    const phone = `9${String(randInt(100000000, 999999999))}`;
                    const studentId = `${colShort}${passingYear % 100}${dept.code}${String(s).padStart(3, "0")}`;
                    const email = `${firstName.toLowerCase()}.${studentId.toLowerCase()}@nallasconnect.edu.in`;

                    const dob = new Date(1999 + (s % 4), (s * 3) % 12, ((s * 7) % 28) + 1).toISOString().split("T")[0];
                    const linkedin = `https://linkedin.com/in/${slugify(firstName)}-${slugify(lastName)}-${studentId.toLowerCase()}`;
                    const github = `https://github.com/${slugify(firstName)}${slugify(lastName)}${s}`;
                    const placementStatus = PLACEMENT_STATUSES[s % PLACEMENT_STATUSES.length];
                    const isShortlisted = ["Shortlisted", "Interviewed", "Offered", "Joined"].includes(placementStatus);
                    const hasJoined = placementStatus === "Joined";
                    const offerReleased = ["Offered", "Joined"].includes(placementStatus);
                    const offerAccepted = hasJoined;
                    const eligibleForHiring = cgpa >= 6.5;
                    const placedCompany = hasJoined ? `Company ${s % 10 + 1} Pvt Ltd` : null;
                    const placementPackage = hasJoined ? randFloat(3.5, 22.0, 1) : null;
                    const avgIntegrity = randFloat(70, 99);
                    const totalViolations = randInt(0, 3);
                    const riskCategory = avgIntegrity >= 85 ? "Low" : avgIntegrity >= 70 ? "Medium" : "High";
                    const skillsArr = [...skills, dept.name, "Problem Solving"];

                    const className = `${dept.code}-${section}`;

                    const userId = uuidv4();

                    // Insert user row
                    await client.query(`
            INSERT INTO users
              (id, role, name, email, password, phone_number, is_active, college_id, is_profile_complete, login_type, status, created_at, updated_at)
            VALUES
              ($1, 'student', $2, $3, $4, $5, true, $6, true, 'LOCAL', 'active', NOW(), NOW())
          `, [userId, fullName, email, hashedPassword, phone, college.collegeId]);

                    // Insert student_details with ALL fields
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
                        userId, college.collegeId,
                        firstName, lastName,
                        studentId, phone, dob, gender,
                        dept.name, className, section, passingYear,
                        cgpa, percentage, skillsArr, linkedin, github,
                        eligibleForHiring, placementStatus, placedCompany, placementPackage,
                        placementStatus === "Interviewed" ? "Pending" : null, isShortlisted,
                        offerReleased, offerAccepted, hasJoined,
                        avgIntegrity, totalViolations, riskCategory,
                    ]);

                    totalStudents++;
                }
            }

            console.log(`   ✓  ${college.name}: 500 students`);
        }

        await client.query("COMMIT");

        console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("✅   Seeding complete!");
        console.log(`   Colleges : ${collegeRecords.length}`);
        console.log(`   Students : ${totalStudents}`);
        console.log(`   Password : TalentSecure@2025 (all accounts)`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("\n❌  Seed failed — transaction rolled back.");
        console.error(err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
