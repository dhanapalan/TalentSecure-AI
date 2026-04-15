import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * Campus Students — CSV Upload API Tests
 *
 * Dynamically generates 50 students, builds a CSV in memory, and
 * uploads it via the real API endpoint. Then verifies the students
 * were actually created in the database.
 *
 * Flow:
 *  1. Login as super_admin → create a fresh campus with an admin
 *  2. Login as the campus admin (college_admin)
 *  3. Generate 50-student CSV dynamically
 *  4. Upload CSV via POST /api/colleges/add-students
 *  5. Verify students were created via GET /api/colleges/students
 *  6. Verify duplicate upload is handled gracefully (skipped)
 *
 * Prerequisites:
 *  - Backend API running at http://localhost:5050
 *  - Admin user `admin@gradlogic.com` / `admin123` exists
 */

const API_BASE = process.env.API_URL || 'http://localhost:5050/api';
const TS = Date.now();
const STUDENT_COUNT = 50;

// Campus + admin credentials for this test
const CAMPUS_NAME = `CSV Upload Campus ${TS}`;
const CAMPUS_CITY = 'CSV City';
const CAMPUS_STATE = 'CSV State';
const CAMPUS_ADMIN_EMAIL = `csv.campus.admin.${TS}@test.com`;
const CAMPUS_ADMIN_PASSWORD = 'CsvTest@123';
const CAMPUS_ADMIN_NAME = `CSV Campus Admin ${TS}`;

// ── Helper: generate N students ────────────────────────────────────────────────

interface StudentRow {
    student_id: string;
    name: string;
    email: string;
    phone_number: string;
}

function generateStudents(count: number): StudentRow[] {
    const students: StudentRow[] = [];
    for (let i = 1; i <= count; i++) {
        const paddedIndex = String(i).padStart(3, '0');
        students.push({
            student_id: `STU-${TS}-${paddedIndex}`,
            name: `Student ${paddedIndex} TestBatch`,
            email: `student.${TS}.${paddedIndex}@testcampus.com`,
            phone_number: `98${String(TS).slice(-4)}${paddedIndex}${String(i).padStart(2, '0')}`,
        });
    }
    return students;
}

function buildCsvString(students: StudentRow[]): string {
    const header = 'student_id,name,email,phone_number';
    const rows = students.map(
        (s) => `${s.student_id},${s.name},${s.email},${s.phone_number}`
    );
    return [header, ...rows].join('\n');
}

// ── Helper: login and get token ────────────────────────────────────────────────

async function loginAndGetToken(
    request: APIRequestContext,
    email: string,
    password: string,
): Promise<string> {
    const res = await request.post(`${API_BASE}/auth/login`, {
        data: { email, password },
    });
    expect(res.ok(), `Login failed for ${email}: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    return body.data.accessToken;
}

// ── Test Suite ──────────────────────────────────────────────────────────────────

test.describe.serial('Campus Students CSV Upload — API Tests', () => {
    test.describe.configure({ timeout: 120000 });

    let adminToken: string;
    let campusAdminToken: string;
    let campusId: string;
    const students = generateStudents(STUDENT_COUNT);
    const csvContent = buildCsvString(students);

    // ─── Step 1: Create a fresh campus with admin ────────────────────────────────

    test('Setup — login as super_admin and create a test campus', async ({ request }) => {
        adminToken = await loginAndGetToken(request, 'admin@gradlogic.com', 'admin123');

        const res = await request.post(`${API_BASE}/campuses`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: {
                name: CAMPUS_NAME,
                city: CAMPUS_CITY,
                state: CAMPUS_STATE,
                tier: 'Tier 1',
                adminName: CAMPUS_ADMIN_NAME,
                adminEmail: CAMPUS_ADMIN_EMAIL,
                adminPassword: CAMPUS_ADMIN_PASSWORD,
            },
        });

        expect(res.status()).toBe(201);
        const body = await res.json();
        campusId = body.data.id;
        console.log(`✓ Created campus: ${campusId} (${CAMPUS_NAME})`);
        console.log(`  Admin: ${CAMPUS_ADMIN_EMAIL}`);
    });

    // ─── Step 2: Login as campus admin ───────────────────────────────────────────

    test('Setup — login as the campus admin (college_admin)', async ({ request }) => {
        campusAdminToken = await loginAndGetToken(
            request,
            CAMPUS_ADMIN_EMAIL,
            CAMPUS_ADMIN_PASSWORD,
        );
        console.log(`✓ Logged in as campus admin`);
    });

    // ─── Step 3: Verify campus has 0 students initially ──────────────────────────

    test('Pre-check — campus should have 0 students initially', async ({ request }) => {
        const res = await request.get(`${API_BASE}/colleges/students`, {
            headers: { Authorization: `Bearer ${campusAdminToken}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);

        // Filter our test students only (they shouldn't exist yet)
        const ourStudents = body.data.filter((s: any) =>
            s.student_identifier?.startsWith(`STU-${TS}`)
        );
        expect(ourStudents.length).toBe(0);
        console.log(`✓ Campus has 0 test students initially (total students in campus: ${body.data.length})`);
    });

    // ─── Step 4: Generate and upload 50-student CSV ──────────────────────────────

    test(`Upload — should upload CSV with ${STUDENT_COUNT} students`, async ({ request }) => {
        console.log(`  CSV preview (first 3 rows):`);
        csvContent.split('\n').slice(0, 4).forEach((line) => console.log(`    ${line}`));

        // Upload as multipart form with the CSV file
        const res = await request.post(`${API_BASE}/colleges/add-students`, {
            headers: { Authorization: `Bearer ${campusAdminToken}` },
            multipart: {
                students_file: {
                    name: `students_batch_${TS}.csv`,
                    mimeType: 'text/csv',
                    buffer: Buffer.from(csvContent, 'utf-8'),
                },
            },
        });

        expect(res.ok(), `Upload failed: ${res.status()} ${await res.text()}`).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.total_received).toBe(STUDENT_COUNT);
        expect(body.data.created_count).toBe(STUDENT_COUNT);
        expect(body.data.skipped_count).toBe(0);
        expect(body.data.created.length).toBe(STUDENT_COUNT);
        expect(body.message).toContain(`${STUDENT_COUNT} student accounts created`);

        console.log(`✓ Upload successful!`);
        console.log(`  Total received: ${body.data.total_received}`);
        console.log(`  Created: ${body.data.created_count}`);
        console.log(`  Skipped: ${body.data.skipped_count}`);
        console.log(`  Sample student: ${body.data.created[0]?.email}`);
    });

    // ─── Step 5: Verify students were created ────────────────────────────────────

    test(`Verify — campus should now have ${STUDENT_COUNT} new students`, async ({ request }) => {
        const res = await request.get(`${API_BASE}/colleges/students`, {
            headers: { Authorization: `Bearer ${campusAdminToken}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);

        // Filter only our test students
        const ourStudents = body.data.filter((s: any) =>
            s.student_identifier?.startsWith(`STU-${TS}`)
        );
        expect(ourStudents.length).toBe(STUDENT_COUNT);

        // Spot-check a few students
        const firstStudent = ourStudents.find(
            (s: any) => s.student_identifier === `STU-${TS}-001`
        );
        expect(firstStudent).toBeTruthy();
        expect(firstStudent.name).toContain('Student 001');
        expect(firstStudent.phone_number).toBeTruthy();

        const lastStudent = ourStudents.find(
            (s: any) => s.student_identifier === `STU-${TS}-${String(STUDENT_COUNT).padStart(3, '0')}`
        );
        expect(lastStudent).toBeTruthy();

        console.log(`✓ Verified ${ourStudents.length} students exist in database`);
        console.log(`  First: ${firstStudent.student_identifier} — ${firstStudent.name}`);
        console.log(`  Last:  ${lastStudent.student_identifier} — ${lastStudent.name}`);
    });

    // ─── Step 6: Verify campus stats reflect new students ────────────────────────

    test('Verify — campus stats should reflect new student count', async ({ request }) => {
        const res = await request.get(`${API_BASE}/colleges/stats`, {
            headers: { Authorization: `Bearer ${campusAdminToken}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.total_students).toBeGreaterThanOrEqual(STUDENT_COUNT);

        console.log(`✓ Campus stats: ${body.data.total_students} total students`);
    });

    // ─── Step 7: Verify admin deep view shows updated student count ──────────────

    test('Verify — admin deep view should show updated student count', async ({ request }) => {
        const res = await request.get(`${API_BASE}/campuses/${campusId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.data.stats.student_count).toBeGreaterThanOrEqual(STUDENT_COUNT);

        console.log(`✓ Admin deep view: ${body.data.stats.student_count} students for ${body.data.name}`);
    });

    // ─── Step 8: Duplicate upload should skip all existing ───────────────────────

    test('Idempotency — re-uploading same CSV should skip all students', async ({ request }) => {
        const res = await request.post(`${API_BASE}/colleges/add-students`, {
            headers: { Authorization: `Bearer ${campusAdminToken}` },
            multipart: {
                students_file: {
                    name: `students_batch_${TS}_duplicate.csv`,
                    mimeType: 'text/csv',
                    buffer: Buffer.from(csvContent, 'utf-8'),
                },
            },
        });

        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.total_received).toBe(STUDENT_COUNT);
        expect(body.data.created_count).toBe(0);
        expect(body.data.skipped_count).toBe(STUDENT_COUNT);

        console.log(`✓ Duplicate upload: ${body.data.skipped_count} skipped, ${body.data.created_count} created`);
    });

    // ─── Step 9: Test JSON array upload (alternative method) ─────────────────────

    test('Upload — should also accept JSON array of students', async ({ request }) => {
        const jsonStudents = [
            {
                student_id: `JSON-STU-${TS}-001`,
                phone_number: `99${String(TS).slice(-8)}`,
                name: `JSON Student 001`,
                email: `json.student.${TS}.001@testcampus.com`,
            },
            {
                student_id: `JSON-STU-${TS}-002`,
                phone_number: `99${String(TS).slice(-7)}1`,
                name: `JSON Student 002`,
                email: `json.student.${TS}.002@testcampus.com`,
            },
        ];

        const res = await request.post(`${API_BASE}/colleges/add-students`, {
            headers: { Authorization: `Bearer ${campusAdminToken}` },
            data: { students: jsonStudents },
        });

        expect(res.ok(), `JSON upload failed: ${res.status()}`).toBeTruthy();
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.created_count).toBe(2);

        console.log(`✓ JSON upload: ${body.data.created_count} students created`);
    });

    // ─── Step 10: Test empty CSV should fail ─────────────────────────────────────

    test('Validation — empty CSV should return error', async ({ request }) => {
        const emptyCsv = 'student_id,phone_number\n';
        const res = await request.post(`${API_BASE}/colleges/add-students`, {
            headers: { Authorization: `Bearer ${campusAdminToken}` },
            multipart: {
                students_file: {
                    name: 'empty.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from(emptyCsv, 'utf-8'),
                },
            },
        });

        // Should fail because no data rows
        expect(res.ok()).toBe(false);
        console.log(`✓ Empty CSV rejected with status: ${res.status()}`);
    });

    // ─── Step 11: Test missing required columns should fail ──────────────────────

    test('Validation — CSV with missing required columns should fail', async ({ request }) => {
        const badCsv = 'name,email\nJohn,john@test.com\n';
        const res = await request.post(`${API_BASE}/colleges/add-students`, {
            headers: { Authorization: `Bearer ${campusAdminToken}` },
            multipart: {
                students_file: {
                    name: 'bad_columns.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from(badCsv, 'utf-8'),
                },
            },
        });

        expect(res.ok()).toBe(false);
        const body = await res.json();
        expect(body.error || body.message).toContain('student_id');

        console.log(`✓ Bad CSV rejected: ${body.error || body.message}`);
    });

    // ─── Step 12: Unauthenticated upload should fail ─────────────────────────────

    test('Auth — unauthenticated CSV upload should be rejected', async ({ request }) => {
        const res = await request.post(`${API_BASE}/colleges/add-students`, {
            multipart: {
                students_file: {
                    name: 'students.csv',
                    mimeType: 'text/csv',
                    buffer: Buffer.from('student_id,phone_number\nSTU001,9999999999\n', 'utf-8'),
                },
            },
        });

        expect(res.status()).toBe(401);
        console.log(`✓ 401 for unauthenticated upload`);
    });
});
