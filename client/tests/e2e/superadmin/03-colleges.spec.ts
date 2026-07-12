// =============================================================================
// Module C — Colleges (list / create / requests / detail)
// Ref: ADMIN_PORTAL_TEST_HANDOVER.md §5.C
//
// Mutating create/XSS/duplicate flows run only with ADMIN_ALLOW_MUTATIONS=1.
// =============================================================================

import { expect } from '@playwright/test';
import { adminTest as test } from './helpers/admin-session';
import { ALLOW_MUTATIONS } from './helpers/admin-config';
import { uniqueSuffix, collectConsoleErrors } from './helpers/admin-utils';

test.describe('C. Colleges', () => {
  test('C1 — list loads with search + table', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/colleges');
    await expect(adminPage.getByRole('heading', { name: 'All Colleges' })).toBeVisible();
    await expect(adminPage.getByPlaceholder('Search colleges...')).toBeVisible();
    await expect(adminPage.locator('table')).toBeVisible();
    await expect(adminPage.getByRole('link', { name: /add college/i })).toBeVisible();
  });

  test('C2 — search updates results without error', async ({ adminPage }) => {
    const errors = collectConsoleErrors(adminPage);
    await adminPage.goto('/app/superadmin/colleges');
    await adminPage.getByPlaceholder('Search colleges...').fill('zzz-no-such-college-xyz');
    // Debounced server search → either an empty state or a filtered table, no crash.
    await expect(adminPage.getByText('No colleges found').or(adminPage.locator('table tbody tr')).first())
      .toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test('C-status filters are interactive', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/colleges');
    for (const label of ['Active', 'Pending', 'Suspended', 'All']) {
      await adminPage.getByRole('button', { name: label, exact: true }).click();
      await expect(adminPage.locator('table')).toBeVisible();
    }
  });

  test('C3 — create form renders every field', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/colleges/new');
    await expect(adminPage.getByRole('heading', { name: 'Add New College' })).toBeVisible();
    for (const name of ['name', 'email', 'phone', 'address', 'city', 'state', 'tpoName', 'tpoEmail', 'studentLimit']) {
      await expect(adminPage.locator(`[name="${name}"]`)).toBeVisible();
    }
    await expect(adminPage.getByRole('button', { name: /create college/i })).toBeVisible();
  });

  test('C-edge1 — empty submit does not create / navigate away', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/colleges/new');
    await adminPage.getByRole('button', { name: /create college/i }).click();
    // Native + app validation block the submit; we stay on the form.
    await expect(adminPage).toHaveURL(/\/app\/superadmin\/colleges\/new/);
    await expect(adminPage.getByText(/added successfully/i)).toHaveCount(0);
  });

  test('C-edge3 — malformed email is rejected by the form', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/colleges/new');
    await adminPage.locator('[name="name"]').fill('QA Validation College');
    await adminPage.locator('[name="email"]').fill('notanemail');
    await adminPage.locator('[name="address"]').fill('1 Test Road');
    await adminPage.locator('[name="city"]').fill('Chennai');
    await adminPage.locator('[name="state"]').fill('Tamil Nadu');
    await adminPage.locator('[name="tpoName"]').fill('QA TPO');
    await adminPage.locator('[name="tpoEmail"]').fill('tpo@college.edu');
    await adminPage.getByRole('button', { name: /create college/i }).click();
    // Invalid college email → blocked (native type=email or app toast). No success, no redirect.
    await expect(adminPage).toHaveURL(/\/app\/superadmin\/colleges\/new/);
    await expect(adminPage.getByText(/added successfully/i)).toHaveCount(0);
  });

  test('C6 — college requests page loads', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/colleges/requests');
    await expect(adminPage.getByRole('heading', { name: 'College Requests' })).toBeVisible();
  });

  // ── Mutating flows (opt-in) ────────────────────────────────────────────────
  test.describe('mutating', () => {
    test.skip(!ALLOW_MUTATIONS, 'set ADMIN_ALLOW_MUTATIONS=1 to run create flows');

    test('C4 — create college with a unique name succeeds', async ({ adminPage }) => {
      const suffix = uniqueSuffix();
      await adminPage.goto('/app/superadmin/colleges/new');
      await adminPage.locator('[name="name"]').fill(`QA College ${suffix}`);
      await adminPage.locator('[name="email"]').fill(`qa-${suffix}@college.edu`);
      await adminPage.locator('[name="phone"]').fill('+91 9876543210');
      await adminPage.locator('[name="address"]').fill('1 Test Road');
      await adminPage.locator('[name="city"]').fill('Chennai');
      await adminPage.locator('[name="state"]').fill('Tamil Nadu');
      await adminPage.locator('[name="tpoName"]').fill('QA TPO');
      await adminPage.locator('[name="tpoEmail"]').fill(`tpo-${suffix}@college.edu`);
      await adminPage.locator('[name="studentLimit"]').fill('100');
      await adminPage.getByRole('button', { name: /create college/i }).click();

      await expect(adminPage.getByText(/added successfully/i)).toBeVisible({ timeout: 15_000 });
      await expect(adminPage).toHaveURL(/\/app\/superadmin\/colleges(\?|$)/, { timeout: 15_000 });
    });

    test('C-edge13 — XSS in name is stored escaped (no dialog fires)', async ({ adminPage }) => {
      const suffix = uniqueSuffix();
      let dialogFired = false;
      adminPage.on('dialog', async (d) => { dialogFired = true; await d.dismiss(); });

      await adminPage.goto('/app/superadmin/colleges/new');
      await adminPage.locator('[name="name"]').fill(`<script>alert('xss')</script>${suffix}`);
      await adminPage.locator('[name="email"]').fill(`xss-${suffix}@college.edu`);
      await adminPage.locator('[name="phone"]').fill('+91 9876543210');
      await adminPage.locator('[name="address"]').fill('1 Test Road');
      await adminPage.locator('[name="city"]').fill('Chennai');
      await adminPage.locator('[name="state"]').fill('Tamil Nadu');
      await adminPage.locator('[name="tpoName"]').fill('QA TPO');
      await adminPage.locator('[name="tpoEmail"]').fill(`tpo-xss-${suffix}@college.edu`);
      await adminPage.getByRole('button', { name: /create college/i }).click();
      await adminPage.waitForTimeout(2000);
      expect(dialogFired, 'no script should execute from a stored college name').toBe(false);
    });
  });
});
