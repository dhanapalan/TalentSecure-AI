import { test, expect } from '@playwright/test';
import { injectAdminAuth } from './helpers/auth';

test.describe('Admin User Management E2E', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        // Go to the unified administration page
        await page.goto('/app/administration');
        await page.waitForLoadState('networkidle');
    });

    test('should load user management heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Administrative Hub' })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('button', { name: 'System Personnel' })).toBeVisible();
    });

    test('should have an add user button', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Add User' })).toBeVisible();
    });

    test('should provide filters for roles', async ({ page }) => {
        await expect(page.getByRole('combobox').first()).toBeVisible();
        await expect(page.locator('option', { hasText: 'All Roles' }).first()).toHaveCount(1);
    });
});
