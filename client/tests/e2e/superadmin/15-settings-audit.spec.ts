// =============================================================================
// Module O — Settings & Audit Trail  ·  Ref: §5.O
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('O. Settings & Audit', () => {
  test('O1 — system settings load', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    await adminPage.goto('/app/superadmin/settings');
    await expect(adminPage.locator('main h1, main h2').first()).toBeVisible({ timeout: 15_000 });
    expect(errors).toEqual([]);
  });

  test('O7 — backup & security tab loads', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/settings?tab=backup');
    await expect(adminPage.locator('main h1, main h2').first()).toBeVisible();
    await expect(adminPage).toHaveURL(/tab=backup/);
  });

  test('O3 — audit trail loads a timeline or empty state', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/audit-trail');
    await expect(adminPage.getByRole('heading', { name: 'Audit Trail' })).toBeVisible();
    // Real markup is plain divs (space-y-1 divide-y rows), not a <table>/<li>/
    // "timeline"-classed element — match the actual empty-state copy too.
    await expect(
      adminPage.getByText(/no audit logs found/i)
        .or(adminPage.locator('.divide-y > div, [class*="space-y"] > div')).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('O4 — audit filters are present', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/audit-trail');
    const filter = adminPage.getByRole('combobox')
      .or(adminPage.locator('select'))
      .or(adminPage.getByPlaceholder(/search|filter/i))
      .first();
    await expect(filter).toBeVisible({ timeout: 10_000 });
  });
});
