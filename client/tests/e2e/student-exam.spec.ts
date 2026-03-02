import { test, expect } from '@playwright/test';

test.describe('Student Examination E2E', () => {
    test.beforeEach(async ({ page }) => {
        // Inject student auth state
        await page.goto('/');
        await page.evaluate(() => {
            localStorage.setItem('accessToken', 'mock-student-token');
            localStorage.setItem('user', JSON.stringify({
                id: 'student-123',
                email: 'student@example.com',
                role: 'student',
                name: 'Test Student'
            }));
        });

        // Go to Student portal
        await page.goto('/app/student/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('should display the student dashboard', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible({ timeout: 10000 });

        // Mock API to return an upcoming exam
        await page.route('**/api/student/dashboard', route => {
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    data: {
                        upcomingExams: [{
                            id: 'exam-1',
                            title: 'Software Engineering Core',
                            date: new Date().toISOString(),
                            duration: 60,
                            status: 'scheduled'
                        }],
                        recentResults: []
                    }
                })
            });
        });

        await page.reload();
        await expect(page.getByText('Software Engineering Core')).toBeVisible();
    });

    test('should handle entering an exam player', async ({ page }) => {
        // This tests if the exam player mounts properly.
        // In a real test, you'd mock the exam instructions and questions.
        await page.goto('/exam/player/exam-1');

        // Check if proctoring initialization or instructions load
        // Since it's a dynamic mock we'll just check for standard structural elements
        // E.g., loading spinner or 'Instructions' heading
        await expect(page.getByText(/instructions|loading|proctoring/i).first()).toBeVisible({ timeout: 5000 });
    });
});
