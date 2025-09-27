import { test, expect } from '@playwright/test'

test.describe('Buyer Form - Email autofill and lock', () => {
  test('locks email after auth signal and mirrors into hidden input', async ({ page }) => {
    await page.goto('/buyer-form/')

    // Simulate signed-in event the page listens to (set before navigation)
    const userEmail = 'user@example.com'
    await page.addInitScript((email) => {
      try { localStorage.setItem('__tharaga_magic_continue', JSON.stringify({ user: { email }, ts: Date.now() })) } catch(_) {}
    }, userEmail)

    // Reload so init script is applied and the page locking code runs on load
    await page.reload()

    const emailInput = page.locator('#buyerForm [name="email"], #buyerForm input[data-session-email]')

    // Wait for the lock to apply (field disabled OR hidden mirror created)
    await page.waitForFunction(() => !!document.querySelector('#buyerForm input[disabled]') || !!document.querySelector('#buyer-email-hidden'))

    // The visible field should have data-session-email and be disabled/read-only
    const hasSessionAttr = await page.locator('#buyerForm input[data-session-email]').count()
    expect(hasSessionAttr).toBeGreaterThan(0)

    // Hidden mirror should exist with name=email and same value
    const hidden = page.locator('#buyerForm input#buyer-email-hidden[type="hidden"][name="email"]')
    await expect(hidden).toHaveValue(userEmail)
  })
})

