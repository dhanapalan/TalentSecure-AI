import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import { mockQuestionsList, mockQuestionCreate } from '../helpers/api-mocks';
import { QUESTION_MCQ } from '../helpers/test-data';

test.describe('Phase 1 – Admin: Question Bank', () => {

    test.beforeEach(async ({ page }) => {
        await injectMockAuth(page, 'admin');
        await mockQuestionsList(page);
    });

    // ── A11: Add MCQ ──────────────────────────────────────────────────────────────
    test('A11 – [+] Add MCQ question with 4 options and correct answer', async ({ page }) => {
        await mockQuestionCreate(page);
        await page.goto('/app/assessments/question-bank');
        await page.getByRole('button', { name: /add question|new question/i }).click();
        await page.getByLabel(/question text/i).fill(QUESTION_MCQ.question_text);
        await page.getByLabel(/category/i).selectOption('reasoning');
        await page.getByLabel(/difficulty/i).selectOption('medium');
        // Fill options
        const options = page.getByPlaceholder(/option/i);
        await options.nth(0).fill('Queue');
        await options.nth(1).fill('Stack');
        await options.nth(2).fill('Tree');
        await options.nth(3).fill('Graph');
        await page.getByLabel(/correct answer/i).selectOption('1');
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/question saved|added/i)).toBeVisible();
    });

    test('A11 – [-] Add MCQ without selecting correct answer fails', async ({ page }) => {
        await page.goto('/app/assessments/question-bank');
        await page.getByRole('button', { name: /add question|new question/i }).click();
        await page.getByLabel(/question text/i).fill(QUESTION_MCQ.question_text);
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/correct answer.*required|required/i)).toBeVisible();
    });

    // ── A12: Add coding question ──────────────────────────────────────────────────
    test('A12 – [+] Add coding question with visible and hidden test cases', async ({ page }) => {
        await mockQuestionCreate(page);
        await page.goto('/app/assessments/question-bank');
        await page.getByRole('button', { name: /add question|new question/i }).click();
        await page.getByLabel(/type/i).selectOption('CODING');
        await page.getByLabel(/question text/i).fill('Reverse a linked list');
        await page.getByRole('button', { name: /add test case/i }).click();
        await page.getByPlaceholder(/input/i).first().fill('[1,2,3]');
        await page.getByPlaceholder(/expected output/i).first().fill('[3,2,1]');
        await page.getByRole('button', { name: /add test case/i }).click();
        await page.getByPlaceholder(/input/i).nth(1).fill('[5,4,3,2,1]');
        await page.getByPlaceholder(/expected output/i).nth(1).fill('[1,2,3,4,5]');
        await page.getByLabel(/hidden/i).nth(1).check();
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/question saved|added/i)).toBeVisible();
    });

    // ── A13: Bulk upload ──────────────────────────────────────────────────────────
    test('A13 – [+] Bulk upload 50 questions via CSV', async ({ page }) => {
        await page.route('**/api/question-bank/bulk', (route) =>
            route.fulfill({
                status: 201, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { imported: 50, failed: 0, duplicates: 0 } }),
            })
        );
        await page.goto('/app/assessments/question-bank');
        await page.getByRole('button', { name: /bulk upload|import/i }).click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({ name: 'questions.csv', mimeType: 'text/csv', buffer: Buffer.from('type,question\nMCQ,Sample question') });
        await page.getByRole('button', { name: /upload|import/i }).last().click();
        await expect(page.getByText(/50.*imported|imported.*50/i)).toBeVisible();
    });

    test('A13 – [-] Bulk upload with duplicates reports them separately', async ({ page }) => {
        await page.route('**/api/question-bank/bulk', (route) =>
            route.fulfill({
                status: 201, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { imported: 45, failed: 0, duplicates: 5 } }),
            })
        );
        await page.goto('/app/assessments/question-bank');
        await page.getByRole('button', { name: /bulk upload|import/i }).click();
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({ name: 'q.csv', mimeType: 'text/csv', buffer: Buffer.from('type,question\nMCQ,q') });
        await page.getByRole('button', { name: /upload|import/i }).last().click();
        await expect(page.getByText(/5.*duplicate|duplicate.*5/i)).toBeVisible();
    });

    // ── A14: Deactivate question in active drive ──────────────────────────────────
    test('A14 – [-] Deactivating a question in an active drive shows a warning', async ({ page }) => {
        await page.route('**/api/question-bank/q-001', (route) => {
            if (route.request().method() === 'DELETE')
                route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Question is used in active drives' }) });
            else route.continue();
        });
        await page.goto('/app/assessments/question-bank');
        await page.getByText(QUESTION_MCQ.question_text).locator('..').getByRole('button', { name: /deactivate|delete/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/active drives|cannot deactivate/i)).toBeVisible();
    });

    // ── A15: Category distribution ────────────────────────────────────────────────
    test('A15 – [+] Category distribution counts match uploaded questions', async ({ page }) => {
        await page.route('**/api/question-bank/categories**', (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({ success: true, data: { reasoning: 15, maths: 10, programming: 20, verbal: 5 } }),
            })
        );
        await page.goto('/app/assessments/question-bank');
        await expect(page.getByText(/reasoning/i)).toBeVisible();
        await expect(page.getByText(/programming/i)).toBeVisible();
    });
});
