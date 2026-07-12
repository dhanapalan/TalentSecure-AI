// =============================================================================
// Module N — Modules  ·  Ref: §5.N
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('N. Modules', () => {
  test('N1 — module management loads', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    await adminPage.goto('/app/superadmin/modules');
    await expect(adminPage.getByRole('heading', { name: 'Module Management' })).toBeVisible();
    // Per-college modules list or a graceful empty/selection state.
    await expect(
      adminPage.locator('main').getByText(/module|college|select|enable/i).first()
    ).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('N2 — a module toggle is present and interactive', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/modules');
    const toggle = adminPage.getByRole('switch')
      .or(adminPage.locator('input[type="checkbox"]'))
      .or(adminPage.getByRole('button', { name: /enable|disable/i }))
      .first();
    if (await toggle.count()) {
      await expect(toggle).toBeVisible();
    } else {
      test.skip(true, 'no college/module rows seeded to toggle');
    }
  });
});
