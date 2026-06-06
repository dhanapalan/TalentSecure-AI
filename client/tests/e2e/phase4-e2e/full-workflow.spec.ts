import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/api-mocks';
import {
    mockDriveCreate, mockDriveDetail, mockDrivePoolGenerate, mockDrivePoolApprove,
    mockDrivePublish, mockCampusList, mockCampusDrivesList, mockCampusStudents,
    mockExamStart, mockExamSubmit, mockCampusDriveResults,
} from '../helpers/api-mocks';
import { DRIVE, DRIVE_PUBLISHED, STUDENTS_LIST, EXAM_RESULT } from '../helpers/test-data';

// ── E1: Full happy-path end-to-end ────────────────────────────────────────────
test.describe('Phase 4 – E2E: Full Admin → Campus Admin → Student Workflow (E1)', () => {

    test('E1 – [+] Admin creates drive, campus admin enrolls students, student takes exam, admin views results', async ({ browser }) => {
        // ── STEP 1: Admin creates and publishes drive ─────────────────────────
        const adminCtx = await browser.newContext();
        const adminPage = await adminCtx.newPage();
        await injectAuth(adminPage, 'admin');
        await mockDriveCreate(adminPage);
        await mockDrivePoolGenerate(adminPage, 'success');
        await mockDrivePoolApprove(adminPage);
        await mockDrivePublish(adminPage);
        await mockCampusList(adminPage);

        await adminPage.goto('/app/drives');
        await adminPage.getByRole('button', { name: /create drive/i }).click();
        await adminPage.getByLabel(/drive name/i).fill('E2E Test Drive');
        await adminPage.getByLabel(/assessment rule/i).selectOption('rule-001');
        await adminPage.getByRole('button', { name: /create/i }).click();
        await expect(adminPage.getByText(/draft|created/i)).toBeVisible();

        // Assign to campus
        await adminPage.route(`**/api/drives/${DRIVE.id}/assignments`, (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) });
            else route.continue();
        });

        // Publish
        await mockDriveDetail(adminPage, DRIVE);
        await adminPage.goto(`/app/drives/${DRIVE.id}`);
        await adminPage.getByRole('button', { name: /approve pool/i }).click();
        await adminPage.getByRole('button', { name: /confirm/i }).click();
        await adminPage.getByRole('button', { name: /publish/i }).click();
        await adminPage.getByRole('button', { name: /confirm/i }).click();
        await expect(adminPage.getByText(/published|scheduled/i)).toBeVisible();
        await adminCtx.close();

        // ── STEP 2: Campus Admin enrolls students ─────────────────────────────
        const campusCtx = await browser.newContext();
        const campusPage = await campusCtx.newPage();
        await injectAuth(campusPage, 'campusAdmin');
        await mockCampusDrivesList(campusPage, [DRIVE_PUBLISHED]);
        await mockCampusStudents(campusPage);
        await campusPage.route('**/api/drives/drive-001/students/campus', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { enrolled: 3 } }) });
            else route.continue();
        });

        await campusPage.goto('/app/college/drives');
        await expect(campusPage.getByText('Campus Drive – June 2026')).toBeVisible();
        await campusPage.getByText('Campus Drive – June 2026').click();
        await campusPage.getByRole('button', { name: /enroll all|add all/i }).click();
        await campusPage.getByRole('button', { name: /confirm/i }).click();
        await expect(campusPage.getByText(/enrolled|3.*student/i)).toBeVisible();
        await campusCtx.close();

        // ── STEP 3: Student takes exam ────────────────────────────────────────
        const studentCtx = await browser.newContext();
        const studentPage = await studentCtx.newPage();
        await injectAuth(studentPage, 'student');
        await mockExamStart(studentPage);
        await mockExamSubmit(studentPage);
        await studentPage.route('**/api/exam-sessions/my-drives**', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [DRIVE_PUBLISHED] }) })
        );

        await studentPage.goto('/app/student-portal');
        await expect(studentPage.getByText('Campus Drive – June 2026')).toBeVisible();
        await studentPage.getByRole('button', { name: /start|view|take exam/i }).first().click();
        await expect(studentPage).toHaveURL(/instructions|exam/);
        await studentCtx.close();

        // ── STEP 4: Admin views results ───────────────────────────────────────
        const adminCtx2 = await browser.newContext();
        const adminPage2 = await adminCtx2.newPage();
        await injectAuth(adminPage2, 'admin');
        await adminPage2.route(`**/api/drives/${DRIVE.id}/students**`, (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: STUDENTS_LIST.map((s) => ({ ...s, final_score: 72, passed: true })) }),
            })
        );
        await adminPage2.goto(`/app/drives/${DRIVE.id}`);
        await adminPage2.getByRole('tab', { name: /students|results/i }).click();
        await expect(adminPage2.getByText('John Doe')).toBeVisible();
        await adminCtx2.close();
    });
});

// ── E2: Bulk import → publish → notify ────────────────────────────────────────
test.describe('Phase 4 – E2E: Bulk Import → Publish → Student Notification (E2)', () => {

    test('E2 – [+] Campus admin bulk imports, admin publishes, students see exam', async ({ browser }) => {
        const campusCtx = await browser.newContext();
        const campusPage = await campusCtx.newPage();
        await injectAuth(campusPage, 'campusAdmin');

        await campusPage.route('**/api/colleges/add-students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { imported: 50, failed: 0 } }) });
            else route.continue();
        });

        await campusPage.goto('/app/students/bulk-import');
        const fileInput = campusPage.locator('input[type="file"]');
        await fileInput.setInputFiles({ name: 'students.csv', mimeType: 'text/csv', buffer: Buffer.from('name,email,roll_number\nJohn,john@test.com,001') });
        await campusPage.getByRole('button', { name: /upload|import/i }).last().click();
        await expect(campusPage.getByText(/50.*imported/i)).toBeVisible();
        await campusCtx.close();

        const studentCtx = await browser.newContext();
        const studentPage = await studentCtx.newPage();
        await injectAuth(studentPage, 'student');
        await studentPage.route('**/api/exam-sessions/my-drives**', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [DRIVE_PUBLISHED] }) })
        );
        await studentPage.goto('/app/student-portal');
        await expect(studentPage.getByText('Campus Drive – June 2026')).toBeVisible();
        await studentCtx.close();
    });
});

// ── E3: Cheating → review → mark invalid ──────────────────────────────────────
test.describe('Phase 4 – E2E: Cheating Detection → Admin Review (E3)', () => {

    test('E3 – [+] Flagged student reviewed by admin, exam marked invalid', async ({ browser }) => {
        const adminCtx = await browser.newContext();
        const adminPage = await adminCtx.newPage();
        await injectAuth(adminPage, 'admin');

        await adminPage.route('**/api/cheating/violations**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [{ student_id: 'stu-001', name: 'John Doe', risk_score: 80, status: 'PENDING' }] }),
            })
        );
        await adminPage.route('**/api/exam-incidents/*/confirm', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'CONFIRMED', exam_invalid: true } }) })
        );

        await adminPage.goto(`/app/drives/${DRIVE.id}`);
        await adminPage.getByRole('tab', { name: /integrity|violations/i }).click();
        await expect(adminPage.getByText('John Doe')).toBeVisible();
        await adminPage.getByText('John Doe').locator('..').getByRole('button', { name: /review|view/i }).click();
        await adminPage.getByRole('button', { name: /confirm violation/i }).click();
        await expect(adminPage.getByText(/confirmed|invalid/i)).toBeVisible();
        await adminCtx.close();
    });
});

// ── E4: Shortlist → interview → offer ─────────────────────────────────────────
test.describe('Phase 4 – E2E: Shortlist → Interview → Offer (E4)', () => {

    test('E4 – [+] Admin shortlists student, schedules interview, releases offer', async ({ page }) => {
        await injectAuth(page, 'admin');

        await page.route(`**/api/drives/${DRIVE.id}/students**`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [{ ...STUDENTS_LIST[0], final_score: 85, passed: true }] }) })
        );
        await page.route(`**/api/drives/${DRIVE.id}/students/stu-001/shortlist`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
        );
        await page.route(`**/api/drives/${DRIVE.id}/students/stu-001/interview`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
        );
        await page.route(`**/api/drives/${DRIVE.id}/students/stu-001/offer`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
        );

        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('tab', { name: /students|candidates/i }).click();
        await page.getByText('John Doe').locator('..').getByRole('button', { name: /shortlist/i }).click();
        await expect(page.getByText(/shortlisted/i)).toBeVisible();

        await page.getByText('John Doe').locator('..').getByRole('button', { name: /interview/i }).click();
        await page.getByRole('button', { name: /confirm|schedule/i }).click();
        await expect(page.getByText(/interview.*scheduled/i)).toBeVisible();

        await page.getByText('John Doe').locator('..').getByRole('button', { name: /offer/i }).click();
        await page.getByRole('button', { name: /release|confirm/i }).click();
        await expect(page.getByText(/offer.*released|offered/i)).toBeVisible();
    });
});

// ── E5: Multi-campus leaderboard ──────────────────────────────────────────────
test.describe('Phase 4 – E2E: Multi-Campus Drive → Combined Leaderboard (E5)', () => {

    test('E5 – [+] Drive assigned to 2 campuses — admin sees combined leaderboard', async ({ page }) => {
        await injectAuth(page, 'admin');

        const combined = [
            ...STUDENTS_LIST.map((s, i) => ({ ...s, final_score: 80 - i * 5, college_name: 'MIT College' })),
            { id: 'stu-101', name: 'Priya R', final_score: 88, college_name: 'Anna University', passed: true },
        ];
        await page.route(`**/api/drives/${DRIVE.id}/students**`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: combined }) })
        );

        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('tab', { name: /students|leaderboard/i }).click();
        await expect(page.getByText('MIT College')).toBeVisible();
        await expect(page.getByText('Anna University')).toBeVisible();
        await expect(page.getByText('Priya R')).toBeVisible();
    });
});
