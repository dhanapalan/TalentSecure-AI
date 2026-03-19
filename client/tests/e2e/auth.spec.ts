import { test, expect } from '@playwright/test';

test.describe('Authentication E2E', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/auth/login');
    });

    test('should show login page with proper elements', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
        await expect(page.getByPlaceholder('name@company.com')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign in to Account' })).toBeVisible();
        await expect(page.getByText('Sign in with Microsoft')).toBeVisible();
    });

    test('should show required validation errors', async ({ page }) => {
        await page.getByRole('button', { name: 'Sign in to Account' }).click();
        await expect(page.getByText('Email is required')).toBeVisible();
        await expect(page.getByText('Password is required')).toBeVisible();
    });

    test('should handle invalid login gracefully', async ({ page }) => {
        // Mock the API response for failed login
        await page.route('**/api/auth/login', route => {
            route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ success: false, error: 'Invalid credentials' }),
            });
        });

        await page.getByPlaceholder('name@company.com').fill('invalid@example.com');
        await page.locator('input[type="password"]').fill('wrongpassword');
        await page.getByRole('button', { name: 'Sign in to Account' }).click();

        await expect(page.getByText('Invalid credentials')).toBeVisible();
    });

    test('should successfully login and redirect', async ({ page }) => {
        // Mock the API response for successful login
        await page.route('**/api/auth/login', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        accessToken: 'fake-jwt-token',
                        user: {
                            id: 'u1',
                            email: 'admin@talentsecure.ai',
                            role: 'super_admin',
                            name: 'Super Admin'
                        }
                    }
                }),
            });
        });

        await page.getByPlaceholder('name@company.com').fill('admin@talentsecure.ai');
        await page.locator('input[type="password"]').fill('password123');
        await page.getByRole('button', { name: 'Sign in to Account' }).click();

        // Redirect target depends on role mapping and can vary by dashboard strategy.
        await expect(page).toHaveURL(/\/app\/(overview|hr-dashboard)/);
        // Let's ensure a toast appears too
        await expect(page.getByText('Login successful')).toBeVisible();
    });
});
