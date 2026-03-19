import { test, expect } from '@playwright/test';
import { injectAdminAuth } from './helpers/auth';

test.describe('Admin Roles & Permissions E2E', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        // Go to the unified administration page
        await page.goto('/app/administration');
        await page.waitForLoadState('networkidle');
    });

    test('should load administrative panel with roles and permissions tabs', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Administrative Hub' })).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('button', { name: 'System Personnel' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Job Roles' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Security Logs' })).toBeVisible();
    });

    test('should have a create role button', async ({ page }) => {
        await page.getByRole('button', { name: 'Job Roles' }).click();
        await expect(page.getByRole('button', { name: 'New Role' })).toBeVisible();
    });
});
