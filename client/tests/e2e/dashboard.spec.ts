import { test, expect } from '@playwright/test';
import { injectAdminAuth } from './helpers/auth';

test.describe('Dashboard Page E2E', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/overview');
        await page.waitForLoadState('networkidle');
    });

    test('should display platform overview KPIs', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Platform Overview/i })).toBeVisible();

        // Check for presence of KPI cards
        await expect(page.getByText(/Active Exams/i).first()).toBeVisible();
        await expect(page.getByText(/Total Violations/i).first()).toBeVisible();
        await expect(page.getByText(/High-Risk Alerts/i).first()).toBeVisible();
        await expect(page.getByText(/Students Flagged/i).first()).toBeVisible();
    });

    test('should display active exams snapshot', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Active Exams Snapshot/i })).toBeVisible();

        // The table should be present
        const table = page.locator('table').first();
        await expect(table).toBeVisible();
    });

    test('should handle pending actions section', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Pending Actions/i })).toBeVisible();
    });

    test('should display recent incidents', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /Recent Incidents/i })).toBeVisible();
    });

    test('should display system infrastructure health', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /System Infrastructure Health/i })).toBeVisible();
        await expect(page.getByText('API Gateway').first()).toBeVisible();
        await expect(page.getByText('Proctoring AI').first()).toBeVisible();
        await expect(page.getByText('Database Cluster').first()).toBeVisible();
    });
});
