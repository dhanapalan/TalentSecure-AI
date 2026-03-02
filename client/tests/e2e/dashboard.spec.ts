import { test, expect } from '@playwright/test';

test.describe('Dashboard Page E2E', () => {
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
        await page.goto('/app/overview');
        await page.waitForLoadState('networkidle');
    });

    test('should display platform overview KPIs', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Platform Overview' })).toBeVisible();

        // Check for presence of KPI cards
        await expect(page.locator('h3').filter({ hasText: 'Active Exams' })).toBeVisible();
        await expect(page.locator('h3').filter({ hasText: 'Total Violations' })).toBeVisible();
        await expect(page.locator('h3').filter({ hasText: 'High-Risk Alerts' })).toBeVisible();
        await expect(page.locator('h3').filter({ hasText: 'Students Flagged' })).toBeVisible();
    });

    test('should display active exams snapshot', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Active Exams Snapshot' })).toBeVisible();

        // The table should be present
        const table = page.locator('table').first();
        await expect(table).toBeVisible();
    });

    test('should handle pending actions section', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Pending Actions' })).toBeVisible();
    });

    test('should display recent incidents', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Recent Incidents' })).toBeVisible();
    });

    test('should display system infrastructure health', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'System Infrastructure Health' })).toBeVisible();
        await expect(page.getByText('API Gateway').first()).toBeVisible();
        await expect(page.getByText('Proctoring AI').first()).toBeVisible();
        await expect(page.getByText('Database Cluster').first()).toBeVisible();
    });
});
