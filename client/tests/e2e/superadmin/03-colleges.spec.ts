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

  test('C3 — create form renders master-record sections', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/colleges/new');
    await expect(adminPage.getByRole('heading', { name: 'Add New College' })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'Core Identification' })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: /Location & Address/i })).toBeVisible();
    await expect(adminPage.getByRole('heading', { name: 'Contact Information' })).toBeVisible();
    for (const name of [
      'name',
      'shortName',
      'establishmentYear',
      'institutionType',
      'ownership',
      'addressLine1',
      'addressLine2',
      'city',
      'district',
      'state',
      'country',
      'pincode',
      'website',
      'email',
      'admissionEmail',
      'phone',
      'alternatePhone',
      'tpoName',
      'tpoEmail',
    ]) {
      await expect(adminPage.locator(`[name="${name}"]`)).toBeVisible();
    }
    await expect(adminPage.getByRole('button', { name: /create college/i })).toBeVisible();
  });

  test('C-edge1 — empty submit shows per-field errors and stays on form', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/colleges/new');
    await adminPage.getByRole('button', { name: /create college/i }).click();
    await expect(adminPage).toHaveURL(/\/app\/superadmin\/colleges\/new/);
    await expect(adminPage.getByText(/added successfully/i)).toHaveCount(0);
    await expect(adminPage.getByText('Official college name is required')).toBeVisible();
    await expect(adminPage.getByText('Establishment year is required')).toBeVisible();
    await expect(adminPage.getByText('Institution type is required')).toBeVisible();
    await expect(adminPage.getByText('Ownership is required')).toBeVisible();
    await expect(adminPage.getByText('Select at least one category')).toBeVisible();
    await expect(adminPage.getByText('Address line 1 is required')).toBeVisible();
    await expect(adminPage.getByText('City is required')).toBeVisible();
    await expect(adminPage.getByText('District is required')).toBeVisible();
    await expect(adminPage.getByText('State is required')).toBeVisible();
    await expect(adminPage.getByText('Pincode is required')).toBeVisible();
    await expect(adminPage.getByText('Website is required')).toBeVisible();
    await expect(adminPage.getByText('General email is required')).toBeVisible();
    await expect(adminPage.getByText('Phone number is required')).toBeVisible();
    await expect(adminPage.getByText('TPO name is required')).toBeVisible();
    await expect(adminPage.getByText('TPO email is required')).toBeVisible();
  });

  test('C-edge3 — malformed email and pincode are rejected by the form', async ({ adminPage }) => {
    await adminPage.goto('/app/superadmin/colleges/new');
    await adminPage.locator('[name="name"]').fill('QA Validation College');
    await adminPage.locator('[name="establishmentYear"]').fill('1995');
    await adminPage.locator('[name="institutionType"]').selectOption('University');
    await adminPage.locator('[name="ownership"]').selectOption('Private');
    await adminPage.getByRole('checkbox', { name: 'Engineering' }).check();
    await adminPage.locator('[name="addressLine1"]').fill('1 Test Road');
    await adminPage.locator('[name="city"]').fill('Chennai');
    await adminPage.locator('[name="district"]').fill('Chennai');
    await adminPage.locator('[name="state"]').fill('Tamil Nadu');
    await adminPage.locator('[name="pincode"]').fill('60000'); // 5 digits — invalid
    await adminPage.locator('[name="website"]').fill('https://qa-college.edu');
    await adminPage.locator('[name="email"]').fill('notanemail');
    await adminPage.locator('[name="phone"]').fill('+919876543210');
    await adminPage.locator('[name="tpoName"]').fill('QA TPO');
    await adminPage.locator('[name="tpoEmail"]').fill('tpo@college.edu');
    await adminPage.getByRole('button', { name: /create college/i }).click();
    await expect(adminPage).toHaveURL(/\/app\/superadmin\/colleges\/new/);
    await expect(adminPage.getByText(/added successfully/i)).toHaveCount(0);
    await expect(adminPage.getByText(/valid general email/i)).toBeVisible();
    await expect(adminPage.getByText(/exactly 6 digits/i)).toBeVisible();
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
      await adminPage.locator('[name="shortName"]').fill(`QA${suffix.slice(-4)}`);
      await adminPage.locator('[name="establishmentYear"]').fill('2001');
      await adminPage.locator('[name="institutionType"]').selectOption('Autonomous College');
      await adminPage.locator('[name="ownership"]').selectOption('Private');
      await adminPage.getByRole('checkbox', { name: 'Engineering' }).check();
      await adminPage.locator('[name="addressLine1"]').fill('1 Test Road');
      await adminPage.locator('[name="city"]').fill('Chennai');
      await adminPage.locator('[name="district"]').fill('Chennai');
      await adminPage.locator('[name="state"]').fill('Tamil Nadu');
      await adminPage.locator('[name="pincode"]').fill('600001');
      await adminPage.locator('[name="website"]').fill(`https://qa-${suffix}.edu`);
      await adminPage.locator('[name="email"]').fill(`qa-${suffix}@college.edu`);
      await adminPage.locator('[name="phone"]').fill('+919876543210');
      await adminPage.locator('[name="tpoName"]').fill('QA TPO');
      await adminPage.locator('[name="tpoEmail"]').fill(`tpo-${suffix}@college.edu`);
      await adminPage.getByRole('button', { name: /create college/i }).click();

      await expect(adminPage.getByText(/added successfully/i)).toBeVisible({ timeout: 15_000 });
      await expect(adminPage.getByRole('heading', { name: /college created/i })).toBeVisible({
        timeout: 10_000,
      });
      await expect(adminPage.getByText(/temporary password/i)).toBeVisible();
    });

    test('C-edge13 — XSS in name is stored escaped (no dialog fires)', async ({ adminPage }) => {
      const suffix = uniqueSuffix();
      let dialogFired = false;
      adminPage.on('dialog', async (d) => { dialogFired = true; await d.dismiss(); });

      await adminPage.goto('/app/superadmin/colleges/new');
      await adminPage.locator('[name="name"]').fill(`<script>alert('xss')</script>${suffix}`);
      await adminPage.locator('[name="establishmentYear"]').fill('1990');
      await adminPage.locator('[name="institutionType"]').selectOption('University');
      await adminPage.locator('[name="ownership"]').selectOption('Government');
      await adminPage.getByRole('checkbox', { name: 'Management' }).check();
      await adminPage.locator('[name="addressLine1"]').fill('1 Test Road');
      await adminPage.locator('[name="city"]').fill('Chennai');
      await adminPage.locator('[name="district"]').fill('Chennai');
      await adminPage.locator('[name="state"]').fill('Tamil Nadu');
      await adminPage.locator('[name="pincode"]').fill('600001');
      await adminPage.locator('[name="website"]').fill(`https://xss-${suffix}.edu`);
      await adminPage.locator('[name="email"]').fill(`xss-${suffix}@college.edu`);
      await adminPage.locator('[name="phone"]').fill('+919876543210');
      await adminPage.locator('[name="tpoName"]').fill('QA TPO');
      await adminPage.locator('[name="tpoEmail"]').fill(`tpo-xss-${suffix}@college.edu`);
      await adminPage.getByRole('button', { name: /create college/i }).click();
      await adminPage.waitForTimeout(2000);
      expect(dialogFired, 'no script should execute from a stored college name').toBe(false);
    });
  });
});
