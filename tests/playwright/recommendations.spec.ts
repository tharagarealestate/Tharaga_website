import { test, expect } from '@playwright/test'

test.describe('AI Recommendations module', () => {
  test('homepage shows recommendations carousel', async ({ page }) => {
    await page.goto('/')
    // Navigate directly to the Next.js app for stability
    await page.goto('/app/')

    // Recommendations header
    await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible()

    // Either cards render or the scroll row renders
    const cards = page.locator('[data-scroll-row] > div')
    if ((await cards.count()) > 0) {
      await expect(cards.first()).toBeVisible()
    } else {
      await expect(page.locator('[data-scroll-row]')).toBeVisible()
    }
  })
})

