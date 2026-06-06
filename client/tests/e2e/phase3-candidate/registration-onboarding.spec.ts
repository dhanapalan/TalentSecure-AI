import { test, expect } from '@playwright/test';
import { mockStudentRegister, injectAuth } from '../helpers/api-mocks';
import { USERS } from '../helpers/test-data';

test.describe('Phase 3 – Candidate: Registration & Onboarding (C1–C5)', () => {

    // ── C1: Successful registration ───────────────────────────────────────────────
    test('C1 – [+] Student self-registers with valid email and is redirected to onboarding', async ({ page }) => {
        await mockStudentRegister(page, true);
        await page.goto('/auth/register');
        await page.getByLabel(/name/i).fill('John Doe');
        await page.getByLabel(/email/i).fill('john.doe@student.mit.edu');
        await page.getByLabel(/password/i).first().fill('Student@123');
        await page.getByRole('button', { name: /register|sign up|create account/i }).click();
        await expect(page).toHaveURL(/onboarding|student-portal/);
    });

    // ── C2: Duplicate email registration ─────────────────────────────────────────
    test('C2 – [-] Register with already-used email shows error', async ({ page }) => {
        await mockStudentRegister(page, false);
        await page.goto('/auth/register');
        await page.getByLabel(/name/i).fill('John Doe');
        await page.getByLabel(/email/i).fill('john.doe@student.mit.edu');
        await page.getByLabel(/password/i).first().fill('Student@123');
        await page.getByRole('button', { name: /register|sign up|create account/i }).click();
        await expect(page.getByText(/already registered|email.*exists/i)).toBeVisible();
    });

    test('C2 – [-] Register without filling email field shows required validation', async ({ page }) => {
        await page.goto('/auth/register');
        await page.getByRole('button', { name: /register|sign up|create account/i }).click();
        await expect(page.getByText(/email.*required|required/i)).toBeVisible();
    });

    // ── C3: Complete onboarding ───────────────────────────────────────────────────
    test('C3 – [+] Student completes onboarding → profile_complete=true, redirected to portal', async ({ page }) => {
        await injectAuth(page, 'student');
        await page.route('**/api/students/me/onboarding', (route) => {
            if (route.request().method() === 'PUT')
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { is_profile_complete: true } }) });
            else route.continue();
        });
        await page.goto('/student-onboarding');
        // Step 1 – personal details
        await page.getByLabel(/phone/i).fill('+919876543210');
        await page.getByLabel(/date of birth|dob/i).fill('2002-05-15');
        await page.getByRole('button', { name: /next|continue/i }).click();
        // Step 2 – academic details
        await page.getByLabel(/degree/i).fill('B.E. CSE');
        await page.getByLabel(/cgpa/i).fill('8.5');
        await page.getByLabel(/passing year/i).fill('2026');
        await page.getByLabel(/roll number/i).fill('MIT001');
        await page.getByRole('button', { name: /submit|complete|finish/i }).click();
        await expect(page).toHaveURL(/student-portal|portal/);
    });

    // ── C4: Skip onboarding and access portal ─────────────────────────────────────
    test('C4 – [-] Student who skips onboarding is redirected back to onboarding wizard', async ({ page }) => {
        await injectAuth(page, 'student');
        // Simulate incomplete profile
        await page.route('**/api/auth/me', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { ...USERS.student, is_profile_complete: false } }),
            })
        );
        await page.goto('/app/student-portal');
        await expect(page).toHaveURL(/onboarding/);
    });

    // ── C5: Upload resume and photo ───────────────────────────────────────────────
    test('C5 – [+] Student uploads PDF resume and JPG photo during onboarding', async ({ page }) => {
        await injectAuth(page, 'student');
        await page.route('**/api/students/me/onboarding', (route) => {
            if (route.request().method() === 'PUT')
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { is_profile_complete: true } }) });
            else route.continue();
        });
        await page.goto('/student-onboarding');
        const resumeInput = page.locator('input[type="file"][accept*="pdf"]');
        const photoInput = page.locator('input[type="file"][accept*="image"]');
        if (await resumeInput.count() > 0) {
            await resumeInput.setInputFiles({ name: 'resume.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF') });
        }
        if (await photoInput.count() > 0) {
            await photoInput.setInputFiles({ name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('\xFF\xD8\xFF') });
        }
        await page.getByRole('button', { name: /submit|complete|save/i }).click();
        await expect(page.getByText(/uploaded|saved|success/i)).toBeVisible();
    });

    test('C5 – [-] Upload non-PDF file as resume shows format error', async ({ page }) => {
        await injectAuth(page, 'student');
        await page.goto('/student-onboarding');
        const resumeInput = page.locator('input[type="file"][accept*="pdf"]');
        if (await resumeInput.count() > 0) {
            await resumeInput.setInputFiles({ name: 'resume.txt', mimeType: 'text/plain', buffer: Buffer.from('text') });
            await expect(page.getByText(/pdf.*only|invalid.*format/i)).toBeVisible();
        }
    });
});
