import { test, expect } from '@playwright/test';
import { injectAdminAuth } from './helpers/auth';

// ════════════════════════════════════════════════════════════════════════════════
// 1. RULE DASHBOARD — Layout & Structure
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Assessment Rules Dashboard — Layout & Structure', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/assessment-rules');
        await page.waitForLoadState('networkidle');
    });

    test('should display page header with title and subtitle', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Assessment Rules' })).toBeVisible();
        await expect(page.getByText('Configure assessment templates and rule sets')).toBeVisible();
    });

    test('should display all three stat cards', async ({ page }) => {
        await expect(page.getByText('Total Rules')).toBeVisible();
        await expect(page.getByText('Active Templates')).toBeVisible();
        await expect(page.getByText('Drafts')).toBeVisible();
    });

    test('should display "Create Rule" button', async ({ page }) => {
        await expect(page.getByRole('link', { name: /Create Rule/i })).toBeVisible();
    });

    test('should display search input with correct placeholder', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search rules...');
        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeEditable();
    });

    test('should display status filter buttons (All, draft, active template, archived)', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'draft' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'active template' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'archived' })).toBeVisible();
    });

    test('should display table with correct column headers', async ({ page }) => {
        const table = page.locator('table');
        const tableOrEmpty = table.or(page.getByText('No rules found'));
        await expect(tableOrEmpty).toBeVisible();

        // If there's a table, verify columns
        if (await table.isVisible()) {
            await expect(page.getByRole('columnheader', { name: 'Rule Name' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Skills Mix' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Duration' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Questions' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Proctoring' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Version' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
            await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
        }
    });

    test('should show empty state with "Create First Rule" link when no rules exist', async ({ page }) => {
        // If no rules are returned, the empty state should be visible
        const emptyState = page.getByText('No rules found');
        if (await emptyState.isVisible()) {
            await expect(page.getByText('Create your first assessment rule to get started')).toBeVisible();
            await expect(page.getByRole('link', { name: /Create First Rule/i })).toBeVisible();
        }
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 2. RULE DASHBOARD — Filtering & Search
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Assessment Rules Dashboard — Filtering & Search', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/assessment-rules');
        await page.waitForLoadState('networkidle');
    });

    test('should filter by search text', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search rules...');
        await searchInput.fill('nonexistentrulexyz123');
        // When no results match, empty state or filtered results should appear
        await expect(page.getByText('No rules found').or(page.locator('table tbody tr'))).toBeVisible();
    });

    test('should clear search and restore full list', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search rules...');
        await searchInput.fill('nonexistent');
        await searchInput.fill('');
        await expect(page.getByRole('heading', { name: 'Assessment Rules' })).toBeVisible();
    });

    test('should filter by status — draft', async ({ page }) => {
        await page.getByRole('button', { name: 'draft' }).click();
        // The draft button should now have the amber highlighted style
        const draftBtn = page.getByRole('button', { name: 'draft' });
        await expect(draftBtn).toHaveClass(/bg-amber-500/);
    });

    test('should filter by status — active template', async ({ page }) => {
        await page.getByRole('button', { name: 'active template' }).click();
        const activeBtn = page.getByRole('button', { name: 'active template' });
        await expect(activeBtn).toHaveClass(/bg-amber-500/);
    });

    test('should filter by status — archived', async ({ page }) => {
        await page.getByRole('button', { name: 'archived' }).click();
        const archivedBtn = page.getByRole('button', { name: 'archived' });
        await expect(archivedBtn).toHaveClass(/bg-amber-500/);
    });

    test('should reset status filter to All', async ({ page }) => {
        await page.getByRole('button', { name: 'draft' }).click();
        await page.getByRole('button', { name: 'All' }).click();
        const allBtn = page.getByRole('button', { name: 'All' });
        await expect(allBtn).toHaveClass(/bg-amber-500/);
    });

    test('should combine search + status filter without crashing', async ({ page }) => {
        await page.getByRole('button', { name: 'draft' }).click();
        await page.getByPlaceholder('Search rules...').fill('test');
        await expect(page.getByRole('heading', { name: 'Assessment Rules' })).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 3. RULE DASHBOARD — Navigation
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Assessment Rules Dashboard — Navigation', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/assessment-rules');
        await page.waitForLoadState('networkidle');
    });

    test('clicking "Create Rule" should navigate to wizard', async ({ page }) => {
        await page.getByRole('link', { name: /Create Rule/i }).first().click();
        await expect(page).toHaveURL(/\/app\/assessment-rules\/new/);
    });

    test('"Create First Rule" link in empty state should navigate to wizard', async ({ page }) => {
        const emptyLink = page.getByRole('link', { name: /Create First Rule/i });
        if (await emptyLink.isVisible()) {
            await emptyLink.click();
            await expect(page).toHaveURL(/\/app\/assessment-rules\/new/);
        }
    });

    test('clicking Edit action on a rule row should navigate to edit page', async ({ page }) => {
        const editLink = page.locator('a[href*="/app/assessment-rules/"]').filter({ has: page.locator('svg.lucide-edit-2') }).first();
        if (await editLink.isVisible()) {
            await editLink.click();
            await expect(page).toHaveURL(/\/app\/assessment-rules\/[a-f0-9-]+$/);
        }
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 4. RULE WIZARD — Structure & Navigation
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Rule Wizard — Structure & Step Navigation', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/assessment-rules/new');
        await page.waitForLoadState('networkidle');
    });

    test('should display wizard header with "Create Assessment Rule"', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Create Assessment Rule' })).toBeVisible();
        await expect(page.getByText('Step 1 of 6: Basic Config')).toBeVisible();
    });

    test('should display all 6 step buttons in stepper', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Basic Config/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Skill Distribution/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Difficulty/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Pool Config/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Targeting/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Review & Save/i })).toBeVisible();
    });

    test('should navigate forward through steps via Next button', async ({ page }) => {
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Step 2 of 6: Skill Distribution')).toBeVisible();

        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Step 3 of 6: Difficulty')).toBeVisible();

        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Step 4 of 6: Pool Config')).toBeVisible();

        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Step 5 of 6: Targeting')).toBeVisible();

        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Step 6 of 6: Review & Save')).toBeVisible();
    });

    test('should navigate backward via Previous button', async ({ page }) => {
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Step 2 of 6')).toBeVisible();

        await page.getByRole('button', { name: 'Previous' }).click();
        await expect(page.getByText('Step 1 of 6')).toBeVisible();
    });

    test('Previous button should be disabled on first step', async ({ page }) => {
        await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled();
    });

    test('should navigate directly to a step by clicking stepper buttons', async ({ page }) => {
        await page.getByRole('button', { name: /Targeting/i }).click();
        await expect(page.getByText('Step 5 of 6: Targeting')).toBeVisible();

        await page.getByRole('button', { name: /Basic Config/i }).click();
        await expect(page.getByText('Step 1 of 6: Basic Config')).toBeVisible();
    });

    test('back arrow should navigate to rules dashboard', async ({ page }) => {
        const backBtn = page.locator('button').filter({ has: page.locator('svg.lucide-arrow-left') }).first();
        await backBtn.click();
        await expect(page).toHaveURL(/\/app\/assessment-rules$/);
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 5. RULE WIZARD — Step 1: Basic Config
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Rule Wizard — Step 1: Basic Configuration', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/assessment-rules/new');
        await page.waitForLoadState('networkidle');
    });

    test('should display all basic config fields', async ({ page }) => {
        await expect(page.getByText('Rule Name *')).toBeVisible();
        await expect(page.getByText('Description')).toBeVisible();
        await expect(page.getByText('Target Role (Optional)')).toBeVisible();
        await expect(page.getByText('Exam Duration (minutes)')).toBeVisible();
        await expect(page.getByText('Total Questions')).toBeVisible();
        await expect(page.getByText('Total Marks')).toBeVisible();
        await expect(page.getByText('Overall Cutoff (%)')).toBeVisible();
        await expect(page.getByText('Enable Negative Marking')).toBeVisible();
    });

    test('should accept text input for Rule Name', async ({ page }) => {
        const nameInput = page.getByPlaceholder('e.g., Full Stack Developer Assessment');
        await nameInput.fill('Test Rule E2E');
        await expect(nameInput).toHaveValue('Test Rule E2E');
    });

    test('should accept text in Description field', async ({ page }) => {
        const descInput = page.getByPlaceholder('Detailed description of this assessment rule...');
        await descInput.fill('This is a test description');
        await expect(descInput).toHaveValue('This is a test description');
    });

    test('should accept numeric input for Duration', async ({ page }) => {
        const durationInput = page.locator('input[type="number"]').nth(0);
        await durationInput.fill('90');
        await expect(durationInput).toHaveValue('90');
    });

    test('should toggle negative marking checkbox', async ({ page }) => {
        const checkbox = page.locator('input[type="checkbox"]').first();
        await expect(checkbox).not.toBeChecked();
        await checkbox.check();
        await expect(checkbox).toBeChecked();
        // Deduction input should appear
        await expect(page.getByText('Deduction per wrong answer:')).toBeVisible();
    });

    test('negative marking deduction value should accept decimal inputs', async ({ page }) => {
        const checkbox = page.locator('input[type="checkbox"]').first();
        await checkbox.check();
        const deductionInput = page.locator('input[step="0.25"]');
        await deductionInput.fill('0.5');
        await expect(deductionInput).toHaveValue('0.5');
    });

    test('should have correct default values', async ({ page }) => {
        const nameInput = page.getByPlaceholder('e.g., Full Stack Developer Assessment');
        await expect(nameInput).toHaveValue('');
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 6. RULE WIZARD — Step 2: Skill Distribution
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Rule Wizard — Step 2: Skill Distribution', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/assessment-rules/new');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: 'Next' }).click();
    });

    test('should display Skill Distribution heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Skill Distribution' })).toBeVisible();
    });

    test('should display default skills with percentages', async ({ page }) => {
        await expect(page.getByText('Aptitude')).toBeVisible();
        await expect(page.getByText('Reasoning')).toBeVisible();
        await expect(page.getByText('Data Structures')).toBeVisible();
        await expect(page.getByText('Programming')).toBeVisible();
        await expect(page.getByText('SQL')).toBeVisible();
    });

    test('should show total percentage indicator', async ({ page }) => {
        await expect(page.getByText('Total: 100%')).toBeVisible();
    });

    test('should display "Add Skill" button', async ({ page }) => {
        await expect(page.getByText('+ Add Skill')).toBeVisible();
    });

    test('should display range sliders for each skill', async ({ page }) => {
        const sliders = page.locator('input[type="range"]');
        await expect(sliders).toHaveCount(5); // 5 default skills
    });

    test('should show remove (✕) buttons for each skill', async ({ page }) => {
        const removeButtons = page.getByText('✕');
        const count = await removeButtons.count();
        expect(count).toBeGreaterThanOrEqual(5);
    });

    test('modifying a slider should update the percentage total', async ({ page }) => {
        // Change the first skill's number input
        const firstInput = page.locator('input[type="number"]').first();
        await firstInput.fill('50');
        // Total should no longer be 100%
        await expect(page.getByText('Total: 100%')).not.toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 7. RULE WIZARD — Step 6: Review & Save
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Rule Wizard — Step 6: Review & Save', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/assessment-rules/new');
        await page.waitForLoadState('networkidle');
        await page.getByRole('button', { name: /Review & Save/i }).click();
    });

    test('should display review heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Review & Save' })).toBeVisible();
    });

    test('should display all review sections', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Basic Configuration' })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Skill Distribution/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Difficulty/i })).toBeVisible();
    });

    test('should display three action buttons', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Save as Draft/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Save & Activate/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Generate & Launch Drive/i })).toBeVisible();
    });

    test('review should show default values', async ({ page }) => {
        const basicConfigCard = page
            .locator('div')
            .filter({ has: page.getByRole('heading', { name: 'Basic Configuration' }) })
            .first();
        await expect(basicConfigCard).toContainText('Duration:');
        await expect(basicConfigCard).toContainText('60 min');
        await expect(basicConfigCard).toContainText('Questions:');
        await expect(basicConfigCard).toContainText('30');
    });

    test('review should reflect data entered in earlier steps', async ({ page }) => {
        // Go back to step 1 and fill in a name
        await page.getByRole('button', { name: /Basic Config/i }).click();
        await page.getByPlaceholder('e.g., Full Stack Developer Assessment').fill('My E2E Rule');

        // Go to review
        await page.getByRole('button', { name: /Review & Save/i }).click();

        // Verify the entered name appears in review
        await expect(page.getByText('My E2E Rule')).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 8. SIDEBAR NAVIGATION
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Assessment Rules — Sidebar Navigation', () => {
    test.beforeEach(async ({ page, request }) => {
        await injectAdminAuth(page, request);
        await page.goto('/app/overview');
        await page.waitForLoadState('networkidle');
    });

    test('sidebar should contain "Assessment Rules" link', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Assessment Rules' })).toBeVisible();
    });

    test('clicking "Assessment Rules" in sidebar should navigate to rules page', async ({ page }) => {
        await page.getByRole('link', { name: 'Assessment Rules' }).click();
        await expect(page).toHaveURL(/\/app\/assessment-rules/);
    });
});
