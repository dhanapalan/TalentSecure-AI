// =============================================================================
// Module I — Workflows  ·  Ref: §5.I
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { collectConsoleErrors } from './helpers/admin-utils';

test.describe('I. Workflows', () => {
  test('I1 — category views load (aptitude / soft-skills / technical)', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    for (const category of ['aptitude', 'soft-skills', 'technical']) {
      await adminPage.goto(`/app/superadmin/workflows?category=${category}`);
      await expect(adminPage.locator('main h1, main h2').first()).toBeVisible({ timeout: 15_000 });
      await expect(adminPage).toHaveURL(new RegExp(`category=${category}`));
    }
    expect(errors).toEqual([]);
  });

  test('I-base — default workflows page renders', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/workflows');
    await expect(adminPage.locator('main h1, main h2').first()).toBeVisible();
  });
});
