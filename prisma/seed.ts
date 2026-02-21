import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";

const prisma = new PrismaClient();

const skills = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "React", "Node.js",
  "SQL", "MongoDB", "Docker", "AWS", "Machine Learning", "Data Structures",
  "Algorithms", "REST APIs", "GraphQL", "Git", "Linux", "TensorFlow", "Kubernetes",
];

const universities = [
  "IIT Bombay", "IIT Delhi", "IIT Madras", "NIT Trichy", "BITS Pilani",
  "VIT Vellore", "SRM University", "Anna University", "Delhi University", "IIIT Hyderabad",
];

const majors = [
  "Computer Science", "Information Technology", "Electronics", "Mechanical",
  "Electrical", "Data Science", "Artificial Intelligence",
];

const degrees = ["B.Tech", "B.E.", "M.Tech", "MCA", "B.Sc CS"];

function randomSubset<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function seed() {
  console.log("🌱 Seeding TalentSecure AI database...\n");

  // Clean
  await prisma.proctoringViolation.deleteMany();
  await prisma.proctoringSession.deleteMany();
  await prisma.assessmentSession.deleteMany();
  await prisma.question.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.segment.deleteMany();
  await prisma.role.deleteMany();
  await prisma.campus.deleteMany();
  await prisma.user.deleteMany();

  // ── Admin User ─────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.create({
    data: {
      email: "admin@talentsecure.ai",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  // ── Recruiter ──────────────────────────────────────────────────────────
  const recruiterPassword = await bcrypt.hash("recruiter123", 12);
  const recruiter = await prisma.user.create({
    data: {
      email: "recruiter@company.com",
      password: recruiterPassword,
      firstName: "Priya",
      lastName: "Sharma",
      role: "RECRUITER",
    },
  });
  console.log(`  ✓ Recruiter: ${recruiter.email}`);

  // ── Campuses ───────────────────────────────────────────────────────────
  const campuses = await Promise.all(
    universities.map((name) =>
      prisma.campus.create({
        data: {
          name,
          city: name.includes("Bombay") ? "Mumbai" : name.includes("Delhi") ? "Delhi" : "Chennai",
          state: name.includes("Bombay") ? "Maharashtra" : name.includes("Delhi") ? "Delhi" : "Tamil Nadu",
        },
      })
    )
  );
  console.log(`  ✓ ${campuses.length} campuses created`);

  // ── 50 Student Users + Profiles ────────────────────────────────────────
  const firstNames = [
    "Aarav", "Aditi", "Aditya", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya",
    "Krishna", "Lakshmi", "Manav", "Meera", "Neha", "Om", "Priya", "Rahul",
    "Riya", "Rohan", "Sai", "Shreya", "Tanvi", "Varun", "Vihaan", "Zara",
    "Amit", "Bhavya", "Chetan", "Divya", "Esha", "Farhan", "Gaurav", "Harini",
    "Isha", "Jay", "Kiran", "Lavanya", "Mohit", "Nisha", "Ojas", "Pallavi",
    "Qasim", "Ritika", "Sameer", "Tanya", "Uday", "Vidya", "Waqar", "Xena",
    "Yash", "Zoya",
  ];
  const lastNames = [
    "Patel", "Kumar", "Singh", "Gupta", "Sharma", "Joshi", "Nair", "Reddy",
    "Das", "Iyer", "Agarwal", "Bhat", "Chopra", "Desai", "Fernandes",
  ];

  const studentPassword = await bcrypt.hash("student123", 12);

  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[i];
    const lastName = lastNames[i % lastNames.length];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@student.edu`;
    const campus = campuses[i % campuses.length];

    const user = await prisma.user.create({
      data: {
        email,
        password: studentPassword,
        firstName,
        lastName,
        role: "STUDENT",
      },
    });

    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        firstName,
        lastName,
        email,
        university: campus.name,
        campusId: campus.id,
        degree: degrees[Math.floor(Math.random() * degrees.length)],
        major: majors[Math.floor(Math.random() * majors.length)],
        graduationYear: 2026,
        cgpa: parseFloat((Math.random() * 3 + 7).toFixed(2)), // 7.0 – 10.0
        skills: randomSubset(skills, 3, 8),
      },
    });
  }
  console.log(`  ✓ 50 students created`);

  // ── Roles ──────────────────────────────────────────────────────────────
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        title: "Software Development Engineer",
        company: "TechCorp India",
        description: "Full-stack developer role focusing on React, Node.js, and cloud technologies.",
        technicalSkills: [
          { skill: "JavaScript", weight: 0.9, mandatory: true },
          { skill: "React", weight: 0.8, mandatory: true },
          { skill: "Node.js", weight: 0.7, mandatory: false },
          { skill: "SQL", weight: 0.5, mandatory: false },
          { skill: "Docker", weight: 0.3, mandatory: false },
        ],
        behavioralCompetencies: [
          { competency: "Problem Solving", minScore: 70, weight: 0.8 },
          { competency: "Communication", minScore: 60, weight: 0.6 },
        ],
        minCGPA: 7.5,
        eligibleDegrees: ["B.Tech", "B.E.", "M.Tech"],
        eligibleMajors: ["Computer Science", "Information Technology"],
        maxPositions: 15,
        status: "ACTIVE",
      },
    }),
    prisma.role.create({
      data: {
        title: "Data Scientist",
        company: "DataVerse Analytics",
        description: "ML/AI role focused on building predictive models and data pipelines.",
        technicalSkills: [
          { skill: "Python", weight: 1.0, mandatory: true },
          { skill: "Machine Learning", weight: 0.9, mandatory: true },
          { skill: "TensorFlow", weight: 0.7, mandatory: false },
          { skill: "SQL", weight: 0.6, mandatory: false },
        ],
        behavioralCompetencies: [
          { competency: "Analytical Thinking", minScore: 80, weight: 0.9 },
          { competency: "Curiosity", minScore: 70, weight: 0.5 },
        ],
        minCGPA: 8.0,
        eligibleDegrees: ["B.Tech", "M.Tech", "B.Sc CS"],
        eligibleMajors: ["Computer Science", "Data Science", "Artificial Intelligence"],
        maxPositions: 8,
        status: "ACTIVE",
      },
    }),
    prisma.role.create({
      data: {
        title: "DevOps Engineer",
        company: "CloudNative Solutions",
        description: "Infrastructure and CI/CD role with focus on containerization.",
        technicalSkills: [
          { skill: "Docker", weight: 1.0, mandatory: true },
          { skill: "Kubernetes", weight: 0.9, mandatory: true },
          { skill: "AWS", weight: 0.8, mandatory: false },
          { skill: "Linux", weight: 0.7, mandatory: true },
          { skill: "Git", weight: 0.5, mandatory: false },
        ],
        behavioralCompetencies: [
          { competency: "Attention to Detail", minScore: 75, weight: 0.8 },
        ],
        minCGPA: 7.0,
        eligibleDegrees: ["B.Tech", "B.E.", "M.Tech"],
        eligibleMajors: ["Computer Science", "Information Technology", "Electronics"],
        maxPositions: 5,
        status: "ACTIVE",
      },
    }),
  ]);
  console.log(`  ✓ ${roles.length} roles created`);

  // ── Assessment ─────────────────────────────────────────────────────────
  const assessment = await prisma.assessment.create({
    data: {
      roleId: roles[0].id,
      title: "SDE Coding Assessment — Round 1",
      type: "MIXED",
      durationMinutes: 90,
      totalMarks: 100,
      passingPercentage: 60,
      proctoringEnabled: true,
      browserLockdown: true,
      scheduledAt: new Date("2026-03-01T10:00:00Z"),
      status: "SCHEDULED",
      questions: {
        create: [
          {
            type: "MCQ",
            text: "What is the time complexity of binary search?",
            options: ["O(1)", "O(n)", "O(log n)", "O(n log n)"],
            correctAnswer: "O(log n)",
            marks: 5,
            difficulty: "EASY",
            tags: ["algorithms", "searching"],
          },
          {
            type: "MCQ",
            text: "Which React hook is used for side effects?",
            options: ["useState", "useEffect", "useMemo", "useRef"],
            correctAnswer: "useEffect",
            marks: 5,
            difficulty: "EASY",
            tags: ["react", "frontend"],
          },
          {
            type: "MCQ",
            text: "What does the 'new' keyword do in JavaScript?",
            options: [
              "Creates a new scope",
              "Creates a new object instance",
              "Declares a new variable",
              "Creates a new function",
            ],
            correctAnswer: "Creates a new object instance",
            marks: 5,
            difficulty: "MEDIUM",
            tags: ["javascript", "oop"],
          },
          {
            type: "CODING",
            text: "Write a function to reverse a linked list in-place. The function should take the head node and return the new head.",
            marks: 25,
            difficulty: "MEDIUM",
            tags: ["data-structures", "linked-list"],
            options: [],
          },
          {
            type: "CODING",
            text: "Implement a debounce function that delays invoking the provided function until after 'wait' milliseconds have elapsed since the last invocation.",
            marks: 20,
            difficulty: "MEDIUM",
            tags: ["javascript", "functional"],
            options: [],
          },
          {
            type: "MCQ",
            text: "Which HTTP status code indicates 'Unauthorized'?",
            options: ["400", "401", "403", "404"],
            correctAnswer: "401",
            marks: 5,
            difficulty: "EASY",
            tags: ["http", "web"],
          },
          {
            type: "CODING",
            text: "Given an array of integers and a target sum, find all unique pairs that add up to the target. Return the pairs sorted.",
            marks: 35,
            difficulty: "HARD",
            tags: ["algorithms", "arrays", "two-pointers"],
            options: [],
          },
        ],
      },
    },
  });
  console.log(`  ✓ Assessment created: ${assessment.title}`);

  // ── Segments (initial) ─────────────────────────────────────────────────
  await Promise.all([
    prisma.segment.create({
      data: {
        name: "Top Performers",
        description: "Students with CGPA ≥ 9.0 and strong technical skills",
        criteria: { minCGPA: 9.0, skills: ["JavaScript", "Python", "React"] },
        studentCount: 0,
        avgMatchScore: 0,
      },
    }),
    prisma.segment.create({
      data: {
        name: "Strong Technical",
        description: "Students with diverse technical skill set",
        criteria: { minCGPA: 8.0, skills: ["Docker", "AWS", "Kubernetes"] },
        studentCount: 0,
        avgMatchScore: 0,
      },
    }),
    prisma.segment.create({
      data: {
        name: "Emerging Talent",
        description: "Students showing growth potential",
        criteria: { minCGPA: 7.0, maxCGPA: 8.0 },
        studentCount: 0,
        avgMatchScore: 0,
      },
    }),
  ]);
  console.log(`  ✓ 3 initial segments created`);

  console.log("\n✅ Seed complete!\n");
  console.log("  Credentials:");
  console.log("    Admin    : admin@talentsecure.ai / admin123");
  console.log("    Recruiter: recruiter@company.com / recruiter123");
  console.log("    Students : aarav.patel0@student.edu / student123\n");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
