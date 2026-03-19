import { test, expect } from '@playwright/test';
import { injectAdminAuth } from './helpers/auth';

test.describe('Proctoring & Live Monitoring E2E', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        // Go to Live monitoring page
        await page.goto('/app/admin/monitoring');
        await page.waitForLoadState('networkidle');
    });

    test('should load the live monitoring dashboard', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Live Monitoring' })).toBeVisible({ timeout: 10000 });

        await expect(page.getByPlaceholder('Search by ID or Drive...')).toBeVisible();
        await expect(page.getByText('High Risk')).toBeVisible();
    });

    test('should verify empty state when no students are monitored', async ({ page }) => {
        // Mock API to return empty array
        await page.route('**/api/proctoring/live*', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: []
                })
            });
        });

        await page.reload();
        await expect(page.getByText('No active sessions found matching criteria.')).toBeVisible();
    });
});
