// =============================================================================
// Module K — Notifications  ·  Ref: §5.K
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { ALLOW_MUTATIONS } from './helpers/admin-config';
import { uniqueSuffix } from './helpers/admin-utils';

test.describe('K. Notifications', () => {
  test('K1-2 — announcements & templates tabs load', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/notifications');
    await expect(adminPage.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    await expect(adminPage.getByRole('button', { name: /announcements/i })).toBeVisible();
    await adminPage.getByRole('button', { name: /email templates/i }).click();
    await expect(adminPage.getByRole('button', { name: /email templates/i })).toBeVisible();
  });

  test('K-edge1/2 — announcement without title/message is blocked (app validation)', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/notifications');
    await adminPage.getByRole('button', { name: /new announcement/i }).click();
    await expect(adminPage.getByRole('heading', { name: /create announcement/i })).toBeVisible();
    // Submit empty → the page toasts "Title and message are required".
    await adminPage.getByRole('button', { name: /^create$/i }).click();
    await expect(adminPage.getByText(/title and message are required/i)).toBeVisible({ timeout: 10_000 });
  });

  test.describe('mutating', () => {
    test.skip(!ALLOW_MUTATIONS, 'set ADMIN_ALLOW_MUTATIONS=1 to run create flows');

    test('K3 — create an Info announcement', async ({ adminPage }) => {
      const suffix = uniqueSuffix();
      await adminPage.goto('/app/superadmin/notifications');
      await adminPage.getByRole('button', { name: /new announcement/i }).click();
      await adminPage.getByPlaceholder(/announcement title/i).fill(`QA Notice ${suffix}`);
      await adminPage.getByPlaceholder(/announcement message/i).fill('Automated QA announcement.');
      await adminPage.getByRole('button', { name: /^create$/i }).click();
      await expect(adminPage.getByText(/announcement created/i)).toBeVisible({ timeout: 15_000 });
      await expect(adminPage.getByText(`QA Notice ${suffix}`)).toBeVisible();
    });

    test('K-edge4 — XSS in title does not execute', async ({ adminPage }) => {
      const suffix = uniqueSuffix();
      let dialogFired = false;
      adminPage.on('dialog', async (d) => { dialogFired = true; await d.dismiss(); });
      await adminPage.goto('/app/superadmin/notifications');
      await adminPage.getByRole('button', { name: /new announcement/i }).click();
      await adminPage.getByPlaceholder(/announcement title/i).fill(`<img src=x onerror=alert(1)>${suffix}`);
      await adminPage.getByPlaceholder(/announcement message/i).fill('xss probe');
      await adminPage.getByRole('button', { name: /^create$/i }).click();
      await adminPage.waitForTimeout(1500);
      expect(dialogFired).toBe(false);
    });
  });
});
