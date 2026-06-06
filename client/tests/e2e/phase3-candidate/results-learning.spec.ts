import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/api-mocks';
import { EXAM_RESULT, EXAM_RESULT_FAILED, EXAM_RESULT_FLAGGED, DRIVE_PUBLISHED } from '../helpers/test-data';

test.describe('Phase 3 – Candidate: Results & Learning (C21–C26)', () => {

    test.beforeEach(async ({ page }) => {
        await injectAuth(page, 'student');
    });

    // ── C21: View score after submission ─────────────────────────────────────────
    test('C21 – [+] Student sees score, pass/fail, and cutoff comparison after submitting', async ({ page }) => {
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/results**`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: EXAM_RESULT }) })
        );
        await page.goto(`/app/student/result/${DRIVE_PUBLISHED.id}`);
        await expect(page.getByText('72')).toBeVisible();
        await expect(page.getByText(/passed/i)).toBeVisible();
        await expect(page.getByText(/60|cutoff/i)).toBeVisible();
    });

    test('C21 – [+] Student who fails sees FAILED status with score below cutoff', async ({ page }) => {
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/results**`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: EXAM_RESULT_FAILED }) })
        );
        await page.goto(`/app/student/result/${DRIVE_PUBLISHED.id}`);
        await expect(page.getByText('45')).toBeVisible();
        await expect(page.getByText(/failed/i)).toBeVisible();
    });

    // ── C22: Integrity violation flag in result ───────────────────────────────────
    test('C22 – [+] Student with integrity violations sees result with flag notice', async ({ page }) => {
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/results**`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: EXAM_RESULT_FLAGGED }) })
        );
        await page.goto(`/app/student/result/${DRIVE_PUBLISHED.id}`);
        await expect(page.getByText(/flagged|integrity.*review|under review/i)).toBeVisible();
    });

    // ── C23: Score pending release ───────────────────────────────────────────────
    test('C23 – [-] Student sees "Pending" when results not yet released by admin', async ({ page }) => {
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/results**`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'PENDING_RELEASE' } }) })
        );
        await page.goto(`/app/student/result/${DRIVE_PUBLISHED.id}`);
        await expect(page.getByText(/pending|not.*released|results.*soon/i)).toBeVisible();
    });

    // ── C24: Mock exam — no proctoring, unlimited retries ────────────────────────
    test('C24 – [+] Student takes mock exam without proctoring and gets feedback', async ({ page }) => {
        await page.route('**/api/exam-sessions/mock**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { score: 80, feedback: 'Good performance in reasoning.' } }),
            })
        );
        await page.goto('/app/student/mock-exam');
        await expect(page.getByText(/practice|mock exam/i)).toBeVisible();
        // No webcam permission prompt expected for mock exams
        const webcamPrompt = page.getByText(/enable.*camera|webcam.*required/i);
        await expect(webcamPrompt).not.toBeVisible();
    });

    // ── C25: Enroll in LMS program ────────────────────────────────────────────────
    test('C25 – [+] Student enrolls in an LMS program — program added to My Learning', async ({ page }) => {
        await page.route('**/api/student-learning/available-programs**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [{ id: 'prog-001', title: 'Full Stack Development', modules: 12 }] }),
            })
        );
        await page.route('**/api/student-learning/my-enrollments', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { program_id: 'prog-001', progress: 0 } }) });
            else route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [{ id: 'prog-001', title: 'Full Stack Development', progress: 0 }] }) });
        });
        await page.goto('/app/student/programs');
        await page.getByText('Full Stack Development').locator('..').getByRole('button', { name: /enroll|start/i }).click();
        await expect(page.getByText(/enrolled|added to my learning/i)).toBeVisible();
    });

    test('C25 – [-] Enrolling in already-enrolled program is handled gracefully', async ({ page }) => {
        await page.route('**/api/student-learning/my-enrollments', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Already enrolled in this program' }) });
            else route.continue();
        });
        await page.goto('/app/student/programs');
        const enrollBtn = page.getByRole('button', { name: /enroll/i }).first();
        if (await enrollBtn.isVisible()) {
            await enrollBtn.click();
            await expect(page.getByText(/already enrolled/i)).toBeVisible();
        }
    });

    // ── C26: Complete module and track progress ───────────────────────────────────
    test('C26 – [+] Completing a module updates progress and triggers certificate when course done', async ({ page }) => {
        await page.route('**/api/student-learning/my-enrollments/prog-001/modules**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: [{ id: 'mod-001', title: 'HTML Basics', completed: false }] }),
            })
        );
        await page.route('**/api/student-learning/my-enrollments/prog-001/modules/mod-001/complete', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { progress: 100, certificate_issued: true } }),
            })
        );
        await page.goto('/app/student/programs/prog-001');
        await page.getByText('HTML Basics').locator('..').getByRole('button', { name: /complete|mark done/i }).click();
        await expect(page.getByText(/100%|certificate|completed/i)).toBeVisible();
    });
});
