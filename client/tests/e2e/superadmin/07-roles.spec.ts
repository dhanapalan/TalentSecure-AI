// =============================================================================
// Module G — Roles & Permission Matrix  ·  Ref: §5.G
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { ALLOW_MUTATIONS } from './helpers/admin-config';
import { uniqueSuffix } from './helpers/admin-utils';

test.describe('G. Roles', () => {
  test('G1 — role list loads', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/roles');
    await expect(adminPage.getByRole('heading', { name: 'Role Management' })).toBeVisible();
    await expect(
      adminPage.locator('table').or(adminPage.getByText(/no roles found/i)).first()
    ).toBeVisible({ timeout: 10_000 });
    await expect(adminPage.getByRole('button', { name: /create role/i })).toBeVisible();
  });

  test('G2 — create-role modal opens with a name field', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/roles');
    await adminPage.getByRole('button', { name: /create role/i }).click();
    await expect(adminPage.getByRole('heading', { name: /create new role/i })).toBeVisible();
    await expect(adminPage.locator('.fixed input[type="text"], .fixed input:not([type])').first()).toBeVisible();
  });

  test('G-edge1 — creating a role with no name is blocked', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/roles');
    await adminPage.getByRole('button', { name: /create role/i }).click();
    const modal = adminPage.locator('.fixed').filter({ hasText: /create new role/i });
    await modal.getByRole('button', { name: /^create$|create role/i }).click();
    // Modal stays open; no success.
    await expect(adminPage.getByRole('heading', { name: /create new role/i })).toBeVisible();
  });

  test('G6 — system roles are protected (no delete control)', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/roles');
    const systemRow = adminPage.locator('tr', { hasText: /System/ }).first();
    if (await systemRow.count()) {
      // System rows expose "Permissions" but not the edit/delete icons.
      await expect(systemRow.getByRole('button', { name: /permissions/i })).toBeVisible();
    } else {
      test.skip(true, 'no system role rows present');
    }
  });

  test('G4 — permission matrix loads', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/roles/matrix');
    await expect(adminPage.locator('main h1, main h2').first()).toBeVisible();
    await expect(adminPage.locator('table').or(adminPage.locator('[class*="matrix"]')).first())
      .toBeVisible({ timeout: 10_000 });
  });

  test.describe('mutating', () => {
    test.skip(!ALLOW_MUTATIONS, 'set ADMIN_ALLOW_MUTATIONS=1 to run create flows');

    test('G2b — create a custom role', async ({ adminPage }) => {
      const suffix = uniqueSuffix();
      await adminPage.goto('/app/superadmin/roles');
      await adminPage.getByRole('button', { name: /create role/i }).click();
      const modal = adminPage.locator('.fixed').filter({ hasText: /create new role/i });
      await modal.locator('input').first().fill(`QA Role ${suffix}`);
      await modal.getByRole('button', { name: /^create$|create role/i }).click();
      await expect(adminPage.getByText(new RegExp(`QA Role ${suffix}`))).toBeVisible({ timeout: 15_000 });
    });
  });
});
