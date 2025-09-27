import { test, expect } from '@playwright/test'

test.describe('Buyer Form - Email autofill and lock', () => {
  test('locks email after auth signal and mirrors into hidden input', async ({ page }) => {
    await page.goto('/buyer-form/')

    // Simulate signed-in event the page listens to
    const userEmail = 'user@example.com'
    await page.evaluate((email) => {
      try { window.postMessage({ type: 'THARAGA_AUTH_SUCCESS', user: { email } }, '*') } catch(_) {}
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('tharaga-auth');
          bc.postMessage({ user: { email } })
        }
      } catch(_) {}
      try { localStorage.setItem('__tharaga_magic_continue', JSON.stringify({ user: { email }, ts: Date.now() })) } catch(_) {}
    }, userEmail)

    const emailInput = page.locator('#buyerForm [name="email"], #buyerForm input[data-session-email]')

    // Wait for the lock to apply (field disabled and name moved to hidden)
    await expect(page.locator('#buyerForm input[disabled]')).toBeVisible()

    // The visible field should have data-session-email and be disabled/read-only
    const hasSessionAttr = await page.locator('#buyerForm input[data-session-email]').count()
    expect(hasSessionAttr).toBeGreaterThan(0)

    // Hidden mirror should exist with name=email and same value
    const hidden = page.locator('#buyerForm input[type="hidden"][name="email"]')
    await expect(hidden).toHaveValue(userEmail)
  })
})

