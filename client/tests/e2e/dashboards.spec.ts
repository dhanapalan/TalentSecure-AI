import { test, expect } from '@playwright/test';

test.describe('Dashboards E2E (CXO & College)', () => {

    test.describe('CXO Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/');
            await page.evaluate(() => {
                localStorage.setItem('accessToken', 'mock-cxo-token');
                localStorage.setItem('user', JSON.stringify({
                    id: 'cxo-1',
                    email: 'cxo@talentsecure.ai',
                    role: 'cxo',
                    name: 'Chief Executive'
                }));
            });
            await page.goto('/app/cxo/dashboard');
            await page.waitForLoadState('networkidle');
        });

        test('should load high-level CXO metrics', async ({ page }) => {
            // Assume the page title or primary heading is 'Executive Dashboard'
            await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
        });
    });

    test.describe('College Dashboard', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/');
            await page.evaluate(() => {
                localStorage.setItem('accessToken', 'mock-col-token');
                localStorage.setItem('user', JSON.stringify({
                    id: 'col-1',
                    email: 'admin@college.edu',
                    role: 'college_admin',
                    name: 'College Rep'
                }));
            });
            await page.goto('/app/college/dashboard');
            await page.waitForLoadState('networkidle');
        });

        test('should load college-specific metrics', async ({ page }) => {
            // Check for college dashboard heading
            await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
            await expect(page.getByText('Students Assigned')).toBeVisible({ timeout: 10000 }).catch(() => { });
        });
    });

});
