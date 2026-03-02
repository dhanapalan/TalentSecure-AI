import { test, expect } from '@playwright/test';

test('End-to-End Recruitment Flow Validation', async ({ page }) => {
    // 1. Log into the Admin Portal
    await page.goto('http://localhost:5173/auth/login');

    await page.waitForSelector('input[type="email"]', { state: 'visible' });
    await page.fill('input[type="email"]', 'admin@nallastalent.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Verify successful login
    await expect(page).toHaveURL(/.*\/app/);

    // 2. Validate ASSESSMENT RULE (Template) creation
    await page.click('text=Assessment Engine');
    await page.click('text=Rules');
    await page.click('text=Create Rule');

    // Step 1: Basic Config
    const ruleName = `E2E Test Rule ${Date.now()}`;
    await page.fill('input[placeholder="e.g., Full Stack Developer Assessment"]', ruleName);
    await page.fill('input[placeholder="e.g., Frontend Developer"]', "Quality Engineer");
    await page.click('button:has-text("Next")');

    // Step 2: Skills
    await page.click('button:has-text("Next")');

    // Step 3: Difficulty
    await page.click('button:has-text("Next")');

    // Step 4: Pool
    await page.click('button:has-text("Next")');

    // Step 5: Targeting
    await page.click('button:has-text("Next")');

    // Step 6: Review & Save
    await page.click('button:has-text("Save & Activate")');
    await expect(page.getByText('Rule created')).toBeVisible();

    // 3. Validate CREATE DRIVE
    await page.click('text=Assessment Engine');
    await page.click('text=Drives');
    await page.click('text=Create Drive');

    const driveName = `E2E Test Drive ${Date.now()}`;
    await page.fill('input[placeholder="e.g. Summer Internship 2026"]', driveName);

    // Select the newly created rule
    await page.locator('select[title="Assessment Rule"]').selectOption({ label: `${ruleName} (v1)` });
    // Click 'Launch Drive'
    await page.click('button:has-text("Launch Drive")');

    // Wait for the drive to be created and redirect to the drives page
    await expect(page.getByText('Drive created')).toBeVisible();

    // Now let's navigate into the drive itself
    await page.click(`text=${driveName}`);

    // Wait for generation
    await page.waitForTimeout(5000); // Wait for the async generation to finish

    // 4. Validate FREEZE RULE VERSION (Generate/Approve Pool)
    await page.click('text=Pool Details');
    await page.click('text=Approve Pool');

    await expect(page.getByText('Pool Approved')).toBeVisible();

    // 5. Mark Ready & Schedule (Mark drive as APPROVED/SCHEDULED)
    await page.click('button:has-text("Mark Ready")');
    await expect(page.getByText('Drive is now READY')).toBeVisible();

    await page.click('button:has-text("Schedule Drive")');
    await expect(page.getByText('Drive scheduled successfully')).toBeVisible();

    // 6. Validate STUDENT REGISTRATION (Assign Campus)
    await page.click('text=Assignment');
    await page.click('button:has-text("Assign Campus")');

    // Select the first campus in the dropdown list (assuming there is one)
    await page.locator('select').first().selectOption({ index: 1 });
    // We set segment just in case
    await page.locator('select').nth(1).selectOption({ label: 'CS/IT' });
    await page.click('button:has-text("Add Assignment")');
    await expect(page.getByText('Assignment successful')).toBeVisible();

    // 7. Validate ASSESSMENT EXECUTION
    // Log out as admin
    await page.click('button[title="Profile"]'); // Assuming this opens a menu
    await page.click('text=Log out');

    // Log in as student
    // For this test, assume a dummy student 'student@test.com' exists and was mapped
    await page.goto('http://localhost:5173/auth/login');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/app/);

    // Find the assigned assessment and take it
    await page.click('text=My Assessments');
    await page.click(`text=${driveName}`);
    await page.click('button:has-text("Start Assessment")');

    // Check if test environment loaded
    await expect(page.getByText('Assessment Time')).toBeVisible();

    // Complete the test (Dummy interaction - depends on actual test UI)
    // We'll simulate submitting the test
    await page.click('button:has-text("Submit Assessment")');
    await page.click('button:has-text("Confirm Submit")');
    await expect(page.getByText('Assessment Submitted')).toBeVisible();

    // 8. Validate AI EVALUATION & SHORTLIST
    // Log back in as Admin
    await page.click('button[title="Profile"]');
    await page.click('text=Log out');

    await page.goto('http://localhost:5173/auth/login');
    await page.fill('input[type="email"]', 'admin@nallastalent.ai');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.click('text=Assessment Engine');
    await page.click('text=Drives');
    await page.click(`text=${driveName}`);

    // Check Student Results tab
    await page.click('text=Students');
    await expect(page.getByText('student@test.com')).toBeVisible(); // Check student is listed

    // Shortlist Student
    await page.click('button[title="Shortlist"]'); // Assuming a shortlist action exists
    await expect(page.getByText('Student Shortlisted')).toBeVisible();

    // 9. Validate INTERVIEW & FINAL RANKING
    await page.click('button[title="Schedule Interview"]');
    await page.fill('input[name="interview_date"]', '2026-06-01T10:00'); // Dummy date
    await page.click('button:has-text("Schedule")');
    await expect(page.getByText('Interview Scheduled')).toBeVisible();

    // Simulate Interview Completion and Feedback
    await page.click('button[title="Complete Interview"]');
    await page.fill('textarea[name="feedback"]', 'Excellent performance');
    await page.fill('input[name="score"]', '95');
    await page.click('button:has-text("Submit Feedback")');

    // 10. Validate OFFER RELEASE
    await page.click('button:has-text("Release Offer")');
    await expect(page.getByText('Offer Released Successfully')).toBeVisible();
});
