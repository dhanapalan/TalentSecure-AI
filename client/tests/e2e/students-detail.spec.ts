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
// 1. ADD NEW STUDENT — FORM RENDERING & VALIDATION
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Student Add (New) Page — Layout & Structure', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students/new');
        await page.waitForLoadState('networkidle');
    });

    test('should display "Add New Student" heading', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Add New Student' })).toBeVisible();
        await expect(page.getByText('Create a new student profile')).toBeVisible();
    });

    test('should display all 7 tabs', async ({ page }) => {
        const expectedTabs = ['Overview', 'Academic', 'Assessments', 'Integrity', 'Placement', 'Documents', 'Activity Log'];
        for (const tabName of expectedTabs) {
            await expect(page.getByRole('button', { name: tabName, exact: true })).toBeVisible();
        }
    });

    test('should default to Overview tab', async ({ page }) => {
        const overviewTab = page.getByRole('button', { name: 'Overview', exact: true });
        await expect(overviewTab).toHaveClass(/bg-amber-600/);
    });

    test('should show Cancel and Save Student buttons', async ({ page }) => {
        await expect(page.getByRole('button', { name: /Cancel/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /Create Student|Save Student/i })).toBeVisible();
    });

    test('should show Personal Information section under Overview tab', async ({ page }) => {
        await expect(page.getByText('Personal Information')).toBeVisible();
        await expect(page.getByPlaceholder('e.g., Rahul')).toBeVisible();     // First Name
        await expect(page.getByPlaceholder('e.g., Sharma')).toBeVisible();     // Last Name
        await expect(page.getByPlaceholder('rahul.sharma@college.edu')).toBeVisible(); // Email
    });
});

// ── Form Validation — Positive ─────────────────────────────────────────────────

test.describe('Student Add Page — Positive Validations', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students/new');
        await page.waitForLoadState('networkidle');
    });

    test('should accept valid first name', async ({ page }) => {
        const input = page.getByPlaceholder('e.g., Rahul');
        await input.fill('John');
        await expect(input).toHaveValue('John');
    });

    test('should accept valid last name', async ({ page }) => {
        const input = page.getByPlaceholder('e.g., Sharma');
        await input.fill('Doe');
        await expect(input).toHaveValue('Doe');
    });

    test('should accept valid email', async ({ page }) => {
        const input = page.getByPlaceholder('rahul.sharma@college.edu');
        await input.fill('john.doe@university.edu');
        await expect(input).toHaveValue('john.doe@university.edu');
    });

    test('should accept valid phone number', async ({ page }) => {
        const input = page.getByPlaceholder('+91 98765 43210');
        await input.fill('+91 99887 76655');
        await expect(input).toHaveValue('+91 99887 76655');
    });

    test('should accept valid date of birth', async ({ page }) => {
        const input = page.locator('input[type="date"]').first();
        await input.fill('2002-05-15');
        await expect(input).toHaveValue('2002-05-15');
    });

    test('should allow gender selection', async ({ page }) => {
        const select = page.locator('select').filter({ hasText: 'Male' }).first();
        await select.selectOption('Female');
        await expect(select).toHaveValue('Female');
    });

    test('should accept valid address', async ({ page }) => {
        const textarea = page.getByPlaceholder('Full residential address');
        await textarea.fill('123 Main Street, Apt 4');
        await expect(textarea).toHaveValue('123 Main Street, Apt 4');
    });

    test('should accept valid city', async ({ page }) => {
        const input = page.getByPlaceholder('e.g., Mumbai');
        await input.fill('Chennai');
        await expect(input).toHaveValue('Chennai');
    });

    test('should accept valid state', async ({ page }) => {
        const input = page.getByPlaceholder('e.g., Maharashtra');
        await input.fill('Tamil Nadu');
        await expect(input).toHaveValue('Tamil Nadu');
    });

    test('should accept valid PIN code', async ({ page }) => {
        const input = page.getByPlaceholder('400001');
        await input.fill('600001');
        await expect(input).toHaveValue('600001');
    });
});

// ── Form Validation — Negative ─────────────────────────────────────────────────

test.describe('Student Add Page — Negative Validations', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students/new');
        await page.waitForLoadState('networkidle');
    });

    test('should show error toast when saving with empty first name', async ({ page }) => {
        // Fill last name and email but leave first name empty
        await page.getByPlaceholder('e.g., Sharma').fill('Doe');
        await page.getByPlaceholder('rahul.sharma@college.edu').fill('test@email.com');
        await page.getByRole('button', { name: /Create Student|Save Student/i }).click();
        // An error toast should appear
        await expect(page.getByText('First Name is required')).toBeVisible();
    });

    test('should show error toast when saving with empty last name', async ({ page }) => {
        await page.getByPlaceholder('e.g., Rahul').fill('John');
        await page.getByPlaceholder('rahul.sharma@college.edu').fill('test@email.com');
        await page.getByRole('button', { name: /Create Student|Save Student/i }).click();
        await expect(page.getByText('Last Name is required')).toBeVisible();
    });

    test('should show error toast when saving with empty email', async ({ page }) => {
        await page.getByPlaceholder('e.g., Rahul').fill('John');
        await page.getByPlaceholder('e.g., Sharma').fill('Doe');
        await page.getByRole('button', { name: /Create Student|Save Student/i }).click();
        await expect(page.getByText('Email is required')).toBeVisible();
    });

    test('should show error toast for invalid email format', async ({ page }) => {
        await page.getByPlaceholder('e.g., Rahul').fill('John');
        await page.getByPlaceholder('e.g., Sharma').fill('Doe');
        await page.getByPlaceholder('rahul.sharma@college.edu').fill('not-an-email');
        await page.getByRole('button', { name: /Create Student|Save Student/i }).click();
        await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    });

    test('should show error toast for email without domain', async ({ page }) => {
        await page.getByPlaceholder('e.g., Rahul').fill('John');
        await page.getByPlaceholder('e.g., Sharma').fill('Doe');
        await page.getByPlaceholder('rahul.sharma@college.edu').fill('user@');
        await page.getByRole('button', { name: /Create Student|Save Student/i }).click();
        await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    });

    test('should show error toast for email with spaces', async ({ page }) => {
        await page.getByPlaceholder('e.g., Rahul').fill('John');
        await page.getByPlaceholder('e.g., Sharma').fill('Doe');
        await page.getByPlaceholder('rahul.sharma@college.edu').fill('user name@domain.com');
        await page.getByRole('button', { name: /Create Student|Save Student/i }).click();
        await expect(page.getByText('Please enter a valid email address')).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 2. TAB NAVIGATION
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Student Add Page — Tab Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students/new');
        await page.waitForLoadState('networkidle');
    });

    test('clicking Academic tab should show academic fields', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        await expect(page.getByText('Academic Information')).toBeVisible();
        await expect(page.getByPlaceholder('e.g., 2021CSE001')).toBeVisible(); // Roll Number
    });

    test('clicking Academic tab should show degree dropdown', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const degreeSelect = page.locator('select').filter({ hasText: 'B.Tech' });
        await expect(degreeSelect).toBeVisible();
    });

    test('Academic tab – should accept valid CGPA', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const cgpaInput = page.getByPlaceholder('8.5');
        await cgpaInput.fill('9.2');
        await expect(cgpaInput).toHaveValue('9.2');
    });

    test('Academic tab – should accept valid 10th percentage', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('90.5');
        await input.fill('95.5');
        await expect(input).toHaveValue('95.5');
    });

    test('Academic tab – should accept valid 12th percentage', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('88.0');
        await input.fill('92.3');
        await expect(input).toHaveValue('92.3');
    });

    test('Academic tab – should accept graduation year', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('2025');
        await input.fill('2026');
        await expect(input).toHaveValue('2026');
    });

    test('Academic tab – should accept current semester', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('6');
        await input.fill('7');
        await expect(input).toHaveValue('7');
    });

    test('clicking Placement tab should show placement fields', async ({ page }) => {
        await page.getByRole('button', { name: 'Placement', exact: true }).click();
        await expect(page.getByText('Placement & Eligibility')).toBeVisible();
    });

    test('Placement tab – should toggle eligible for hiring checkbox', async ({ page }) => {
        await page.getByRole('button', { name: 'Placement', exact: true }).click();
        const checkbox = page.locator('#eligible_for_hiring');
        if (await checkbox.isVisible()) {
            const initialState = await checkbox.isChecked();
            await checkbox.click();
            const newState = await checkbox.isChecked();
            expect(newState).not.toBe(initialState);
        }
    });

    test('Placement tab – should accept placed company name', async ({ page }) => {
        await page.getByRole('button', { name: 'Placement', exact: true }).click();
        const input = page.getByPlaceholder('e.g., Google, Infosys');
        if (await input.isVisible()) {
            await input.fill('TCS');
            await expect(input).toHaveValue('TCS');
        }
    });

    test('clicking Assessments tab should show assessment section', async ({ page }) => {
        await page.getByRole('button', { name: 'Assessments', exact: true }).click();
        await expect(page.getByText('Assessment & Performance')).toBeVisible();
    });

    test('clicking Activity Log tab should show activity section', async ({ page }) => {
        await page.getByRole('button', { name: 'Activity Log', exact: true }).click();
        await expect(page.getByText(/Additional|Activity|Notes/i)).toBeVisible();
    });

    test('should preserve data when switching between tabs', async ({ page }) => {
        // Enter data on Overview
        await page.getByPlaceholder('e.g., Rahul').fill('PreserveTest');
        // Switch to Academic
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        await expect(page.getByText('Academic Information')).toBeVisible();
        // Switch back to Overview
        await page.getByRole('button', { name: 'Overview', exact: true }).click();
        // Data should be preserved
        await expect(page.getByPlaceholder('e.g., Rahul')).toHaveValue('PreserveTest');
    });

    test('should highlight the active tab with amber color', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const academicTab = page.getByRole('button', { name: 'Academic', exact: true });
        await expect(academicTab).toHaveClass(/bg-amber-600/);
        // Overview should no longer be highlighted
        const overviewTab = page.getByRole('button', { name: 'Overview', exact: true });
        await expect(overviewTab).not.toHaveClass(/bg-amber-600/);
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 3. CANCEL NAVIGATION
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Student Add Page — Cancel Navigation', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students/new');
        await page.waitForLoadState('networkidle');
    });

    test('Cancel button should navigate back to student list', async ({ page }) => {
        await page.getByRole('button', { name: /Cancel/i }).first().click();
        await expect(page).toHaveURL(/\/app\/students$/);
    });

    test('Back arrow should navigate to student list', async ({ page }) => {
        await page.locator('a[href="/app/students"]').first().click();
        await expect(page).toHaveURL(/\/app\/students$/);
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 4. STUDENT DETAIL VIEW MODE — TAB-BASED CONTENT
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Student Detail View Mode — Tab Content', () => {
    // This test group navigates to a student detail page.
    // If there are no students, these tests will be skipped gracefully.

    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        // First grab a student id from the list
        await page.goto('/app/students');
        await page.waitForLoadState('networkidle');
    });

    test('clicking a student row View link should show detail page with tabs', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        // Should see the Overview tab active
        const overviewTab = page.getByRole('button', { name: 'Overview', exact: true });
        await expect(overviewTab).toBeVisible();
        await expect(overviewTab).toHaveClass(/bg-amber-600/);

        // Should see student name in the hero card
        await expect(page.locator('h2').first()).toBeVisible();
    });

    test('should show Edit Student button in view mode', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('link', { name: /Edit Student/i })).toBeVisible();
    });

    test('Overview tab should show stat cards (CGPA, Tests Taken, Avg Score, Grad Year)', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await expect(page.getByText('CGPA')).toBeVisible();
        await expect(page.getByText('Tests Taken')).toBeVisible();
        await expect(page.getByText('Avg Score')).toBeVisible();
        await expect(page.getByText('Grad Year')).toBeVisible();
    });

    test('Clicking Integrity tab should show risk category and violation counts', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Integrity', exact: true }).click();
        await expect(page.getByText('Risk Category')).toBeVisible();
        await expect(page.getByText('Avg Integrity Score')).toBeVisible();
        await expect(page.getByText('Total Violations')).toBeVisible();
    });

    test('Clicking Placement tab should show eligibility and placement status', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Placement', exact: true }).click();
        await expect(page.getByText('Eligible for Hiring')).toBeVisible();
        await expect(page.getByText('Placement Status')).toBeVisible();
        await expect(page.getByText('Placement Journey')).toBeVisible();
    });

    test('Clicking Assessments tab should show assessment section', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Assessments', exact: true }).click();
        await expect(page.getByText('Assessment History')).toBeVisible();
    });

    test('Clicking Documents tab should show document links', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Documents', exact: true }).click();
        await expect(page.getByText('Documents & Links')).toBeVisible();
        await expect(page.getByText('Resume')).toBeVisible();
        await expect(page.getByText('Transcript')).toBeVisible();
    });

    test('Clicking Activity Log tab should show activity placeholder', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Activity Log', exact: true }).click();
        await expect(page.getByText('Activity tracking coming soon')).toBeVisible();
    });

    test('Clicking Academic tab should show academic performance details', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        await expect(page.getByText('Academic Performance')).toBeVisible();
        await expect(page.getByText('Pre-University Scores')).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 5. STUDENT DETAIL VIEW — INTEGRITY TAB DETAILS
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Student Detail View — Integrity Tab Details', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students');
        await page.waitForLoadState('networkidle');
    });

    test('Integrity tab should show Blacklisted and Suspended fields', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Integrity', exact: true }).click();
        await expect(page.getByText('Blacklisted')).toBeVisible();
        await expect(page.getByText('Suspended')).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 6. STUDENT DETAIL VIEW — PLACEMENT TAB DETAILS
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Student Detail View — Placement Tab Journey', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students');
        await page.waitForLoadState('networkidle');
    });

    test('Placement tab should show full journey fields (Shortlisted, Offer, Joined)', async ({ page }) => {
        const viewLink = page.locator('a[href*="/app/students/"]').filter({ has: page.locator('svg.lucide-eye') }).first();
        if (!(await viewLink.isVisible())) {
            test.skip();
            return;
        }
        await viewLink.click();
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: 'Placement', exact: true }).click();
        await expect(page.getByText('Shortlisted')).toBeVisible();
        await expect(page.getByText('Offer Released')).toBeVisible();
        await expect(page.getByText('Offer Accepted')).toBeVisible();
        await expect(page.getByText('Has Joined')).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 7. FULL FORM FILL — E2E POSITIVE FLOW
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Student Add Page — Full Form Fill E2E', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students/new');
        await page.waitForLoadState('networkidle');
    });

    test('should fill all fields across multiple tabs without errors', async ({ page }) => {
        // ── Overview Tab ──
        await page.getByPlaceholder('e.g., Rahul').fill('Integration');
        await page.getByPlaceholder('e.g., Sharma').fill('TestStudent');
        await page.getByPlaceholder('rahul.sharma@college.edu').fill('integration.test@university.edu');
        await page.getByPlaceholder('+91 98765 43210').fill('+91 99999 88888');
        await page.getByPlaceholder('e.g., Mumbai').fill('Bangalore');
        await page.getByPlaceholder('e.g., Maharashtra').fill('Karnataka');
        await page.getByPlaceholder('400001').fill('560001');

        // ── Academic Tab ──
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        await page.getByPlaceholder('e.g., 2021CSE001').fill('2024CSE042');
        await page.getByPlaceholder('e.g., Computer Science & Engineering').fill('Computer Science');
        await page.getByPlaceholder('2025').fill('2026');
        await page.getByPlaceholder('8.5').fill('8.8');
        await page.getByPlaceholder('90.5').fill('91.0');
        await page.getByPlaceholder('88.0').fill('87.5');

        // ── Switch back to verify data persistence ──
        await page.getByRole('button', { name: 'Overview', exact: true }).click();
        await expect(page.getByPlaceholder('e.g., Rahul')).toHaveValue('Integration');
        await expect(page.getByPlaceholder('e.g., Sharma')).toHaveValue('TestStudent');

        // ── The page should be functional and not crash ──
        await expect(page.getByText('Personal Information')).toBeVisible();
    });
});

// ════════════════════════════════════════════════════════════════════════════════
// 8. RANGE / BOUNDARY VALIDATIONS
// ════════════════════════════════════════════════════════════════════════════════

test.describe('Student Add Page — Range / Boundary Validations', () => {
    test.beforeEach(async ({ page }) => {
        await injectAuth(page);
        await page.goto('/app/students/new');
        await page.waitForLoadState('networkidle');
    });

    test('should accept CGPA at lower bound (0)', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('8.5');
        await input.fill('0');
        await expect(input).toHaveValue('0');
    });

    test('should accept CGPA at upper bound (10)', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('8.5');
        await input.fill('10');
        await expect(input).toHaveValue('10');
    });

    test('should accept percentage at 0', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('90.5');
        await input.fill('0');
        await expect(input).toHaveValue('0');
    });

    test('should accept percentage at 100', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('90.5');
        await input.fill('100');
        await expect(input).toHaveValue('100');
    });

    test('should accept semester value 1', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('6');
        await input.fill('1');
        await expect(input).toHaveValue('1');
    });

    test('should accept semester value 8', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('6');
        await input.fill('8');
        await expect(input).toHaveValue('8');
    });

    test('should accept active backlogs value 0', async ({ page }) => {
        await page.getByRole('button', { name: 'Academic', exact: true }).click();
        const input = page.getByPlaceholder('0');
        await input.fill('0');
        await expect(input).toHaveValue('0');
    });

    test('first name should handle long strings', async ({ page }) => {
        const longName = 'A'.repeat(200);
        const input = page.getByPlaceholder('e.g., Rahul');
        await input.fill(longName);
        await expect(input).toHaveValue(longName);
    });

    test('email should handle maximum realistic length', async ({ page }) => {
        const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';
        const input = page.getByPlaceholder('rahul.sharma@college.edu');
        await input.fill(longEmail);
        await expect(input).toHaveValue(longEmail);
    });
});
