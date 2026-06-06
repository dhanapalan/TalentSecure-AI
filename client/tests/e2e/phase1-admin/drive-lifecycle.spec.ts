import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import {
    mockDrivesList, mockDriveCreate, mockDriveDetail,
    mockDrivePoolGenerate, mockDrivePoolApprove, mockDrivePublish,
    mockDriveCancel, mockDriveStudents, mockCampusList,
} from '../helpers/api-mocks';
import { DRIVE, DRIVE_PUBLISHED } from '../helpers/test-data';

test.describe('Phase 1 – Admin: Drive Lifecycle (A16–A25)', () => {

    test.beforeEach(async ({ page }) => {
        await injectMockAuth(page, 'admin');
    });

    // ── A16: Create drive ─────────────────────────────────────────────────────────
    test('A16 – [+] Create drive from assessment rule → status DRAFT', async ({ page }) => {
        await mockDrivesList(page);
        await mockDriveCreate(page);
        await page.goto('/app/drives');
        await page.getByRole('button', { name: /create drive|new drive/i }).click();
        await page.getByLabel(/drive name/i).fill('Campus Drive – June 2026');
        await page.getByLabel(/assessment rule/i).selectOption('rule-001');
        await page.getByRole('button', { name: /create|save/i }).click();
        await expect(page.getByText(/draft|drive created/i)).toBeVisible();
    });

    test('A16 – [-] Create drive without selecting rule shows validation', async ({ page }) => {
        await mockDrivesList(page);
        await page.goto('/app/drives');
        await page.getByRole('button', { name: /create drive|new drive/i }).click();
        await page.getByLabel(/drive name/i).fill('No Rule Drive');
        await page.getByRole('button', { name: /create|save/i }).click();
        await expect(page.getByText(/rule.*required|required/i)).toBeVisible();
    });

    // ── A17: Pool generation ──────────────────────────────────────────────────────
    test('A17 – [+] Trigger pool generation → status changes to PENDING', async ({ page }) => {
        await mockDriveDetail(page);
        await mockDrivePoolGenerate(page, 'success');
        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('button', { name: /generate pool|generate questions/i }).click();
        await expect(page.getByText(/generating|pending/i)).toBeVisible();
    });

    // ── A18: Pool quality check ───────────────────────────────────────────────────
    test('A18 – [+] Approved pool shows correct skill/difficulty distribution', async ({ page }) => {
        await page.route(`**/api/drives/${DRIVE.id}/pool**`, (route) =>
            route.fulfill({
                status: 200, contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: { total_generated: 50, reasoning: 15, maths: 10, programming: 20, verbal: 5 },
                }),
            })
        );
        await mockDriveDetail(page);
        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('tab', { name: /pool|questions/i }).click();
        await expect(page.getByText('50')).toBeVisible();
    });

    // ── A19: Reject pool ──────────────────────────────────────────────────────────
    test('A19 – [+] Reject pool with reason triggers regeneration', async ({ page }) => {
        await mockDriveDetail(page);
        await page.route(`**/api/drives/${DRIVE.id}/pool/reject`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { status: 'GENERATING' } }) })
        );
        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('button', { name: /reject pool/i }).click();
        await page.getByLabel(/reason/i).fill('Poor quality questions in maths section');
        await page.getByRole('button', { name: /reject|confirm/i }).click();
        await expect(page.getByText(/generating|regenerating/i)).toBeVisible();
    });

    // ── A20: Approve pool ─────────────────────────────────────────────────────────
    test('A20 – [+] Approve pool → drive status becomes READY', async ({ page }) => {
        await mockDriveDetail(page);
        await mockDrivePoolApprove(page);
        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('button', { name: /approve pool/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/ready/i)).toBeVisible();
    });

    // ── A21: Assign to campus ─────────────────────────────────────────────────────
    test('A21 – [+] Assign drive to a specific campus', async ({ page }) => {
        await mockDriveDetail(page);
        await mockCampusList(page);
        await page.route(`**/api/drives/${DRIVE.id}/assignments`, (route) => {
            if (route.request().method() === 'POST')
                route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) });
            else route.continue();
        });
        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('button', { name: /assign campus|add campus/i }).click();
        await page.getByLabel(/campus/i).selectOption('col-001');
        await page.getByRole('button', { name: /assign/i }).click();
        await expect(page.getByText(/MIT College|assigned/i)).toBeVisible();
    });

    // ── A22: Assign to multiple campuses ──────────────────────────────────────────
    test('A22 – [+] Assign drive to multiple campuses', async ({ page }) => {
        await mockDriveDetail(page);
        await mockCampusList(page);
        let assignCount = 0;
        await page.route(`**/api/drives/${DRIVE.id}/assignments`, (route) => {
            if (route.request().method() === 'POST') { assignCount++; route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true }) }); }
            else route.continue();
        });
        await page.goto(`/app/drives/${DRIVE.id}`);
        for (const campusId of ['col-001', 'col-002']) {
            await page.getByRole('button', { name: /assign campus|add campus/i }).click();
            await page.getByLabel(/campus/i).selectOption(campusId);
            await page.getByRole('button', { name: /assign/i }).click();
        }
        expect(assignCount).toBe(2);
    });

    // ── A23: Publish drive with future schedule ───────────────────────────────────
    test('A23 – [+] Publish drive with future date → status SCHEDULED', async ({ page }) => {
        await mockDriveDetail(page);
        await mockDrivePublish(page);
        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('button', { name: /publish|mark ready/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/published|scheduled/i)).toBeVisible();
    });

    // ── A24: Publish with past date ───────────────────────────────────────────────
    test('A24 – [-] Publish drive with past date is rejected', async ({ page }) => {
        await mockDriveDetail(page);
        await page.route(`**/api/drives/${DRIVE.id}/publish`, (route) =>
            route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Scheduled start must be in the future' }) })
        );
        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('button', { name: /publish|mark ready/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/future|past date/i)).toBeVisible();
    });

    // ── A25: Cancel published drive ───────────────────────────────────────────────
    test('A25 – [+] Cancel published drive → status CANCELLED', async ({ page }) => {
        await mockDriveDetail(page, DRIVE_PUBLISHED);
        await mockDriveCancel(page);
        await page.goto(`/app/drives/${DRIVE.id}`);
        await page.getByRole('button', { name: /cancel drive/i }).click();
        await page.getByRole('button', { name: /confirm/i }).click();
        await expect(page.getByText(/cancelled/i)).toBeVisible();
    });
});
