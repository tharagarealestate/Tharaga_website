// @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('Auth modal UX (client-side)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login_signup_glassdrop/');
  });

  test('Sign In tab validates email and password', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute('aria-selected', 'true');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('#msg')).toContainText('Enter a valid email');

    await page.locator('#authForm').getByLabel('Email').fill('user@');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('#msg')).toContainText('Enter a valid email');

    await page.locator('#authForm').getByLabel('Email').fill('user@example.com');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('#msg')).toContainText('Enter your password');
  });

  test('Switch to Create Account tab and validate passwords', async ({ page }) => {
    await page.getByRole('tab', { name: 'Create Account' }).click();
    const form = page.locator('#signupForm');
    await form.getByLabel('Email').fill('new@example.com');
    await form.getByLabel('Password', { exact: true }).fill('short');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.locator('#su_msg')).toContainText('at least 8');

    await form.getByLabel('Password', { exact: true }).fill('password123');
    await form.getByLabel('Confirm Password').fill('password124');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.locator('#su_msg')).toContainText('do not match');
  });

  test('Forgot password link exists', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/Reset_password/');
  });

  test('OAuth button shows redirect message', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Continue with Google' });
    await btn.click();
    // Expect precheck modal opens since email is blank
    await expect(page.locator('#oauthPrecheck')).toHaveAttribute('aria-hidden', 'false');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('#oauthPrecheck')).toHaveAttribute('aria-hidden', 'true');
  });
});

