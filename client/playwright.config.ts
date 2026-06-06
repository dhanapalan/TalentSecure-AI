import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 2,
    reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'phase1-admin',
            testMatch: '**/phase1-admin/**/*.spec.ts',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'phase2-campus-admin',
            testMatch: '**/phase2-campus-admin/**/*.spec.ts',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'phase3-candidate',
            testMatch: '**/phase3-candidate/**/*.spec.ts',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'phase4-e2e',
            testMatch: '**/phase4-e2e/**/*.spec.ts',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'phase5-edge',
            testMatch: '**/phase5-edge/**/*.spec.ts',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
