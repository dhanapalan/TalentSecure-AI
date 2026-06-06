import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import { mockCampusDrivesList, mockCampusDriveResults, mockDriveStudents } from '../helpers/api-mocks';
import { DRIVE_PUBLISHED, STUDENTS_LIST, VIOLATION } from '../helpers/test-data';

test.describe('Phase 2 – Campus Admin: Monitoring & Results (B16–B24)', () => {

    test.beforeEach(async ({ page }) => {
        await injectMockAuth(page, 'campusAdmin');
    });

    // ── B16: Live monitoring during active drive ───────────────────────────────────
    test('B16 – [+] Live monitoring dashboard shows real-time session data', async ({ page }) => {
        await mockCampusDrivesList(page, [DRIVE_PUBLISHED]);
        await page.route('**/api/campus-drives/drive-001**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        drive: DRIVE_PUBLISHED,
                        live_sessions: [
                            { student_id: 'stu-001', name: 'John Doe', status: 'IN_PROGRESS', current_question: 10, time_remaining: 3200 },
                            { student_id: 'stu-002', name: 'Jane Smith', status: 'IN_PROGRESS', current_question: 15, time_remaining: 2900 },
                        ],
                    },
                }),
            })
        );
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /live|monitoring/i }).click();
        await expect(page.getByText('John Doe')).toBeVisible();
        await expect(page.getByText('Jane Smith')).toBeVisible();
        await expect(page.getByText(/in.progress/i)).toBeVisible();
    });

    // ── B17: Tab switch violation ─────────────────────────────────────────────────
    test('B17 – [+] Student flagged for tab switching appears in violations list', async ({ page }) => {
        await page.route('**/api/cheating/violations**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [{ ...VIOLATION, student_name: 'John Doe', count: 3 }] }),
            })
        );
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /integrity|violations/i }).click();
        await expect(page.getByText('John Doe')).toBeVisible();
        await expect(page.getByText(/tab.switch|TAB_SWITCH/i)).toBeVisible();
    });

    // ── B18: Integrity score updates ─────────────────────────────────────────────
    test('B18 – [+] Student integrity score is visible in live monitoring', async ({ page }) => {
        await page.route('**/api/campus-drives/drive-001**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        drive: DRIVE_PUBLISHED,
                        live_sessions: [{ student_id: 'stu-001', name: 'John Doe', integrity_score: 78, status: 'IN_PROGRESS' }],
                    },
                }),
            })
        );
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /live|monitoring/i }).click();
        await expect(page.getByText(/78|integrity/i)).toBeVisible();
    });

    // ── B19: Face not detected alert ──────────────────────────────────────────────
    test('B19 – [+] Face-not-detected violation shows alert in monitoring', async ({ page }) => {
        await page.route('**/api/cheating/violations**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [{ ...VIOLATION, violation_type: 'FACE_NOT_DETECTED', student_name: 'Raj Kumar' }] }),
            })
        );
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /integrity|violations/i }).click();
        await expect(page.getByText(/face.*detected|FACE_NOT_DETECTED/i)).toBeVisible();
    });

    // ── B20: Results after drive completes ────────────────────────────────────────
    test('B20 – [+] Results show all students with score and pass/fail after drive ends', async ({ page }) => {
        await mockCampusDriveResults(page);
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /results/i }).click();
        for (const s of STUDENTS_LIST) {
            await expect(page.getByText(s.name)).toBeVisible();
        }
        await expect(page.getByText(/pass|fail/i).first()).toBeVisible();
    });

    // ── B21: Filter results by pass/fail ─────────────────────────────────────────
    test('B21 – [+] Filter results by "passed" shows only passing students', async ({ page }) => {
        await mockCampusDriveResults(page);
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /results/i }).click();
        await page.getByRole('button', { name: /filter|passed/i }).click();
        await page.getByRole('option', { name: /passed/i }).click();
        await expect(page.getByText(/fail/i)).not.toBeVisible();
    });

    // ── B22: Integrity report for flagged student ─────────────────────────────────
    test('B22 – [+] Integrity report for flagged student shows violation timeline', async ({ page }) => {
        await page.route('**/api/cheating/violations**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [VIOLATION, { ...VIOLATION, id: 'viol-002', violation_type: 'FACE_NOT_DETECTED' }] }),
            })
        );
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /integrity/i }).click();
        await page.getByText('John Doe').locator('..').getByRole('button', { name: /view|details/i }).click();
        await expect(page.getByText(/TAB_SWITCH|tab switch/i)).toBeVisible();
        await expect(page.getByText(/FACE_NOT_DETECTED|face/i)).toBeVisible();
    });

    // ── B23: Download results ─────────────────────────────────────────────────────
    test('B23 – [+] Download results CSV triggers file download', async ({ page }) => {
        await mockCampusDriveResults(page);
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /results/i }).click();
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: /download|export/i }).click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.csv|\.xlsx/i);
    });

    // ── B24: Integrity heatmap ────────────────────────────────────────────────────
    test('B24 – [+] Integrity heatmap shows risk score distribution', async ({ page }) => {
        await page.route('**/api/cheating/heatmap**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { low: 8, medium: 2, high: 1 } }),
            })
        );
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /integrity/i }).click();
        await expect(page.getByText(/heatmap|distribution/i)).toBeVisible();
    });
});
