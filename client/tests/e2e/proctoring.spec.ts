import { test, expect } from '@playwright/test';

test.describe('Proctoring & Live Monitoring E2E', () => {
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
        // Go to Live monitoring page
        await page.goto('/app/admin/live-monitoring');
        await page.waitForLoadState('networkidle');
    });

    test('should load the live monitoring dashboard', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Live Proctoring' })).toBeVisible({ timeout: 10000 });

        // Look for the generic search placeholder or "Students" text
        await expect(page.getByPlaceholder('Search student...')).toBeVisible();
        // The warning/danger blocks
        await expect(page.getByText('Critical Alerts')).toBeVisible();
    });

    test('should verify empty state when no students are monitored', async ({ page }) => {
        // Mock API to return empty array
        await page.route('**/api/proctoring/sessions*', route => {
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
        await expect(page.getByText('No active sessions matching filters')).toBeVisible();
    });
});
