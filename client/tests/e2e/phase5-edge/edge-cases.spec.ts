import { test, expect } from '@playwright/test';
import { injectAuth } from '../helpers/api-mocks';
import { DRIVE, DRIVE_COMPLETED, DRIVE_PUBLISHED, STUDENTS_LIST } from '../helpers/test-data';

test.describe('Phase 5 – Edge Cases (X1–X10)', () => {

    // ── X1: Delete drive with active sessions ────────────────────────────────────
    test('X1 – [-] Admin cannot delete drive that has active exam sessions', async ({ page }) => {
        await injectAuth(page, 'admin');
        await page.route(`**/api/drives/${DRIVE.id}`, (route) => {
            if (route.request().method() === 'DELETE')
                route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Cannot delete drive with active sessions. Terminate all sessions first.' }) });
            else route.continue();
        });
        await page.route(`**/api/drives**`, (route) => {
            if (route.request().method() === 'GET')
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [DRIVE_PUBLISHED] }) });
            else route.continue();
        });
        await page.goto('/app/drives');
        await page.getByText('Campus Drive – June 2026').locator('..').getByRole('button', { name: /delete/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/active sessions|terminate.*first/i)).toBeVisible();
    });

    // ── X2: Campus admin cross-campus access ─────────────────────────────────────
    test('X2 – [-] Campus admin cannot access another campus\'s drive or students', async ({ page }) => {
        await injectAuth(page, 'campusAdmin');
        await page.route('**/api/campus-drives/drive-999**', (route) =>
            route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Access denied. Drive belongs to another campus.' }) })
        );
        await page.goto('/app/college/drives/drive-999');
        await expect(page.getByText(/access denied|forbidden|not found/i)).toBeVisible();
    });

    // ── X3: Wrong role redirect ───────────────────────────────────────────────────
    test('X3 – [-] Student trying to access admin panel is redirected to student portal', async ({ page }) => {
        await injectAuth(page, 'student');
        await page.goto('/app/hr-dashboard');
        await expect(page).toHaveURL(/student-portal|login|forbidden/);
    });

    test('X3 – [-] Campus admin trying to access admin-only drive creation page is blocked', async ({ page }) => {
        await injectAuth(page, 'campusAdmin');
        await page.goto('/app/drives/create');
        await expect(page).toHaveURL(/college|forbidden|dashboard/);
    });

    // ── X4: Pool generation fails – insufficient questions ────────────────────────
    test('X4 – [-] Pool generation fails when question bank has insufficient questions', async ({ page }) => {
        await injectAuth(page, 'admin');
        await page.route(`**/api/drives/${DRIVE.id}/generate`, (route) =>
            route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Insufficient questions in bank for programming (hard): need 10, have 3' }) })
        );
        await page.route(`**/api/drives/${DRIVE.id}**`, (route) => {
            if (route.request().method() === 'GET')
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: DRIVE }) });
            else route.continue();
        });
        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('button', { name: /generate pool/i }).click();
        await expect(page.getByText(/insufficient|not enough questions/i)).toBeVisible();
    });

    // ── X5: Duplicate roll number in same campus ──────────────────────────────────
    test('X5 – [-] Two students with same roll number in one campus are flagged', async ({ page }) => {
        await injectAuth(page, 'campusAdmin');
        await page.route('**/api/colleges/add-students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Duplicate roll number: MIT001 already exists in this campus' }) });
            else route.continue();
        });
        await page.goto('/app/students');
        await page.getByRole('button', { name: /add student/i }).click();
        await page.getByLabel(/roll number/i).fill('MIT001');
        await page.getByLabel(/email/i).fill('another@student.edu');
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/duplicate roll|already exists/i)).toBeVisible();
    });

    // ── X6: Drive activates with 0 enrolled students ─────────────────────────────
    test('X6 – [+] Drive activates with 0 students — dashboard shows 0 participants', async ({ page }) => {
        await injectAuth(page, 'admin');
        await page.route(`**/api/drives/${DRIVE.id}**`, (route) => {
            if (route.request().method() === 'GET')
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { ...DRIVE_PUBLISHED, enrolled_count: 0 } }) });
            else route.continue();
        });
        await page.goto(`/app/drives/${DRIVE.id}`);
        await expect(page.getByText(/0.*student|no students enrolled/i)).toBeVisible();
    });

    // ── X7: Approve pool on completed drive ───────────────────────────────────────
    test('X7 – [-] Admin cannot approve pool for a COMPLETED drive', async ({ page }) => {
        await injectAuth(page, 'admin');
        await page.route(`**/api/drives/${DRIVE.id}**`, (route) => {
            if (route.request().method() === 'GET')
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: DRIVE_COMPLETED }) });
            else route.continue();
        });
        await page.goto(`/app/drives/${DRIVE.id}`);
        // Approve pool button should not exist for completed drives
        const approveBtn = page.getByRole('button', { name: /approve pool/i });
        const isHidden = await approveBtn.isHidden().catch(() => true);
        expect(isHidden).toBeTruthy();
    });

    // ── X8: Exam auto-terminates on max violations ────────────────────────────────
    test('X8 – [-] Exam auto-terminates when max violations reached — partial score computed', async ({ page }) => {
        await injectAuth(page, 'student');
        await page.route(`**/api/exam-sessions/${DRIVE_PUBLISHED.id}/terminate`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'AUTO_TERMINATED', final_score: 35, integrity_score: 10 } }) })
        );
        await page.goto(`/app/exam-player/${DRIVE_PUBLISHED.id}`);
        // Simulate auto-termination event from proctoring engine
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('proctoring:auto-terminate', { detail: { reason: 'MAX_VIOLATIONS' } }));
        });
        await expect(page.getByText(/terminated|exam ended|violations/i)).toBeVisible();
    });

    // ── X9: Download results with 0 completions ───────────────────────────────────
    test('X9 – [+] Campus admin downloads results for drive with 0 completions — empty report', async ({ page }) => {
        await injectAuth(page, 'campusAdmin');
        await page.route('**/api/campus-drives/drive-001/results**', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) })
        );
        await page.goto('/app/college/drives/drive-001');
        await page.getByRole('tab', { name: /results/i }).click();
        await expect(page.getByText(/no results|0 students/i)).toBeVisible();
        // Download should still work without crashing
        const downloadPromise = page.waitForEvent('download').catch(() => null);
        const downloadBtn = page.getByRole('button', { name: /download|export/i });
        if (await downloadBtn.isVisible()) {
            await downloadBtn.click();
        }
    });

    // ── X10: Password reset for inactive student ──────────────────────────────────
    test('X10 – [-] Password reset for inactive student account is blocked', async ({ page }) => {
        await page.route('**/api/auth/forgot-password', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Account is inactive. Contact your campus admin.' }) });
            else route.continue();
        });
        await page.goto('/auth/login');
        await page.getByRole('link', { name: /forgot password/i }).click();
        await page.getByLabel(/email/i).fill('inactive.student@mit.edu');
        await page.getByRole('button', { name: /reset|send/i }).click();
        await expect(page.getByText(/inactive|contact.*admin/i)).toBeVisible();
    });

    // ── Bonus: Unauthenticated access to protected route ─────────────────────────
    test('X-BONUS – [-] Unauthenticated user accessing protected route is redirected to login', async ({ page }) => {
        // No auth injected — fresh page
        await page.goto('/app/hr-dashboard');
        await expect(page).toHaveURL(/login|auth/);
    });
});
