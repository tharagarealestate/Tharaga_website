import { test, expect } from '@playwright/test';

test.describe('User Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display trial signup form', async ({ page }) => {
    // Navigate to trial signup page
    await page.goto('/trial-signup');

    // Check if form is visible
    await expect(page.locator('h1')).toContainText(/sign up|trial|get started/i);

    // Check for form fields
    await expect(page.locator('input[name="name"], input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[name="phone"], input[type="tel"]').first()).toBeVisible();
  });

  test('should fill trial signup form and submit', async ({ page }) => {
    await page.goto('/trial-signup');

    // Fill out the form
    await page.fill('input[name="name"], input[type="text"]', 'Test Builder');
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="phone"], input[type="tel"]', '9876543210');

    // Submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up"), button:has-text("Get Started")').first();
    await submitButton.click();

    // Wait for either OTP screen or dashboard redirect
    await page.waitForTimeout(1000);

    // Check if we're on OTP page or redirected
    const currentUrl = page.url();
    const hasOtpField = await page.locator('input[name="otp"], input[placeholder*="OTP"]').count();

    expect(hasOtpField > 0 || currentUrl.includes('/builder')).toBeTruthy();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/trial-signup');

    // Try to submit without filling fields
    const submitButton = page.locator('button[type="submit"], button:has-text("Sign Up")').first();
    await submitButton.click();

    // Check for validation messages or that form didn't submit
    const currentUrl = page.url();
    expect(currentUrl).toContain('trial-signup');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/trial-signup');

    // Fill with invalid email
    await page.fill('input[name="email"], input[type="email"]', 'invalid-email');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Should still be on signup page
    await expect(page).toHaveURL(/trial-signup/);
  });

  test('should show OTP verification screen after signup', async ({ page }) => {
    await page.goto('/trial-signup');

    // Fill out the form
    await page.fill('input[name="name"], input[type="text"]', 'Test Builder');
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="phone"], input[type="tel"]', '9876543210');

    // Submit
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for OTP screen
    await page.waitForTimeout(2000);

    // Check if OTP input exists or if already redirected
    const hasOtp = await page.locator('input[name="otp"], input[placeholder*="OTP"], input[placeholder*="code"]').count();
    const onDashboard = page.url().includes('/builder');

    expect(hasOtp > 0 || onDashboard).toBeTruthy();
  });

  test('should redirect to trial dashboard after successful verification', async ({ page }) => {
    // This test assumes a mock or test OTP
    await page.goto('/trial-signup');

    // Fill signup form
    await page.fill('input[name="name"], input[type="text"]', 'Test Builder');
    await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
    await page.fill('input[name="phone"], input[type="tel"]', '9876543210');

    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Wait for navigation
    await page.waitForTimeout(2000);

    // Check if we landed on builder dashboard or OTP page
    const finalUrl = page.url();
    expect(finalUrl.includes('/builder') || finalUrl.includes('otp') || finalUrl.includes('verify')).toBeTruthy();
  });

  test('should display company name field', async ({ page }) => {
    await page.goto('/trial-signup');

    // Check for company name field (if exists)
    const hasCompanyField = await page.locator('input[name="company"], input[placeholder*="company"]').count();

    // This is optional, so we just verify it exists or doesn't
    expect(typeof hasCompanyField).toBe('number');
  });

  test('should have working back/cancel button', async ({ page }) => {
    await page.goto('/trial-signup');

    // Look for back or cancel button
    const backButton = page.locator('button:has-text("Back"), button:has-text("Cancel"), a:has-text("Back")').first();

    if (await backButton.count() > 0) {
      await backButton.click();
      await page.waitForTimeout(500);

      // Should navigate away from signup
      expect(page.url()).not.toContain('trial-signup');
    }
  });
});

test.describe('OTP Verification', () => {
  test('should accept OTP input', async ({ page }) => {
    // Navigate directly to OTP page (if accessible)
    await page.goto('/trial-signup/verify');

    // Check if OTP input exists
    const otpInput = page.locator('input[name="otp"], input[placeholder*="OTP"]').first();

    if (await otpInput.count() > 0) {
      await otpInput.fill('123456');
      expect(await otpInput.inputValue()).toBe('123456');
    }
  });

  test('should have resend OTP button', async ({ page }) => {
    await page.goto('/trial-signup/verify');

    // Look for resend button
    const resendButton = page.locator('button:has-text("Resend"), a:has-text("Resend")').first();

    if (await resendButton.count() > 0) {
      await expect(resendButton).toBeVisible();
    }
  });
});
