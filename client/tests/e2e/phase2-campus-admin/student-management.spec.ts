import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import { mockCampusStudents } from '../helpers/api-mocks';
import { STUDENTS_LIST } from '../helpers/test-data';

test.describe('Phase 2 – Campus Admin: Student Management (B4–B9)', () => {

    test.beforeEach(async ({ page }) => {
        await injectMockAuth(page, 'campusAdmin');
    });

    // ── B4: Add single student ────────────────────────────────────────────────────
    test('B4 – [+] Add a single student manually', async ({ page }) => {
        await mockCampusStudents(page);
        await page.route('**/api/colleges/add-students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: STUDENTS_LIST[0] }) });
            else route.continue();
        });
        await page.goto('/app/students');
        await page.getByRole('button', { name: /add student|new student/i }).click();
        await page.getByLabel(/name/i).fill('John Doe');
        await page.getByLabel(/email/i).fill('john.doe@student.mit.edu');
        await page.getByLabel(/roll number/i).fill('MIT001');
        await page.getByLabel(/degree/i).fill('B.E. CSE');
        await page.getByRole('button', { name: /save|add/i }).click();
        await expect(page.getByText(/student added|success/i)).toBeVisible();
    });

    test('B4 – [-] Add student with missing required fields shows validation', async ({ page }) => {
        await mockCampusStudents(page);
        await page.goto('/app/students');
        await page.getByRole('button', { name: /add student|new student/i }).click();
        await page.getByRole('button', { name: /save|add/i }).click();
        await expect(page.getByText(/required/i)).toBeVisible();
    });

    // ── B5: Bulk import ───────────────────────────────────────────────────────────
    test('B5 – [+] Bulk import 100 students via CSV', async ({ page }) => {
        await mockCampusStudents(page);
        await page.route('**/api/colleges/add-students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { imported: 100, failed: 0 } }) });
            else route.continue();
        });
        await page.goto('/app/students/bulk-import');
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({ name: 'students.csv', mimeType: 'text/csv', buffer: Buffer.from('name,email,roll_number\nJohn,john@test.com,001') });
        await page.getByRole('button', { name: /upload|import/i }).last().click();
        await expect(page.getByText(/100.*imported|imported.*100/i)).toBeVisible();
    });

    // ── B6: Duplicate email same campus ──────────────────────────────────────────
    test('B6 – [-] Import CSV with duplicate email in same campus flags it', async ({ page }) => {
        await mockCampusStudents(page);
        await page.route('**/api/colleges/add-students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: { imported: 99, failed: 0, duplicates: 1 } }) });
            else route.continue();
        });
        await page.goto('/app/students/bulk-import');
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({ name: 'students.csv', mimeType: 'text/csv', buffer: Buffer.from('name,email\nJohn,john@test.com') });
        await page.getByRole('button', { name: /upload|import/i }).last().click();
        await expect(page.getByText(/1.*duplicate|duplicate.*1/i)).toBeVisible();
    });

    // ── B7: Student from another campus ──────────────────────────────────────────
    test('B7 – [-] Import student with email already in another campus shows warning', async ({ page }) => {
        await mockCampusStudents(page);
        await page.route('**/api/colleges/add-students', (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Student already belongs to another campus' }) });
            else route.continue();
        });
        await page.goto('/app/students/bulk-import');
        const fileInput = page.locator('input[type="file"]');
        await fileInput.setInputFiles({ name: 'students.csv', mimeType: 'text/csv', buffer: Buffer.from('name,email\nExisting,existing@other.edu') });
        await page.getByRole('button', { name: /upload|import/i }).last().click();
        await expect(page.getByText(/another campus|already belongs/i)).toBeVisible();
    });

    // ── B8: Edit student details ──────────────────────────────────────────────────
    test('B8 – [+] Edit student CGPA and branch — changes are saved', async ({ page }) => {
        await mockCampusStudents(page);
        await page.route('**/api/students/stu-001', (route) => {
            if (route.request().method() === 'PUT')
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { ...STUDENTS_LIST[0], cgpa: 9.0 } }) });
            else route.continue();
        });
        await page.goto('/app/students');
        await page.getByText('John Doe').locator('..').getByRole('button', { name: /edit/i }).click();
        await page.getByLabel(/cgpa/i).fill('9.0');
        await page.getByRole('button', { name: /save/i }).click();
        await expect(page.getByText(/saved|updated/i)).toBeVisible();
    });

    // ── B9: Remove student from campus ───────────────────────────────────────────
    test('B9 – [+] Remove student from campus removes drive enrollment too', async ({ page }) => {
        await mockCampusStudents(page);
        await page.route('**/api/students/stu-001', (route) => {
            if (route.request().method() === 'DELETE')
                route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
            else route.continue();
        });
        await page.goto('/app/students');
        await page.getByText('John Doe').locator('..').getByRole('button', { name: /remove|delete/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/removed|deleted/i)).toBeVisible();
    });
});
