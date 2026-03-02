import { test, expect } from '@playwright/test';

test.describe('Campuses Page E2E', () => {

    test.beforeEach(async ({ page }) => {
        // Inject auth state - navigate to a blank page first to set origin
        await page.goto('/');

        // Inject local storage state
        await page.evaluate(() => {
            localStorage.setItem('accessToken', 'mock-token');
            localStorage.setItem('user', JSON.stringify({
                id: 'mock-user-id',
                email: 'admin@talentsecure.ai',
                role: 'super_admin',
                name: 'Super Admin'
            }));
        });

        // Wait for the state to settle and go to dashboard
        await page.goto('/app/campuses');
        await page.waitForLoadState('networkidle');
    });

    test('should display campuses list page correctly', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Campuses' })).toBeVisible();
        await expect(page.getByText('Enterprise Network')).toBeVisible();

        // Stats cards
        await expect(page.getByText('Total Campuses')).toBeVisible();
        await expect(page.getByText('Active Partners')).toBeVisible();

        // Search input
        await expect(page.getByPlaceholder('Search campuses...')).toBeVisible();
    });

    test('should filter campuses by status', async ({ page }) => {
        await page.getByRole('button', { name: 'active', exact: true }).click();
        await page.getByRole('button', { name: 'inactive', exact: true }).click();
        await page.getByRole('button', { name: 'suspended', exact: true }).click();
        await page.getByRole('button', { name: 'all', exact: true }).click();
    });

    test('should navigate to add campus page and validate optional mandatories are working', async ({ page }) => {
        await page.getByRole('link', { name: 'Add Campus' }).click();
        await expect(page).toHaveURL(/\/app\/campuses\/new/);

        await expect(page.getByRole('heading', { name: 'Initial Campus Administrator' })).toBeVisible();

        // The 'Create Campus' button should be disabled initially 
        // because name, city, state and admin details are empty
        const createBtn = page.getByRole('button', { name: 'Create Campus' });
        await expect(createBtn).toBeDisabled();

        // Fill the fields
        await page.getByPlaceholder('Enter Campus Name').fill('Test E2E Campus');
        await page.getByPlaceholder('City').fill('E2E City');
        await page.getByPlaceholder('State').fill('E2E State');

        await page.locator('textarea[placeholder="Jot down notes, feedback, or internal context about this relationship..."]').fill('Test Internal Notes');

        // Attempt saving without email/password to see it's disabled
        await expect(createBtn).toBeDisabled();

        // Fill Admin section
        await page.getByPlaceholder('e.g. John Doe').fill('Admin Name');
        await page.getByPlaceholder('admin@campus.edu').fill('admin.e2e@campus.com');
        await page.getByPlaceholder('Min 6 characters').fill('password123');

        // Address is also required
        const textareas = page.locator('textarea');
        await textareas.first().fill('123 E2E Street'); // the first textarea should be Address based on DOM order

        // Now it should be enabled
        await expect(createBtn).toBeEnabled();
    });
});
