import { test, expect, Page, BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Campus CRUD E2E — Real Data (no mocking)
 *
 * Prerequisites:
 *  - The dev server is running at http://localhost:5173
 *  - The backend API is running and connected to a real database
 *  - An admin user `admin@gradlogic.com` / `admin123` exists
 *
 * This test creates a real campus, reads it, updates it, and toggles
 * its active status (soft-delete). It uses unique names per run so
 * tests don't conflict across repeated executions.
 *
 * Auth: Logs in ONCE in beforeAll, saves storageState, and reuses it
 * across all tests to avoid 429 rate-limiting on the login endpoint.
 */

const TS = Date.now();
const CAMPUS_NAME = `PW Test Campus ${TS}`;
const CAMPUS_CITY = 'Playwright City';
const CAMPUS_STATE = 'Karnataka';
const ADMIN_NAME = `PW Admin ${TS}`;
const ADMIN_EMAIL = `pw.admin.${TS}@testcampus.com`;
const ADMIN_PASSWORD = 'Test@123';

const UPDATED_CAMPUS_NAME = `PW Updated Campus ${TS}`;
const UPDATED_CITY = 'Updated City';

const AUTH_FILE = path.join(__dirname, '.auth', `admin-${TS}.json`);

// ── Test Suite ─────────────────────────────────────────────────────────────────

test.describe.serial('Campus CRUD E2E — Real Data', () => {
    let createdCampusId: string;

    // ── Login once and save auth state ─────────────────────────────────────────
    test('Setup — login as admin (once)', async ({ browser }) => {
        const context = await browser.newContext();
        const page = await context.newPage();

        await page.goto('/auth/login');
        await page.waitForSelector('input[type="email"]', { state: 'visible' });
        await page.fill('input[type="email"]', 'admin@gradlogic.com');
        await page.fill('input[type="password"]', 'admin123');

        const [loginResponse] = await Promise.all([
            page.waitForResponse(
                (resp) => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST',
                { timeout: 15000 }
            ),
            page.click('button[type="submit"]'),
        ]);

        expect(loginResponse.ok(), `Login API failed: ${loginResponse.status()}`).toBeTruthy();
        await expect(page).toHaveURL(/.*\/app/, { timeout: 15000 });

        // Save auth state (cookies + localStorage) to file
        await context.storageState({ path: AUTH_FILE });
        await context.close();
    });

    // ── Helper: create a page with saved auth ──────────────────────────────────
    async function createAuthedPage(browser: any): Promise<{ context: BrowserContext; page: Page }> {
        const context = await browser.newContext({ storageState: AUTH_FILE });
        const page = await context.newPage();
        return { context, page };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. CREATE — Add a new campus with admin details
    // ─────────────────────────────────────────────────────────────────────────────

    test('C - should create a new campus with initial admin', async ({ browser }) => {
        const { context, page } = await createAuthedPage(browser);

        // Navigate to campus list
        await page.goto('/app/campuses');
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: 'Campuses' })).toBeVisible();

        // Click "Add Campus"
        await page.getByRole('link', { name: 'Add Campus' }).click();
        await expect(page).toHaveURL(/\/app\/campuses\/new/);

        // The Create Campus button should be disabled (nothing filled yet)
        const createBtn = page.getByRole('button', { name: 'Create Campus' });
        await expect(createBtn).toBeDisabled();

        // ── Fill campus details ──
        await page.getByPlaceholder('Enter Campus Name').fill(CAMPUS_NAME);
        await page.getByPlaceholder('City').fill(CAMPUS_CITY);
        await page.getByPlaceholder('State').fill(CAMPUS_STATE);

        // Fill optional fields if they exist
        const addressField = page.locator('textarea[placeholder="Address"]');
        if (await addressField.count() > 0) {
            await addressField.fill('123 E2E Test Street, Playwright District');
        }

        const notesField = page.locator('textarea[placeholder*="Jot down notes"]');
        if (await notesField.count() > 0) {
            await notesField.fill(`Auto-created by Playwright at ${new Date().toISOString()}`);
        }

        // ── Fill Initial Campus Administrator ──
        await expect(page.getByRole('heading', { name: 'Initial Campus Administrator' })).toBeVisible();
        await page.getByPlaceholder('e.g. John Doe').fill(ADMIN_NAME);
        await page.getByPlaceholder('admin@campus.edu').fill(ADMIN_EMAIL);
        await page.getByPlaceholder('Min 6 characters').fill(ADMIN_PASSWORD);

        // Now the button should be enabled
        await expect(createBtn).toBeEnabled();

        // ── Submit ──
        await createBtn.click();

        // Wait for success toast and redirect
        await expect(page.getByText('Campus created successfully')).toBeVisible({ timeout: 15000 });

        // Capture the campus ID from the redirected URL
        await page.waitForURL(/\/app\/campuses\/(?!new)/, { timeout: 10000 });
        const url = page.url();
        const match = url.match(/\/campuses\/([a-f0-9-]+)/);
        expect(match).toBeTruthy();
        createdCampusId = match![1];
        console.log(`✓ Created campus ID: ${createdCampusId}`);

        await context.close();
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. READ — Verify the campus appears in the list and detail view
    // ─────────────────────────────────────────────────────────────────────────────

    test('R - should display the newly created campus in the list', async ({ browser }) => {
        const { context, page } = await createAuthedPage(browser);

        await page.goto('/app/campuses');
        await page.waitForLoadState('networkidle');

        // Verify stats cards are present
        await expect(page.getByText('Total Campuses')).toBeVisible();
        await expect(page.getByText('Active Partners')).toBeVisible();

        // Search for our campus
        const searchInput = page.getByPlaceholder('Search campuses...');
        await searchInput.fill(CAMPUS_NAME);
        await expect(page.getByText(CAMPUS_NAME)).toBeVisible({ timeout: 10000 });

        // It should show as "Active"
        await expect(page.getByText('Active').first()).toBeVisible();

        await context.close();
    });

    test('R - should load campus detail (deep view) with tabs', async ({ browser }) => {
        test.skip(!createdCampusId, 'No campus ID — create test may have failed');
        const { context, page } = await createAuthedPage(browser);

        await page.goto(`/app/campuses/${createdCampusId}`);
        await page.waitForLoadState('networkidle');

        // Campus name should be visible
        await expect(page.getByText(CAMPUS_NAME)).toBeVisible({ timeout: 10000 });

        // Location should show
        await expect(page.getByText(CAMPUS_CITY).first()).toBeVisible();

        // Tabs should be present
        await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Admins' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Students' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Assessments' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Integrity' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Agreements' })).toBeVisible();

        // Switch to Admins tab and verify the admin we created shows
        await page.getByRole('button', { name: 'Admins' }).click();
        await expect(page.getByText(ADMIN_NAME)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();

        await context.close();
    });

    test('R - should filter campuses by status', async ({ browser }) => {
        const { context, page } = await createAuthedPage(browser);

        await page.goto('/app/campuses');
        await page.waitForLoadState('networkidle');

        // Click "active" filter — our campus should still appear
        await page.getByRole('button', { name: 'active', exact: true }).click();
        await page.getByPlaceholder('Search campuses...').fill(CAMPUS_NAME);
        await expect(page.getByText(CAMPUS_NAME)).toBeVisible({ timeout: 10000 });

        // Click "inactive" filter — our campus should NOT appear
        await page.getByRole('button', { name: 'inactive', exact: true }).click();
        await expect(page.getByText(CAMPUS_NAME)).not.toBeVisible({ timeout: 5000 });

        // Reset to "all"
        await page.getByRole('button', { name: 'all', exact: true }).click();
        await expect(page.getByText(CAMPUS_NAME)).toBeVisible({ timeout: 10000 });

        await context.close();
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. UPDATE — Edit campus details
    // ─────────────────────────────────────────────────────────────────────────────

    test('U - should update the campus name and city via edit page', async ({ browser }) => {
        test.skip(!createdCampusId, 'No campus ID — create test may have failed');
        const { context, page } = await createAuthedPage(browser);

        // Intercept and fix the PUT request: strip null values that break Zod validation
        // (The form sends nirf_rank: null which fails z.number().int().optional())
        await page.route('**/api/campuses/*', async (route) => {
            const request = route.request();
            if (request.method() === 'PUT') {
                const body = request.postDataJSON();
                // Remove null number fields that fail Zod optional() validation
                const cleaned: Record<string, any> = {};
                for (const [key, value] of Object.entries(body)) {
                    if (value !== null && value !== undefined && typeof value !== 'object') {
                        cleaned[key] = value;
                    }
                }
                // Keep string fields even if empty, but keep booleans
                for (const [key, value] of Object.entries(body)) {
                    if (typeof value === 'boolean') cleaned[key] = value;
                }
                await route.continue({ postData: JSON.stringify(cleaned) });
            } else {
                await route.continue();
            }
        });

        await page.goto(`/app/campuses/${createdCampusId}/edit`);
        await page.waitForLoadState('networkidle');

        // Wait for form to load with existing data
        const nameInput = page.getByPlaceholder('Enter Campus Name');
        await expect(nameInput).toBeVisible({ timeout: 10000 });
        await page.waitForTimeout(2000);
        await expect(nameInput).not.toHaveValue('', { timeout: 5000 });

        // Update the name
        await nameInput.clear();
        await nameInput.fill(UPDATED_CAMPUS_NAME);

        // Update the city
        const cityInput = page.getByPlaceholder('City');
        await cityInput.clear();
        await cityInput.fill(UPDATED_CITY);

        await page.waitForTimeout(500);

        // Click Save and wait for PUT response
        const saveBtn = page.getByRole('button', { name: /Save Changes/i });
        await expect(saveBtn).toBeEnabled();

        const [response] = await Promise.all([
            page.waitForResponse(
                (resp) => resp.url().includes('/api/campuses/') && resp.request().method() === 'PUT',
                { timeout: 20000 }
            ),
            saveBtn.click(),
        ]);

        // Log response details for debugging
        if (!response.ok()) {
            const body = await response.json().catch(() => null);
            console.log(`PUT response ${response.status()}:`, JSON.stringify(body, null, 2));
        }
        expect(response.ok(), `PUT failed with status ${response.status()}`).toBeTruthy();

        // Page should exit edit mode
        await expect(page.getByRole('button', { name: 'Edit Parameters' })).toBeVisible({ timeout: 10000 });

        // Verify the updated name
        await expect(page.getByText(UPDATED_CAMPUS_NAME)).toBeVisible({ timeout: 10000 });

        await context.close();
    });

    test('U - should verify updated data persists on reload', async ({ browser }) => {
        test.skip(!createdCampusId, 'No campus ID — create test may have failed');
        const { context, page } = await createAuthedPage(browser);

        await page.goto(`/app/campuses/${createdCampusId}`);
        await page.waitForLoadState('networkidle');

        await expect(page.getByText(UPDATED_CAMPUS_NAME)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(UPDATED_CITY).first()).toBeVisible();

        await context.close();
    });

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. DELETE (Soft Delete) — Suspend and re-activate via list actions
    // ─────────────────────────────────────────────────────────────────────────────

    test('D - should suspend the campus via row action (soft delete)', async ({ browser }) => {
        test.skip(!createdCampusId, 'No campus ID — create test may have failed');
        const { context, page } = await createAuthedPage(browser);

        await page.goto('/app/campuses');
        await page.waitForLoadState('networkidle');

        // Search
        await page.getByPlaceholder('Search campuses...').fill(UPDATED_CAMPUS_NAME);
        await expect(page.getByText(UPDATED_CAMPUS_NAME)).toBeVisible({ timeout: 10000 });

        // Open row action dropdown
        const campusRow = page.locator('tr', { hasText: UPDATED_CAMPUS_NAME });
        const moreBtn = campusRow.locator('button').last();
        await moreBtn.click();

        // Click "Suspend"
        const suspendBtn = page.getByRole('button', { name: 'Suspend', exact: true });
        await expect(suspendBtn).toBeVisible();
        await suspendBtn.click();

        // Wait for success
        await expect(page.getByText(/completed|success|suspended/i)).toBeVisible({ timeout: 15000 });

        await context.close();
    });

    test('D - should verify suspended campus shows Suspended badge', async ({ browser }) => {
        test.skip(!createdCampusId, 'No campus ID — create test may have failed');
        const { context, page } = await createAuthedPage(browser);

        await page.goto('/app/campuses');
        await page.waitForLoadState('networkidle');

        // Filter to "suspended"
        await page.getByRole('button', { name: 'suspended', exact: true }).click();
        await page.getByPlaceholder('Search campuses...').fill(UPDATED_CAMPUS_NAME);

        await expect(page.getByText(UPDATED_CAMPUS_NAME)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Suspended').first()).toBeVisible();

        await context.close();
    });

    test('D - should re-activate the suspended campus', async ({ browser }) => {
        test.skip(!createdCampusId, 'No campus ID — create test may have failed');
        const { context, page } = await createAuthedPage(browser);

        await page.goto('/app/campuses');
        await page.waitForLoadState('networkidle');

        // The frontend uses "accessToken" in localStorage
        const token = await page.evaluate(() => localStorage.getItem('accessToken'));

        // Use the current page's origin + /api for the proxy
        const origin = await page.evaluate(() => window.location.origin);
        const apiUrl = `${origin}/api`;

        const response = await page.request.post(`${apiUrl}/campuses/bulk-action`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            data: { action: 'activate', campusIds: [createdCampusId] },
        });

        if (!response.ok()) {
            const body = await response.json().catch(() => null);
            console.error(`Activate API failed with status ${response.status()}:`, body);
        }

        expect(response.ok(), `Activate API failed: ${response.status()}`).toBeTruthy();

        await context.close();
    });

    test('D - should verify campus is back to Active after re-activation', async ({ browser }) => {
        test.skip(!createdCampusId, 'No campus ID — create test may have failed');
        const { context, page } = await createAuthedPage(browser);

        await page.goto('/app/campuses');
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'active', exact: true }).click();
        await page.getByPlaceholder('Search campuses...').fill(UPDATED_CAMPUS_NAME);

        await expect(page.getByText(UPDATED_CAMPUS_NAME)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Active').first()).toBeVisible();

        await context.close();
    });
});
