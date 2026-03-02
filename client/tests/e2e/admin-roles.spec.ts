import { test, expect } from '@playwright/test';

test.describe('Admin Roles & Permissions E2E', () => {
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
        // Go to Roles page
        await page.goto('/app/admin/roles');
        await page.waitForLoadState('networkidle');
    });

    test('should load administrative panel with roles and permissions tabs', async ({ page }) => {
        // Might wait for network data depending on if the table loads roles
        await expect(page.getByRole('heading', { name: 'Roles & Permissions' })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('button', { name: 'Roles' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Permissions' })).toBeVisible();
    });

    test('should have a create role button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Create Role' })).toBeVisible();
    });
});
