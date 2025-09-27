import { test, expect } from '@playwright/test'

test.describe('Buyer Form - Email autofill and lock', () => {
  test('locks email after auth signal and mirrors into hidden input', async ({ page }) => {
    await page.goto('/buyer-form/')

    // Set cache BEFORE scripts run, then reload so the page locks immediately
    const userEmail = 'user@example.com'
    await page.addInitScript((email) => {
      try { localStorage.setItem('__tharaga_magic_continue', JSON.stringify({ user: { email }, ts: Date.now() })) } catch(_) {}
    }, userEmail)
    await page.reload()

    // Wait for the lock to apply (disabled state or hidden mirror present)
    await page.waitForFunction(() => !!document.querySelector('#buyerForm input[disabled]') || !!document.querySelector('#buyer-email-hidden'))

    // The visible field should have data-session-email and be disabled/read-only
    const hasSessionAttr = await page.locator('#buyerForm input[data-session-email]').count()
    expect(hasSessionAttr).toBeGreaterThan(0)

    // Hidden mirror should exist with name=email and same value
    const hidden = page.locator('#buyerForm input#buyer-email-hidden[type="hidden"][name="email"]')
    await expect(hidden).toHaveValue(userEmail)
  })
})

