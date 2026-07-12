// =============================================================================
// Navigation smoke — every portal route loads inside the shell, no crash,
// no console errors. Covers §5.A positive #4 ("click each sidebar item") and
// the load checks that open every module section in §5.
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { ROUTES } from './helpers/admin-config';
import { gotoAndAssert, collectConsoleErrors } from './helpers/admin-utils';

test.describe('Portal navigation smoke', () => {
  for (const route of ROUTES) {
    test(`loads: ${route.label} (${route.key})`, async ({ adminPage }) => {
      const errors = collectConsoleErrors(adminPage);
      await gotoAndAssert(adminPage, route);
      expect(errors, `console errors on ${route.key}: ${errors.join(' | ')}`).toEqual([]);
    });
  }

  test('sidebar renders the three section groups', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/dashboard');
    const nav = adminPage.locator('aside nav');
    await expect(nav.getByText('Overview', { exact: true })).toBeVisible();
    await expect(nav.getByText('Manage', { exact: true })).toBeVisible();
    await expect(nav.getByText('System', { exact: true })).toBeVisible();
  });

  test('sidebar link navigates (Students)', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/dashboard');
    await adminPage.getByRole('navigation').getByRole('link', { name: 'Students', exact: true }).click();
    await expect(adminPage).toHaveURL(/\/app\/superadmin\/students/);
    await expect(adminPage.getByRole('heading', { name: 'Students' })).toBeVisible();
  });
});
