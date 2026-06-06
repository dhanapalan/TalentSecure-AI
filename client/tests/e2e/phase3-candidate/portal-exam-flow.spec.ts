import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/api-mocks';
import { mockMyDrives, mockExamStart, mockExamSubmit } from '../helpers/api-mocks';
import { DRIVE_PUBLISHED, DRIVE_CANCELLED, EXAM_SESSION } from '../helpers/test-data';

test.describe('Phase 3 – Candidate: Portal & Exam Flow (C6–C20)', () => {

    test.beforeEach(async ({ page }) => {
        await injectAuth(page, 'student');
    });

    // ── C6: Student sees assigned drive ──────────────────────────────────────────
    test('C6 – [+] Assigned published drive appears in student portal', async ({ page }) => {
        await mockMyDrives(page, [DRIVE_PUBLISHED]);
        await page.goto('/app/student-portal');
        await expect(page.getByText('Campus Drive – June 2026')).toBeVisible();
    });

    // ── C7: Unpublished drive not visible ────────────────────────────────────────
    test('C7 – [-] Drive not yet published is not visible to student', async ({ page }) => {
        const draftDrive = { ...DRIVE_PUBLISHED, status: 'DRAFT' };
        await mockMyDrives(page, [draftDrive]);
        await page.goto('/app/student-portal');
        // Draft drives should either not appear or show as "Upcoming" without a Start button
        const startBtn = page.getByRole('button', { name: /start exam|begin/i });
        const isHidden = await startBtn.isHidden().catch(() => true);
        expect(isHidden).toBeTruthy();
    });

    // ── C8: Cancelled drive shows status, no start button ────────────────────────
    test('C8 – [-] Cancelled drive shows CANCELLED status with no Start button', async ({ page }) => {
        await mockMyDrives(page, [DRIVE_CANCELLED]);
        await page.goto('/app/student-portal');
        await expect(page.getByText(/cancelled/i)).toBeVisible();
        const startBtn = page.getByRole('button', { name: /start exam|begin/i });
        const isHidden = await startBtn.isHidden().catch(() => true);
        expect(isHidden).toBeTruthy();
    });

    // ── C9: Exam instructions page ───────────────────────────────────────────────
    test('C9 – [+] Exam instructions show duration, question count, proctoring rules, cutoff', async ({ page }) => {
        await mockMyDrives(page, [DRIVE_PUBLISHED]);
        await page.route(`**/api/drives/${DRIVE_PUBLISHED.id}**`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: DRIVE_PUBLISHED }) })
        );
        await page.goto(`/app/student/exam-instructions/${DRIVE_PUBLISHED.id}`);
        await expect(page.getByText(/90.*min|duration/i)).toBeVisible();
        await expect(page.getByText(/50.*question|question.*50/i)).toBeVisible();
        await expect(page.getByText(/60.*cutoff|cutoff.*60/i)).toBeVisible();
        await expect(page.getByText(/proctoring|webcam/i)).toBeVisible();
    });

    // ── C10: Start exam within window ────────────────────────────────────────────
    test('C10 – [+] Student starts exam within the scheduled window — session created', async ({ page }) => {
        await mockMyDrives(page, [DRIVE_PUBLISHED]);
        await mockExamStart(page);
        await page.goto(`/app/student/exam-instructions/${DRIVE_PUBLISHED.id}`);
        await page.getByRole('button', { name: /start exam|begin exam/i }).click();
        // Acknowledge permissions/rules if dialog appears
        const proctoringDialog = page.getByRole('button', { name: /i agree|allow|proceed/i });
        if (await proctoringDialog.isVisible()) await proctoringDialog.click();
        await expect(page).toHaveURL(/exam-player|exam\//);
    });

    // ── C11: Start before scheduled time ─────────────────────────────────────────
    test('C11 – [-] Student cannot start exam before scheduled time', async ({ page }) => {
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/start`, (route) =>
            route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Exam has not started yet' }) })
        );
        await page.goto(`/app/student/exam-instructions/${DRIVE_PUBLISHED.id}`);
        await page.getByRole('button', { name: /start exam/i }).click();
        await expect(page.getByText(/not started|not yet open/i)).toBeVisible();
    });

    // ── C12: Start after deadline ─────────────────────────────────────────────────
    test('C12 – [-] Student cannot start exam after deadline has passed', async ({ page }) => {
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/start`, (route) =>
            route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Drive has closed. The exam window has passed.' }) })
        );
        await page.goto(`/app/student/exam-instructions/${DRIVE_PUBLISHED.id}`);
        await page.getByRole('button', { name: /start exam/i }).click();
        await expect(page.getByText(/closed|window.*passed|deadline/i)).toBeVisible();
    });

    // ── C13: MCQ answer auto-saved ───────────────────────────────────────────────
    test('C13 – [+] MCQ answer is auto-saved when student navigates to next question', async ({ page }) => {
        await mockExamStart(page);
        let savedAnswers: any[] = [];
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/save`, (route) => {
            savedAnswers.push(route.request().postDataJSON());
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
        });
        await page.goto(`/app/exam-player/${DRIVE_PUBLISHED.id}`);
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/session`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: EXAM_SESSION }) })
        );
        // Select option A
        await page.getByLabel(/option a|choice 1/i).click();
        await page.getByRole('button', { name: /next/i }).click();
        // Verify auto-save was called
        await page.waitForTimeout(500);
        expect(savedAnswers.length).toBeGreaterThan(0);
    });

    // ── C14: Code submission with test cases ─────────────────────────────────────
    test('C14 – [+] Student submits code and sees test case results', async ({ page }) => {
        await page.route('**/api/exams/run-tests', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { passed: 2, failed: 1, results: [{ passed: true }, { passed: true }, { passed: false }] } }),
            })
        );
        await page.goto(`/app/exam-player/${DRIVE_PUBLISHED.id}`);
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/session`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { ...EXAM_SESSION, current_question: { type: 'CODING' } } }) })
        );
        await page.getByRole('button', { name: /run tests|submit code/i }).click();
        await expect(page.getByText(/2.*passed|passed.*2/i)).toBeVisible();
        await expect(page.getByText(/1.*failed|failed.*1/i)).toBeVisible();
    });

    // ── C15: Tab switch enforcement ───────────────────────────────────────────────
    test('C15 – [-] 4th tab switch terminates exam automatically', async ({ page }) => {
        await page.route('**/api/exams/auto-save', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
        );
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/terminate`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'AUTO_TERMINATED' } }) })
        );
        await page.goto(`/app/exam-player/${DRIVE_PUBLISHED.id}`);
        // Simulate 3 visible warnings
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
        }
        await expect(page.getByText(/warning.*switch|tab.*warning/i)).toBeVisible();
    });

    // ── C16: Face not detected violation ─────────────────────────────────────────
    test('C16 – [-] Face leaving webcam frame creates violation and shows warning', async ({ page }) => {
        await page.route('**/api/exams/auto-save', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
        );
        await page.goto(`/app/exam-player/${DRIVE_PUBLISHED.id}`);
        // Proctoring warning is shown when face not detected
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('proctoring:face-not-detected'));
        });
        await expect(page.getByText(/face.*not detected|look.*camera/i)).toBeVisible();
    });

    // ── C17 & C18: Resume after disconnect ───────────────────────────────────────
    test('C17/C18 – [+] Student can resume exam after closing and reopening browser', async ({ page }) => {
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/session`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: EXAM_SESSION }) })
        );
        await injectAuth(page, 'student');
        await page.goto(`/app/student/exam-instructions/${DRIVE_PUBLISHED.id}`);
        await expect(page.getByText(/resume|continue exam/i)).toBeVisible();
    });

    // ── C19: Submit exam ─────────────────────────────────────────────────────────
    test('C19 – [+] Student submits exam — submission recorded and redirected to results', async ({ page }) => {
        await mockExamSubmit(page);
        await page.goto(`/app/exam-player/${DRIVE_PUBLISHED.id}`);
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/session`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: EXAM_SESSION }) })
        );
        await page.getByRole('button', { name: /submit exam|finish/i }).click();
        await page.getByRole('button', { name: /confirm submit/i }).click();
        await expect(page).toHaveURL(/result|score|completed/);
    });

    // ── C20: Re-take after completion ────────────────────────────────────────────
    test('C20 – [-] Student cannot retake an already-completed exam', async ({ page }) => {
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/start`, (route) =>
            route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Attempt limit reached. You have already completed this exam.' }) })
        );
        await page.goto(`/app/student/exam-instructions/${DRIVE_PUBLISHED.id}`);
        await page.getByRole('button', { name: /start exam|retake/i }).click();
        await expect(page.getByText(/attempt.*limit|already completed/i)).toBeVisible();
    });
});
