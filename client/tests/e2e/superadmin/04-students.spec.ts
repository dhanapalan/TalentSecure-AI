// =============================================================================
// Module D — Students (global roster)  ·  Ref: §5.D
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('D. Students', () => {
  test('D1 — global roster loads', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/students');
    await expect(adminPage.getByRole('heading', { name: 'Students' })).toBeVisible();
  });

  test('D2 — search by name/email responds without error', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    await adminPage.goto('/app/superadmin/students');
    const search = adminPage.getByPlaceholder(/search/i).first();
    if (await search.count()) {
      await search.fill('zzz-no-such-student-xyz');
      await adminPage.waitForTimeout(800);
      await expect(adminPage.getByText(/no students found/i).or(adminPage.locator('table')).first()).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test('D4 — opening a student row navigates to a detail page', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/students');
    const firstView = adminPage.getByRole('link', { name: /view|details/i }).first();
    if (await firstView.count()) {
      await firstView.click();
      await expect(adminPage).toHaveURL(/\/app\/superadmin\/students\/.+/);
    } else {
      test.skip(true, 'no students seeded to open');
    }
  });
});
