import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import { mockAssessmentRulesList, mockAssessmentRuleCreate, mockAssessmentRuleDetail } from '../helpers/api-mocks';
import { ASSESSMENT_RULE } from '../helpers/test-data';

test.describe('Phase 1 – Admin: Assessment Rules', () => {

    test.beforeEach(async ({ page }) => {
        await injectMockAuth(page, 'admin');
    });

    // ── A6: Create assessment rule ───────────────────────────────────────────────
    test('A6 – [+] Create assessment rule with skill distribution', async ({ page }) => {
        await mockAssessmentRulesList(page);
        await mockAssessmentRuleCreate(page);
        await page.goto('/app/assessments/rules');
        await page.getByRole('button', { name: /create rule|new rule/i }).click();
        await page.getByLabel(/rule name/i).fill('Software Engineer – 2026 Batch');
        await page.getByLabel(/duration/i).fill('90');
        await page.getByLabel(/total questions/i).fill('50');
        await page.getByRole('button', { name: /save|create/i }).click();
        await expect(page.getByText(/rule created|saved/i)).toBeVisible();
    });

    test('A6 – [-] Create rule without name shows validation error', async ({ page }) => {
        await mockAssessmentRulesList(page);
        await page.goto('/app/assessments/rules');
        await page.getByRole('button', { name: /create rule|new rule/i }).click();
        await page.getByLabel(/duration/i).fill('90');
        await page.getByRole('button', { name: /save|create/i }).click();
        await expect(page.getByText(/name.*required|required/i)).toBeVisible();
    });

    // ── A7: Rule fields persist ──────────────────────────────────────────────────
    test('A7 – [+] Rule fields (cutoff, duration, questions) persist after save', async ({ page }) => {
        await mockAssessmentRuleDetail(page);
        await page.goto(`/app/assessments/rules/${ASSESSMENT_RULE.id}`);
        await expect(page.getByText('90')).toBeVisible();
        await expect(page.getByText('50')).toBeVisible();
        await expect(page.getByText('60')).toBeVisible();
    });

    // ── A8: Strict proctoring mode ───────────────────────────────────────────────
    test('A8 – [+] Proctoring mode set to STRICT is saved correctly', async ({ page }) => {
        await mockAssessmentRuleDetail(page);
        await page.goto(`/app/assessments/rules/${ASSESSMENT_RULE.id}`);
        await expect(page.getByText(/strict/i)).toBeVisible();
    });

    // ── A9: Clone rule ────────────────────────────────────────────────────────────
    test('A9 – [+] Clone an existing rule creates a new independent version', async ({ page }) => {
        await mockAssessmentRulesList(page);
        await mockAssessmentRuleDetail(page);
        await page.route('**/api/assessment-rules/rule-001/clone', (route) =>
            route.fulfill({
                status: 201, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { ...ASSESSMENT_RULE, id: 'rule-002', version: 2 } }),
            })
        );
        await page.goto('/app/assessments/rules');
        await page.getByText('Software Engineer – 2026 Batch').locator('..').getByRole('button', { name: /clone|duplicate/i }).click();
        await expect(page.getByText(/cloned|version 2|new rule/i)).toBeVisible();
    });

    // ── A10: Archive rule with active drives ─────────────────────────────────────
    test('A10 – [-] Archive rule that has active drives is blocked with warning', async ({ page }) => {
        await mockAssessmentRulesList(page);
        await page.route('**/api/assessment-rules/rule-001/archive', (route) =>
            route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Rule has active drives' }) })
        );
        await page.goto('/app/assessments/rules');
        await page.getByText('Software Engineer – 2026 Batch').locator('..').getByRole('button', { name: /archive/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/active drives|cannot archive/i)).toBeVisible();
    });
});
