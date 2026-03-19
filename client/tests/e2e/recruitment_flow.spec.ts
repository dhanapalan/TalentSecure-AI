import { test, expect } from '@playwright/test';
import { injectAdminAuth } from './helpers/auth';

test('End-to-End Recruitment Flow Validation (smoke)', async ({ page, request }) => {
    await injectAdminAuth(page, request);

    // 1. Assessment Rules
    await page.goto('/app/assessment-rules');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Assessment Rules' })).toBeVisible();

    // 2. Drives
    await page.getByRole('link', { name: 'Drives' }).click();
    await expect(page).toHaveURL(/\/app\/drives/);
    await expect(page.getByRole('heading', { name: 'Assessment Drives' })).toBeVisible();

    // 3. Campuses
    await page.getByRole('link', { name: 'Campuses' }).click();
    await expect(page).toHaveURL(/\/app\/campuses/);
    await expect(page.getByRole('heading', { name: 'Campuses' })).toBeVisible();

    // 4. Administration
    await page.getByRole('link', { name: 'Administration' }).click();
    await expect(page).toHaveURL(/\/app\/administration/);
    await expect(page.getByRole('heading', { name: 'Administrative Hub' })).toBeVisible();
});
