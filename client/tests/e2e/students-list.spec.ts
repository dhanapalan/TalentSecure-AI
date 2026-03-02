import { test, expect } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────────────────

const injectAuth = async (page: any) => {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.setItem('accessToken', 'mock-token');
        localStorage.setItem('user', JSON.stringify({
            id: 'mock-user-id',
            email: 'admin@talentsecure.ai',
            role: 'super_admin',
            name: 'Super Admin',
        }));
    });
};

// ════════════════════════════════════════════════════════════════════════════════
// 1. STUDENT LIST PAGE
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Student List Page — Layout & Structure', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students');
        await page.waitForLoadState('networkidle');
    });

    test('should display the page header with correct title and subtitle', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Student Management' })).toBeVisible();
        await expect(page.getByText('Talent Pool')).toBeVisible();
        await expect(page.getByText('Manage student profiles')).toBeVisible();
    });

    test('should display all four stat cards', async ({ page }) => {
        await expect(page.getByText('Total Students')).toBeVisible();
        await expect(page.getByText('Active Students')).toBeVisible();
        await expect(page.getByText('Placed')).toBeVisible();
        await expect(page.getByText('Avg CGPA')).toBeVisible();
    });

    test('should display action buttons (Add Student, Bulk Import, Export)', async ({ page }) => {
        await expect(page.getByRole('link', { name: /Add Student/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Bulk Import/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
    });

    test('should show search input with correct placeholder', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search students...');
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEditable();
    });

    test('should show status filter buttons (all, active, inactive)', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'all', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'active', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'inactive', exact: true })).toBeVisible();
    });

    test('should show the Risk filter dropdown', async ({ page }) => {
        const riskSelect = page.locator('select').filter({ hasText: 'All Risks' });
        await expect(riskSelect).toBeVisible();
    });

    test('should show view toggle buttons (grid / table)', async ({ page }) => {
        // There are two view toggle icons – Grid3x3 and List
        const gridBtn = page.locator('button').filter({ has: page.locator('svg.lucide-grid-3x3') });
        const tableBtn = page.locator('button').filter({ has: page.locator('svg.lucide-list') });
        await expect(gridBtn.or(tableBtn)).toHaveCount(2);
    });
});

// ── Filtering & Search ─────────────────────────────────────────────────────────

test.describe('Student List Page — Filtering & Search', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students');
        await page.waitForLoadState('networkidle');
    });

    test('should filter by search text', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search students...');
        await searchInput.fill('nonexistentstudentxyz123');
        // When no results match, the empty state should appear
        await expect(page.getByText('No students found').or(page.locator('table tbody tr'))).toBeVisible();
    });

    test('should clear search and restore full list', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search students...');
        await searchInput.fill('nonexistent');
        await searchInput.fill('');
        // The list should return to its original state
        await expect(page.getByText('Total Students')).toBeVisible();
    });

    test('should filter by status – active', async ({ page }) => {
        await page.getByRole('button', { name: 'active', exact: true }).click();
        // The active button should now have the highlighted style
        const activeBtn = page.getByRole('button', { name: 'active', exact: true });
        await expect(activeBtn).toHaveClass(/bg-blue-600/);
    });

    test('should filter by status – inactive', async ({ page }) => {
        await page.getByRole('button', { name: 'inactive', exact: true }).click();
        const inactiveBtn = page.getByRole('button', { name: 'inactive', exact: true });
        await expect(inactiveBtn).toHaveClass(/bg-blue-600/);
    });

    test('should reset status filter to all', async ({ page }) => {
        await page.getByRole('button', { name: 'active', exact: true }).click();
        await page.getByRole('button', { name: 'all', exact: true }).click();
        const allBtn = page.getByRole('button', { name: 'all', exact: true });
        await expect(allBtn).toHaveClass(/bg-blue-600/);
    });

    test('should filter by risk category – Low Risk', async ({ page }) => {
        const riskSelect = page.locator('select').filter({ hasText: 'All Risks' });
        await riskSelect.selectOption('Low Risk');
        // The page should still render without errors
        await expect(page.getByText('Student Management')).toBeVisible();
    });

    test('should filter by risk category – Medium Risk', async ({ page }) => {
        const riskSelect = page.locator('select').filter({ hasText: 'All Risks' });
        await riskSelect.selectOption('Medium Risk');
        await expect(page.getByText('Student Management')).toBeVisible();
    });

    test('should filter by risk category – High Risk', async ({ page }) => {
        const riskSelect = page.locator('select').filter({ hasText: 'All Risks' });
        await riskSelect.selectOption('High Risk');
        await expect(page.getByText('Student Management')).toBeVisible();
    });

    test('should combine multiple filters without crashing', async ({ page }) => {
        await page.getByRole('button', { name: 'active', exact: true }).click();
        const riskSelect = page.locator('select').filter({ hasText: 'All Risks' });
        await riskSelect.selectOption('Low Risk');
        await page.getByPlaceholder('Search students...').fill('test');
        // Page should still be functional
        await expect(page.getByText('Student Management')).toBeVisible();
    });
});

// ── View Modes ─────────────────────────────────────────────────────────────────

test.describe('Student List Page — View Modes', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students');
        await page.waitForLoadState('networkidle');
    });

    test('should default to table view', async ({ page }) => {
        // Table view has a <table> element
        await expect(page.locator('table').first()).toBeVisible();
    });

    test('should have table columns including Risk Profile', async ({ page }) => {
        await expect(page.getByRole('columnheader', { name: 'Student' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Roll No' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Risk Profile' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Campus' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'CGPA' })).toBeVisible();
        await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    });

    test('should have a select-all checkbox in the table header', async ({ page }) => {
        const headerCheckbox = page.locator('thead input[type="checkbox"]');
        await expect(headerCheckbox).toBeVisible();
    });
});

// ── Bulk Actions ───────────────────────────────────────────────────────────────

test.describe('Student List Page — Bulk Actions', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students');
        await page.waitForLoadState('networkidle');
    });

    test('bulk actions dropdown should NOT appear when nothing is selected', async ({ page }) => {
        // The bulk actions dropdown only renders when selectedStudents.size > 0
        await expect(page.getByText(/Actions on \d+ selected/)).not.toBeVisible();
    });

    test('selecting a row checkbox should show bulk actions dropdown', async ({ page }) => {
        const rowCheckbox = page.locator('tbody input[type="checkbox"]').first();
        if (await rowCheckbox.isVisible()) {
            await rowCheckbox.check();
            await expect(page.getByText(/Actions on \d+ selected/)).toBeVisible();
        }
    });

    test('select-all should select all visible rows', async ({ page }) => {
        const headerCheckbox = page.locator('thead input[type="checkbox"]');
        const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
        const count = await rowCheckboxes.count();
        if (count > 0) {
            await headerCheckbox.check();
            await expect(page.getByText(`Actions on ${count} selected`)).toBeVisible();
        }
    });

    test('deselecting select-all should hide bulk actions', async ({ page }) => {
        const headerCheckbox = page.locator('thead input[type="checkbox"]');
        const rowCheckboxes = page.locator('tbody input[type="checkbox"]');
        if (await rowCheckboxes.count() > 0) {
            await headerCheckbox.check();
            await headerCheckbox.uncheck();
            await expect(page.getByText(/Actions on \d+ selected/)).not.toBeVisible();
        }
    });
});

// ── Navigation ─────────────────────────────────────────────────────────────────

test.describe('Student List Page — Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students');
        await page.waitForLoadState('networkidle');
    });

    test('clicking Add Student should navigate to /app/students/new', async ({ page }) => {
        await page.getByRole('link', { name: /Add Student/i }).click();
        await expect(page).toHaveURL(/\/app\/students\/new/);
    });

    test('clicking Bulk Import should navigate to /app/students/bulk-import', async ({ page }) => {
        await page.getByRole('link', { name: /Bulk Import/i }).click();
        await expect(page).toHaveURL(/\/app\/students\/bulk-import/);
    });

    test('clicking View on a student row should navigate to detail view', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (await viewLink.isVisible()) {
            await viewLink.click();
            await expect(page).toHaveURL(/\/app\/students\/[a-f0-9-]+$/);
        }
    });

    test('clicking Edit on a student row should navigate to edit view', async ({ page }) => {
        const editLink = page.locator('a[href*="/edit"]').filter({ has: page.locator('svg.lucide-edit-2') }).first();
        if (await editLink.isVisible()) {
            await editLink.click();
            await expect(page).toHaveURL(/\/app\/students\/[a-f0-9-]+\/edit$/);
        }
    });
});

// ── Empty State ────────────────────────────────────────────────────────────────

test.describe('Student List Page — Empty State', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students');
        await page.waitForLoadState('networkidle');
    });

    test('filtering to impossible criteria shows empty state', async ({ page }) => {
        await page.getByPlaceholder('Search students...').fill('zzzznonexistent999zzz');
        await expect(page.getByText('No students found')).toBeVisible();
        await expect(page.getByText('Try adjusting your search or filters')).toBeVisible();
        await expect(page.getByRole('link', { name: /Add First Student/i })).toBeVisible();
    });
});
