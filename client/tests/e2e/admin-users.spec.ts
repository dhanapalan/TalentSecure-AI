import { test, expect } from '@playwright/test';

test.describe('Admin User Management E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Inject auth state
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('accessToken', 'mock-token');
            localStorage.setItem('user', JSON.stringify({
                id: 'mock-admin',
                email: 'admin@talentsecure.ai',
                role: 'super_admin',
                name: 'Super Admin'
            }));
        });
        // Go to User Management page
        await page.goto('/app/admin/users');
        await page.waitForLoadState('networkidle');
    });

    test('should load user management heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'User Management' })).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Manage platform users across all organizational levels')).toBeVisible();
    });

    test('should have an add user button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
    });

    test('should provide filters for roles', async ({ page }) => {
        await expect(page.getByText('All Roles')).toBeVisible();
    });
});
