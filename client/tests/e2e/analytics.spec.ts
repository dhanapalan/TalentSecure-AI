import { test, expect } from '@playwright/test';

test.describe('Analytics E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Inject auth state
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('accessToken', 'mock-token');
            localStorage.setItem('user', JSON.stringify({
                id: 'mock-hr',
                email: 'hr@talentsecure.ai',
                role: 'hr',
                name: 'HR User'
            }));
        });
        // Go to Analytics page
        await page.goto('/app/analytics');
        await page.waitForLoadState('networkidle');
    });

    test('should load analytics and metrics', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible({ timeout: 10000 });

        // Mock API response
        await page.route('**/api/analytics/dashboard', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        totalStudents: 1500,
                        assessmentCompletionRate: 85,
                        avgProctoringIntegrity: 95,
                        segmentDistribution: {
                            'Top Tier': 300,
                            'Mid Tier': 800,
                            'Standard': 400
                        }
                    }
                })
            });
        });

        await page.reload();
        await page.waitForLoadState('networkidle');

        await expect(page.getByText('1500')).toBeVisible();
        await expect(page.getByText('85%')).toBeVisible();
        await expect(page.getByText('95%')).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Segment Distribution' })).toBeVisible();
        await expect(page.getByText('Top Tier')).toBeVisible();
    });
});
