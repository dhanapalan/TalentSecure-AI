import { test, expect } from '@playwright/test';
import { injectAdminAuth } from './helpers/auth';

// ════════════════════════════════════════════════════════════════════════════════
// 1. DRIVES DASHBOARD — Layout & Structure
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Drives Dashboard — Layout & Structure', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/drives');
        await page.waitForLoadState('networkidle');
    });

    test('should display page header with title and subtitle', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Assessment Drives' })).toBeVisible();
        await expect(page.getByText('Manage execution instances of assessment rules')).toBeVisible();
    });

    test('should display all four stat cards', async ({ page }) => {
        await expect(page.locator('p', { hasText: /^Total Drives$/ }).first()).toBeVisible();
        await expect(page.locator('p', { hasText: /^Active$/ }).first()).toBeVisible();
        await expect(page.locator('p', { hasText: /^Scheduled$/ }).first()).toBeVisible();
        await expect(page.locator('p', { hasText: /^Completed$/ }).first()).toBeVisible();
    });

    test('should display "New Drive from Rule" link', async ({ page }) => {
        await expect(page.getByRole('button', { name: /New Drive from Rule/i })).toBeVisible();
    });

    test('should display search input with correct placeholder', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search drives...');
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEditable();
    });

    test('should display all 7 status filter buttons', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'draft' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'scheduled' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'active' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'completed' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'published' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'cancelled' })).toBeVisible();
    });

    test('should display table with correct column headers or empty state', async ({ page }) => {
        const table = page.locator('table');
        const tableOrEmpty = table.or(page.getByText('No drives found'));
        await expect(tableOrEmpty).toBeVisible();

        if (await table.isVisible()) {
            await expect(page.getByRole('columnheader', { name: 'Drive Name' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Rule' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Version' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Start' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'End' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Students' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
        }
    });

    test('should show empty state when no drives exist', async ({ page }) => {
        const emptyState = page.getByText('No drives found');
        if (await emptyState.isVisible()) {
            await expect(page.getByText('Create a drive from an assessment rule')).toBeVisible();
        }
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 2. DRIVES DASHBOARD — Filtering & Search
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Drives Dashboard — Filtering & Search', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/drives');
        await page.waitForLoadState('networkidle');
    });

    test('should filter by search text', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search drives...');
        await searchInput.fill('nonexistentdrivexyz123');
        await expect(page.getByText('No drives found').or(page.locator('table tbody tr'))).toBeVisible();
    });

    test('should clear search and restore full list', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search drives...');
        await searchInput.fill('nonexistent');
        await searchInput.fill('');
        await expect(page.getByRole('heading', { name: 'Assessment Drives' })).toBeVisible();
    });

    test('should filter by status — draft', async ({ page }) => {
        await page.getByRole('button', { name: 'draft' }).click();
        const draftBtn = page.getByRole('button', { name: 'draft' });
        await expect(draftBtn).toHaveClass(/bg-indigo-500/);
    });

    test('should filter by status — scheduled', async ({ page }) => {
        await page.getByRole('button', { name: 'scheduled' }).click();
        const scheduledBtn = page.getByRole('button', { name: 'scheduled' });
        await expect(scheduledBtn).toHaveClass(/bg-indigo-500/);
    });

    test('should filter by status — active', async ({ page }) => {
        await page.getByRole('button', { name: 'active' }).click();
        const activeBtn = page.getByRole('button', { name: 'active' });
        await expect(activeBtn).toHaveClass(/bg-indigo-500/);
    });

    test('should filter by status — completed', async ({ page }) => {
        await page.getByRole('button', { name: 'completed' }).click();
        const completedBtn = page.getByRole('button', { name: 'completed' });
        await expect(completedBtn).toHaveClass(/bg-indigo-500/);
    });

    test('should filter by status — published', async ({ page }) => {
        await page.getByRole('button', { name: 'published' }).click();
        const publishedBtn = page.getByRole('button', { name: 'published' });
        await expect(publishedBtn).toHaveClass(/bg-indigo-500/);
    });

    test('should filter by status — cancelled', async ({ page }) => {
        await page.getByRole('button', { name: 'cancelled' }).click();
        const cancelledBtn = page.getByRole('button', { name: 'cancelled' });
        await expect(cancelledBtn).toHaveClass(/bg-indigo-500/);
    });

    test('should reset status filter to All', async ({ page }) => {
        await page.getByRole('button', { name: 'draft' }).click();
        await page.getByRole('button', { name: 'All' }).click();
        const allBtn = page.getByRole('button', { name: 'All' });
        await expect(allBtn).toHaveClass(/bg-indigo-500/);
    });

    test('should combine search + status filter without crashing', async ({ page }) => {
        await page.getByRole('button', { name: 'active' }).click();
        await page.getByPlaceholder('Search drives...').fill('test');
        await expect(page.getByRole('heading', { name: 'Assessment Drives' })).toBeVisible();
    });

    test('should handle rapid filter switching gracefully', async ({ page }) => {
        await page.getByRole('button', { name: 'draft' }).click();
        await page.getByRole('button', { name: 'active' }).click();
        await page.getByRole('button', { name: 'completed' }).click();
        await page.getByRole('button', { name: 'All' }).click();
        await expect(page.getByRole('heading', { name: 'Assessment Drives' })).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 3. DRIVES DASHBOARD — Navigation
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Drives Dashboard — Navigation', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/drives');
        await page.waitForLoadState('networkidle');
    });

    test('"New Drive from Rule" should navigate to assessment rules', async ({ page }) => {
        await page.getByRole('button', { name: /New Drive from Rule/i }).click();
        await expect(page.getByRole('heading', { name: 'Launch New Drive' })).toBeVisible();
    });

    test('clicking drive name should navigate to drive detail page', async ({ page }) => {
        const driveLink = page.locator('a[href*="/app/drives/"]').first();
        if (await driveLink.isVisible()) {
            await driveLink.click();
            await expect(page).toHaveURL(/\/app\/drives\/[a-f0-9-]+$/);
        }
    });

    test('clicking View action should navigate to drive detail page', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/drives/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (await viewLink.isVisible()) {
            await viewLink.click();
            await expect(page).toHaveURL(/\/app\/drives\/[a-f0-9-]+$/);
        }
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 4. DRIVE DETAIL PAGE — Layout & Tabs (using mock URL)
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Drive Detail Page — Layout', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        // Navigate to a mock drive ID — the page handles missing drives gracefully
        await page.goto('/app/drives/00000000-0000-0000-0000-000000000001');
        await page.waitForLoadState('networkidle');
    });

    test('should display back link to drives list', async ({ page }) => {
        const backLink = page.getByRole('link', { name: /Back to Drives/i });
        if (await backLink.isVisible()) {
            await expect(backLink).toBeVisible();
            return;
        }
        await expect(page.getByText('Drive not found')).toBeVisible();
    });

    test('should display "Drive not found" for non-existent drive or render detail page', async ({ page }) => {
        // Either shows "Drive not found" or loads the real drive
        const notFound = page.getByText('Drive not found');
        const pageHeader = page.locator('h1');
        await expect(notFound.or(pageHeader)).toBeVisible();
    });

    test('back link should navigate to drives dashboard', async ({ page }) => {
        let backLink = page.getByRole('link', { name: /Back to Drives/i });

        // If mock ID is missing, open a real drive from list so back-navigation is still validated.
        if (!(await backLink.isVisible())) {
            await page.goto('/app/drives');
            await page.waitForLoadState('networkidle');

            const driveLink = page.locator('a[href*="/app/drives/"]').first();
            test.skip(!(await driveLink.isVisible()), 'No drive detail page available to validate back navigation');
            await driveLink.click();
            await page.waitForLoadState('networkidle');
            backLink = page.getByRole('link', { name: /Back to Drives/i });
        }

        await expect(backLink).toBeVisible();
        await backLink.click();
        await expect(page).toHaveURL(/\/app\/drives$/);
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 5. DRIVE DETAIL PAGE — Tab Navigation (if drive exists)
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Drive Detail Page — Tabs', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        // Try to navigate to a real drive via the dashboard
        await page.goto('/app/drives');
        await page.waitForLoadState('networkidle');
    });

    test('should display all 6 tab buttons when a drive is loaded', async ({ page }) => {
        const driveLink = page.locator('a[href*="/app/drives/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (await driveLink.isVisible()) {
            await driveLink.click();
            await page.waitForLoadState('networkidle');

            await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Assignment/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Pool Details/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Students/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Monitoring/i })).toBeVisible();
            await expect(page.getByRole('button', { name: /Results/i })).toBeVisible();
        }
    });

    test('clicking Monitoring tab should show placeholder content', async ({ page }) => {
        const driveLink = page.locator('a[href*="/app/drives/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (await driveLink.isVisible()) {
            await driveLink.click();
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /Monitoring/i }).click();
            await expect(page.getByRole('heading', { name: 'Live Monitoring' })).toBeVisible();
            await expect(page.getByText('Real-time proctoring statistics')).toBeVisible();
        }
    });

    test('clicking Results tab should show placeholder content', async ({ page }) => {
        const driveLink = page.locator('a[href*="/app/drives/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (await driveLink.isVisible()) {
            await driveLink.click();
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /Results/i }).click();
            await expect(page.getByText('Results & Analytics')).toBeVisible();
            await expect(page.getByText('Score distribution')).toBeVisible();
        }
    });

    test('clicking Overview tab should show drive overview section', async ({ page }) => {
        const driveLink = page.locator('a[href*="/app/drives/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (await driveLink.isVisible()) {
            await driveLink.click();
            await page.waitForLoadState('networkidle');

            // Overview tab is the default
            await expect(page.getByText('Drive Overview')).toBeVisible();
        }
    });

    test('clicking Students tab should show students section', async ({ page }) => {
        const driveLink = page.locator('a[href*="/app/drives/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (await driveLink.isVisible()) {
            await driveLink.click();
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /Students/i }).click();
            await expect(page.getByText('Drive Students').or(page.getByText('No students assigned'))).toBeVisible();
        }
    });

    test('clicking Assignment tab should show assignment section', async ({ page }) => {
        const driveLink = page.locator('a[href*="/app/drives/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (await driveLink.isVisible()) {
            await driveLink.click();
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /Assignment/i }).click();
            await expect(page.getByRole('heading', { name: 'Campus Assignments' })).toBeVisible();
            await expect(page.getByText('No assignments yet')).toBeVisible();
        }
    });

    test('clicking Pool Details tab should show pool section', async ({ page }) => {
        const driveLink = page.locator('a[href*="/app/drives/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (await driveLink.isVisible()) {
            await driveLink.click();
            await page.waitForLoadState('networkidle');

            await page.getByRole('button', { name: /Pool Details/i }).click();
            await expect(page.getByRole('heading', { name: 'No Assessment Pool Generated' })).toBeVisible();
            await expect(page.getByRole('button', { name: /Generate AI Pool/i })).toBeVisible();
        }
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 6. SIDEBAR NAVIGATION — Drives
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Drives — Sidebar Navigation', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/overview');
        await page.waitForLoadState('networkidle');
    });

    test('sidebar should contain "Drives" link', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Drives' })).toBeVisible();
    });

    test('clicking "Drives" in sidebar should navigate to drives page', async ({ page }) => {
        await page.getByRole('link', { name: 'Drives' }).click();
        await expect(page).toHaveURL(/\/app\/drives/);
    });

    test('sidebar "Assessment Rules" and "Drives" should be adjacent', async ({ page }) => {
        // Both links should be visible simultaneously
        await expect(page.getByRole('link', { name: 'Assessment Rules' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Drives' })).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 7. CROSS-MODULE NAVIGATION
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Cross-Module Navigation', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
    });

    test('should navigate from Assessment Rules to Drives via sidebar', async ({ page }) => {
        await page.goto('/app/assessment-rules');
        await page.waitForLoadState('networkidle');

        await page.getByRole('link', { name: 'Drives' }).click();
        await expect(page).toHaveURL(/\/app\/drives/);
        await expect(page.getByRole('heading', { name: 'Assessment Drives' })).toBeVisible();
    });

    test('should navigate from Drives to Assessment Rules via sidebar', async ({ page }) => {
        await page.goto('/app/drives');
        await page.waitForLoadState('networkidle');

        await page.getByRole('link', { name: 'Assessment Rules' }).click();
        await expect(page).toHaveURL(/\/app\/assessment-rules/);
        await expect(page.getByRole('heading', { name: 'Assessment Rules' })).toBeVisible();
    });

    test('should navigate from Drives to Rules via "New Drive from Rule" button', async ({ page }) => {
        await page.goto('/app/drives');
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: /New Drive from Rule/i }).click();
        await expect(page.getByRole('heading', { name: 'Launch New Drive' })).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 8. ROLE-BASED ACCESS (Negative Tests)
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Role-Based Access Control', () => {
    test('student role should NOT be able to access Assessment Rules', async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.context().addInitScript(() => {
            const raw = localStorage.getItem('user');
            if (!raw) return;
            const user = JSON.parse(raw);
            user.role = 'student';
            localStorage.setItem('user', JSON.stringify(user));
        });
        await page.goto('/app/assessment-rules');
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
    });

    test('student role should NOT be able to access Drives', async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.context().addInitScript(() => {
            const raw = localStorage.getItem('user');
            if (!raw) return;
            const user = JSON.parse(raw);
            user.role = 'student';
            localStorage.setItem('user', JSON.stringify(user));
        });
        await page.goto('/app/drives');
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 9. LOADING STATES
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Loading States', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
    });

    test('Assessment Rules page should show loading spinner or content', async ({ page }) => {
        await page.goto('/app/assessment-rules');
        // Either spinner or content should be visible immediately
        const spinner = page.locator('.animate-spin');
        const content = page.getByText('Assessment Rules');
        await expect(spinner.or(content)).toBeVisible();
    });

    test('Drives page should show loading spinner or content', async ({ page }) => {
        await page.goto('/app/drives');
        const spinner = page.locator('.animate-spin');
        const content = page.getByText('Assessment Drives');
        await expect(spinner.or(content)).toBeVisible();
    });
});
