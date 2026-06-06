import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import { mockUsersList, mockUserCreate, mockUserCreateConflict, mockCampusList, mockCampusCreate } from '../helpers/api-mocks';
import { CAMPUS } from '../helpers/test-data';

test.describe('Phase 1 – Admin: User & Campus Management', () => {

    test.beforeEach(async ({ page }) => {
        await injectMockAuth(page, 'admin');
    });

    // ── A1: Create campus admin user ────────────────────────────────────────────
    test('A1 – [+] Create a campus admin user successfully', async ({ page }) => {
        await mockUsersList(page);
        await mockUserCreate(page);
        await page.goto('/app/admin/users');
        await page.getByRole('button', { name: /create user|add user/i }).click();
        await page.getByLabel(/name/i).fill('MIT Campus Admin');
        await page.getByLabel(/email/i).fill('campus@mit.edu');
        await page.getByLabel(/role/i).selectOption('college_admin');
        await page.getByRole('button', { name: /save|create/i }).click();
        await expect(page.getByText(/user created|success/i)).toBeVisible();
    });

    test('A1 – [-] Create user with duplicate email shows error', async ({ page }) => {
        await mockUsersList(page);
        await mockUserCreateConflict(page);
        await page.goto('/app/admin/users');
        await page.getByRole('button', { name: /create user|add user/i }).click();
        await page.getByLabel(/email/i).fill('campus@mit.edu');
        await page.getByLabel(/role/i).selectOption('college_admin');
        await page.getByRole('button', { name: /save|create/i }).click();
        await expect(page.getByText(/already exists|duplicate/i)).toBeVisible();
    });

    // ── A2: Campus staff creation ────────────────────────────────────────────────
    test('A2 – [+] Create college_staff user under a campus', async ({ page }) => {
        await mockUsersList(page);
        await mockUserCreate(page);
        await page.goto('/app/admin/users');
        await page.getByRole('button', { name: /create user|add user/i }).click();
        await page.getByLabel(/role/i).selectOption('college_staff');
        await page.getByRole('button', { name: /save|create/i }).click();
        await expect(page.getByText(/user created|success/i)).toBeVisible();
    });

    // ── A3: Create campus ────────────────────────────────────────────────────────
    test('A3 – [+] Create a campus with all required fields', async ({ page }) => {
        await mockCampusList(page);
        await mockCampusCreate(page);
        await page.goto('/app/hr/campuses');
        await page.getByRole('button', { name: /add campus|new campus/i }).click();
        await page.getByLabel(/college name|campus name/i).fill(CAMPUS.name);
        await page.getByLabel(/code/i).fill(CAMPUS.code);
        await page.getByLabel(/city/i).fill(CAMPUS.city);
        await page.getByRole('button', { name: /save|create/i }).click();
        await expect(page.getByText(CAMPUS.name)).toBeVisible();
    });

    test('A3 – [-] Create campus with missing required fields shows validation', async ({ page }) => {
        await mockCampusList(page);
        await page.goto('/app/hr/campuses');
        await page.getByRole('button', { name: /add campus|new campus/i }).click();
        await page.getByRole('button', { name: /save|create/i }).click();
        await expect(page.getByText(/required/i)).toBeVisible();
    });

    // ── A4: Deactivate a campus admin ────────────────────────────────────────────
    test('A4 – [+] Deactivate campus admin user', async ({ page }) => {
        await mockUsersList(page);
        await page.route('**/api/users/ca-001/status', (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
        );
        await page.goto('/app/admin/users');
        const row = page.getByText('MIT Campus Admin').locator('..');
        await row.getByRole('button', { name: /deactivate|disable/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/deactivated|inactive/i)).toBeVisible();
    });

    // ── A5: Delete campus with linked data ───────────────────────────────────────
    test('A5 – [-] Delete campus with active drives is blocked', async ({ page }) => {
        await mockCampusList(page);
        await page.route('**/api/campuses/col-001', (route) => {
            if (route.request().method() === 'DELETE')
                route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Campus has active drives' }) });
            else route.continue();
        });
        await page.goto('/app/hr/campuses');
        await page.getByText('MIT College of Engineering').locator('..').getByRole('button', { name: /delete/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/active drives|cannot delete/i)).toBeVisible();
    });
});
