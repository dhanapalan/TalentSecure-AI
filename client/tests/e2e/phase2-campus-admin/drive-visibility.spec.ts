import { test, expect } from '@playwright/test';
import { injectMockAuth } from '../helpers/auth';
import { mockCampusDrivesList, mockDriveDetail } from '../helpers/api-mocks';
import { DRIVE_PUBLISHED, DRIVE } from '../helpers/test-data';

test.describe('Phase 2 – Campus Admin: Drive Visibility (B1–B3)', () => {

    test.beforeEach(async ({ page }) => {
        await injectMockAuth(page, 'campusAdmin');
    });

    // ── B1: Drive appears after assignment ────────────────────────────────────────
    test('B1 – [+] Campus admin sees assigned drive after admin assigns it', async ({ page }) => {
        await mockCampusDrivesList(page, [DRIVE_PUBLISHED]);
        await page.goto('/app/college/drives');
        await expect(page.getByText('Campus Drive – June 2026')).toBeVisible();
    });

    // ── B2: Drive details are correct ────────────────────────────────────────────
    test('B2 – [+] Drive details show correct name, schedule, rule, proctoring mode', async ({ page }) => {
        await mockCampusDrivesList(page, [DRIVE_PUBLISHED]);
        await page.route(`**/api/campus-drives/${DRIVE.id}**`, (route) =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: DRIVE_PUBLISHED }) })
        );
        await page.goto('/app/college/drives');
        await page.getByText('Campus Drive – June 2026').click();
        await expect(page.getByText(/proctoring|strict/i)).toBeVisible();
        await expect(page.getByText(/June 2026|scheduled/i)).toBeVisible();
    });

    test('B2 – [-] Drive detail page for wrong drive ID shows not found', async ({ page }) => {
        await page.route('**/api/campus-drives/bad-id**', (route) =>
            route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Drive not found' }) })
        );
        await page.goto('/app/college/drives/bad-id');
        await expect(page.getByText(/not found|404/i)).toBeVisible();
    });

    // ── B3: Drive from another campus is not visible ──────────────────────────────
    test('B3 – [-] Campus admin does NOT see drives assigned to other campuses', async ({ page }) => {
        // Campus admin of col-001 should only see col-001 drives
        await mockCampusDrivesList(page, []); // empty — no drives for this campus
        await page.goto('/app/college/drives');
        await expect(page.getByText('Campus Drive – June 2026')).not.toBeVisible();
        await expect(page.getByText(/no drives|empty/i)).toBeVisible();
    });
});
