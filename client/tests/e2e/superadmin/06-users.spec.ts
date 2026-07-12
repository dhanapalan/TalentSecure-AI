// =============================================================================
// Module F — Users  ·  Ref: §5.F
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { ALLOW_MUTATIONS } from './helpers/admin-config';
import { uniqueSuffix, collectConsoleErrors } from './helpers/admin-utils';

test.describe('F. Users', () => {
  test('F1 — user list loads with search + table', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/users');
    await expect(adminPage.getByRole('heading', { name: 'All Users' })).toBeVisible();
    await expect(adminPage.getByPlaceholder(/search by name/i)).toBeVisible();
    await expect(adminPage.getByRole('button', { name: /invite user/i })).toBeVisible();
  });

  test('F2 — search responds without error', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    await adminPage.goto('/app/superadmin/users');
    await adminPage.getByPlaceholder(/search by name/i).fill('zzz-no-such-user-xyz');
    await adminPage.waitForTimeout(800);
    expect(errors).toEqual([]);
  });

  test('F4 — invite panel reveals all fields', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/users');
    await adminPage.getByRole('button', { name: /invite user/i }).click();
    await expect(adminPage.getByPlaceholder(/full name/i)).toBeVisible();
    await expect(adminPage.getByPlaceholder('Email *')).toBeVisible();
    await expect(adminPage.getByPlaceholder(/temporary password/i)).toBeVisible();
    await expect(adminPage.getByRole('button', { name: /create user/i })).toBeVisible();
  });

  test('F-edge2 — invite with missing fields is blocked', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/users');
    await adminPage.getByRole('button', { name: /invite user/i }).click();
    await adminPage.getByRole('button', { name: /create user/i }).click();
    // No user created: panel stays open / an error is shown, no success toast.
    await expect(adminPage.getByText(/created successfully|user invited/i)).toHaveCount(0);
  });

  test.describe('mutating', () => {
    test.skip(!ALLOW_MUTATIONS, 'set ADMIN_ALLOW_MUTATIONS=1 to run create flows');

    test('F4b — invite a college_admin with unique email', async ({ adminPage }) => {
      const suffix = uniqueSuffix();
      await adminPage.goto('/app/superadmin/users');
      await adminPage.getByRole('button', { name: /invite user/i }).click();
      await adminPage.getByPlaceholder(/full name/i).fill(`QA User ${suffix}`);
      await adminPage.getByPlaceholder('Email *').fill(`qa-user-${suffix}@example.com`);
      await adminPage.getByPlaceholder(/temporary password/i).fill('TempPass123!');
      await adminPage.getByRole('button', { name: /create user/i }).click();
      await expect(adminPage.getByText(/created|invited|success/i).first()).toBeVisible({ timeout: 15_000 });
    });
  });
});
