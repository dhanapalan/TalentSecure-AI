// =============================================================================
// §6 — Cross-cutting: Security, Responsive UI, Console health
// =============================================================================

import { test, expect } from '@playwright/test';
import { API_URL, ADMIN, NON_ADMIN } from './helpers/admin-config';
import { cachedLogin, authenticateAsAdmin } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('Security (API)', () => {
  // Matches what the real SuperAdmin frontend calls (services/collegeService.ts) —
  // /api/admin/colleges was never a real endpoint.
  const PROTECTED = `${API_URL}/superadmin/colleges`;

  test('S3 — API call without a JWT is rejected (401/403)', async ({ request }) => {
    const res = await request.get(PROTECTED);
    expect([401, 403]).toContain(res.status());
  });

  test('S4 — API call with a non-super-admin token is forbidden (403)', async ({ request }) => {
    const session = await cachedLogin(request, NON_ADMIN);
    const res = await request.get(PROTECTED, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    // HR must not read the super-admin college registry.
    expect([401, 403]).toContain(res.status());
  });

  test('S-token — a valid super-admin token is accepted', async ({ request }) => {
    const session = await cachedLogin(request, ADMIN);
    const res = await request.get(PROTECTED, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });
    expect(res.status()).toBeLessThan(400);
  });
});

test.describe('Responsive UI', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    test(`dashboard renders at ${vp.name} (${vp.width}px)`, async ({ page, request }) => {
      await authenticateAsAdmin(page, request);
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/app/superadmin/dashboard');
      await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible({ timeout: 15_000 });
      // No horizontal overflow of the document body.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `no horizontal scroll at ${vp.name}`).toBeLessThanOrEqual(4);
    });
  }
});

test.describe('Console health', () => {
  test('P5 — no unhandled console errors on the dashboard happy path', async ({ page, request }) => {
    await authenticateAsAdmin(page, request);
    const errors = collectConsoleErrors(page);
    await page.goto('/app/superadmin/dashboard');
    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await page.waitForTimeout(1000);
    expect(errors).toEqual([]);
  });
});
