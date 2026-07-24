/**
 * Live admin.gradlogic.atherasys.com validation with step screenshots
 * for display in Cursor.
 */
import { chromium, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://admin.gradlogic.atherasys.com';
const EMAIL = 'admin@gradlogic.com';
const PASS = 'gradlogic123';

const OUT = path.resolve('/opt/cursor/artifacts/screenshots/admin-live-2026-07-24');
const OUT2 = path.resolve('/workspace/docs/validation/artifacts/admin-subdomain-live');

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(OUT2, { recursive: true });

async function shot(page, name, label) {
  const file = path.join(OUT, `${name}.png`);
  const file2 = path.join(OUT2, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  fs.copyFileSync(file, file2);
  console.log(`SHOT ${name} | ${label} | ${file}`);
  return file;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['Desktop Chrome'],
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const results = [];

  // 1. Login page
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1200);
  await shot(page, '01-login-page', 'Login page loaded');
  results.push({ id: 'LOGIN-PAGE', status: 'PASS', notes: page.url() });

  // 2. Wrong password
  await page.getByLabel(/email or student id/i).fill(EMAIL);
  await page.getByLabel(/^password$/i).fill('wrong-password-xyz');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(2000);
  await shot(page, '02-wrong-password', 'Wrong password attempt');
  const wrongOk =
    /\/auth\/login/.test(page.url()) &&
    (await page.getByText(/invalid|incorrect|failed|wrong|credentials/i).count()) > 0;
  results.push({ id: 'AUTH-WRONG', status: wrongOk ? 'PASS' : 'FAIL', notes: page.url() });

  // 3. Valid login
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/email or student id/i).fill(EMAIL);
  await page.getByLabel(/^password$/i).fill(PASS);
  await page.getByRole('button', { name: /sign in/i }).click();
  try {
    await page.waitForURL(/\/app\/superadmin\/dashboard/, { timeout: 30_000 });
  } catch {
    /* capture landing either way */
  }
  await page.waitForTimeout(1500);
  await shot(page, '03-dashboard', 'After valid login');
  const dashOk = /\/app\/superadmin\/dashboard/.test(page.url());
  results.push({ id: 'AUTH-LOGIN', status: dashOk ? 'PASS' : 'FAIL', notes: page.url() });

  if (!dashOk) {
    console.log('RESULTS_JSON ' + JSON.stringify(results));
    await browser.close();
    process.exit(1);
  }

  const modules = [
    { id: '04-colleges', path: '/app/superadmin/colleges', label: 'Colleges' },
    { id: '05-students', path: '/app/superadmin/students', label: 'Students' },
    { id: '06-users', path: '/app/superadmin/users', label: 'Users' },
    { id: '07-roles', path: '/app/superadmin/roles', label: 'Roles' },
    { id: '08-permissions', path: '/app/superadmin/roles/matrix', label: 'Permissions' },
    { id: '09-question-bank', path: '/app/superadmin/question-bank', label: 'Question Bank' },
    { id: '10-collections', path: '/app/superadmin/question-collections', label: 'Collections' },
    { id: '11-drives', path: '/app/superadmin/drives', label: 'Assessment Builder' },
    { id: '12-ai-config', path: '/app/superadmin/ai-config', label: 'AI Config' },
    { id: '13-analytics', path: '/app/superadmin/analytics', label: 'Analytics' },
    { id: '14-settings', path: '/app/superadmin/settings', label: 'Settings' },
    { id: '15-audit', path: '/app/superadmin/audit-trail', label: 'Audit Trail' },
  ];

  for (const m of modules) {
    await page.goto(`${BASE}${m.path}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    const settle = m.id.includes('permissions') ? 8000 : 1500;
    await page.waitForTimeout(settle);
    await shot(page, m.id, m.label);
    const ok =
      !/\/auth\/login|\/not-authorized/.test(page.url()) &&
      (await page.getByText('GradLogic').first().isVisible().catch(() => false));
    results.push({
      id: m.label.toUpperCase().replace(/\s+/g, '-'),
      status: ok ? 'PASS' : 'FAIL',
      notes: page.url().replace(BASE, ''),
    });
  }

  // Logout
  await page.goto(`${BASE}/app/superadmin/dashboard`);
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /logout/i }).first().click();
  await page.waitForTimeout(2000);
  await shot(page, '16-logout', 'After logout');
  results.push({
    id: 'LOGOUT',
    status: /\/auth\/login/.test(page.url()) ? 'PASS' : 'FAIL',
    notes: page.url(),
  });

  console.log('RESULTS_JSON ' + JSON.stringify(results, null, 2));
  const passed = results.filter((r) => r.status === 'PASS').length;
  console.log(`SUMMARY ${passed}/${results.length} PASS`);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
