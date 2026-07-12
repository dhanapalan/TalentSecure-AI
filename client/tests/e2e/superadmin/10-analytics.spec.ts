// =============================================================================
// Module J — Analytics  ·  Ref: §5.J
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('J. Analytics', () => {
  test('J1-3 — overview / colleges / reports views load', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    for (const view of ['', '?view=colleges', '?view=reports']) {
      await adminPage.goto(`/app/superadmin/analytics${view}`);
      await expect(adminPage.locator('main h1, main h2').first()).toBeVisible({ timeout: 15_000 });
    }
    expect(errors).toEqual([]);
  });

  test('J-edge2 — rapid view switching does not crash', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/analytics');
    for (let i = 0; i < 4; i++) {
      await adminPage.goto('/app/superadmin/analytics?view=colleges');
      await adminPage.goto('/app/superadmin/analytics?view=reports');
    }
    await expect(adminPage.locator('main h1, main h2').first()).toBeVisible();
  });
});
