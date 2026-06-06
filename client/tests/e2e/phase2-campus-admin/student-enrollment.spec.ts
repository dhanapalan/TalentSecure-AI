import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import { mockCampusDrivesList, mockDriveStudents, mockCampusStudents } from '../helpers/api-mocks';
import { DRIVE_PUBLISHED, DRIVE_COMPLETED, STUDENTS_LIST } from '../helpers/test-data';

test.describe('Phase 2 – Campus Admin: Student Enrollment (B10–B15)', () => {

    test.beforeEach(async ({ page }) => {
        await injectMockAuth(page, 'campusAdmin');
    });

    // ── B10: Enroll all students ──────────────────────────────────────────────────
    test('B10 – [+] Enroll all campus students into a drive', async ({ page }) => {
        await mockCampusDrivesList(page, [DRIVE_PUBLISHED]);
        await mockCampusStudents(page);
        await page.route('**/api/drives/drive-001/students/campus', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { enrolled: 3 } }) });
            else route.continue();
        });
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('button', { name: /enroll all|add all students/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/enrolled|3.*student/i)).toBeVisible();
    });

    // ── B11: Enroll filtered subset ───────────────────────────────────────────────
    test('B11 – [+] Enroll filtered students (by branch/CGPA)', async ({ page }) => {
        await mockCampusDrivesList(page, [DRIVE_PUBLISHED]);
        await mockCampusStudents(page);
        await page.route('**/api/drives/drive-001/students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { enrolled: 2 } }) });
            else route.continue();
        });
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('button', { name: /add students|enroll students/i }).click();
        // Filter by CGPA
        await page.getByLabel(/min cgpa/i).fill('8.5');
        await page.getByRole('button', { name: /apply filter/i }).click();
        await page.getByRole('checkbox', { name: /select all/i }).check();
        await page.getByRole('button', { name: /enroll|add/i }).click();
        await expect(page.getByText(/enrolled|added/i)).toBeVisible();
    });

    // ── B12: Enroll student who already completed drive ───────────────────────────
    test('B12 – [-] Enrolling student who already completed drive is blocked', async ({ page }) => {
        await mockCampusDrivesList(page, [DRIVE_PUBLISHED]);
        await page.route('**/api/drives/drive-001/students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Student already completed this drive' }) });
            else route.continue();
        });
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('button', { name: /add students|enroll students/i }).click();
        await page.getByRole('checkbox').first().check();
        await page.getByRole('button', { name: /enroll|add/i }).click();
        await expect(page.getByText(/already completed/i)).toBeVisible();
    });

    // ── B13: Remove student from drive ────────────────────────────────────────────
    test('B13 – [+] Remove enrolled student from drive before exam', async ({ page }) => {
        await mockCampusDrivesList(page, [DRIVE_PUBLISHED]);
        await mockDriveStudents(page);
        await page.route('**/api/drives/drive-001/students/stu-001', (route) => {
            if (route.request().method() === 'DELETE')
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
            else route.continue();
        });
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /students/i }).click();
        await page.getByText('John Doe').locator('..').getByRole('button', { name: /remove/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/removed|unenrolled/i)).toBeVisible();
    });

    // ── B14: Enroll after publish ─────────────────────────────────────────────────
    test('B14 – [+] Enroll students after drive is published — they can take the exam', async ({ page }) => {
        await mockCampusDrivesList(page, [DRIVE_PUBLISHED]);
        await page.route('**/api/drives/drive-001/students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { enrolled: 1 } }) });
            else route.continue();
        });
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('button', { name: /add students|enroll/i }).click();
        await page.getByRole('checkbox').first().check();
        await page.getByRole('button', { name: /enroll|add/i }).click();
        await expect(page.getByText(/enrolled|added/i)).toBeVisible();
    });

    // ── B15: Enroll after drive COMPLETED ─────────────────────────────────────────
    test('B15 – [-] Enroll students after drive is COMPLETED is blocked', async ({ page }) => {
        await mockCampusDrivesList(page, [DRIVE_COMPLETED]);
        await page.route('**/api/drives/drive-001/students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Drive is closed. Cannot enroll new students.' }) });
            else route.continue();
        });
        await page.goto('/app/college/drives/drive-001');
        // Enroll button should be hidden or disabled for completed drive
        const enrollBtn = page.getByRole('button', { name: /add students|enroll/i });
        const isDisabled = await enrollBtn.isDisabled().catch(() => true);
        const isHidden = await enrollBtn.isHidden().catch(() => true);
        expect(isDisabled || isHidden).toBeTruthy();
    });
});
