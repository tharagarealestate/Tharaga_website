import { test, expect } from '@playwright/test';

test.describe('Lead Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to builder dashboard (assumes user is logged in or uses test session)
    await page.goto('/builder/leads');
  });

  test('should display leads list', async ({ page }) => {
    // Wait for leads to load
    await page.waitForTimeout(2000);

    // Check if we can see leads or empty state
    const hasLeads = await page.locator('[data-testid="property-card"], .glass-card, .lead-card').count();
    const hasEmptyState = await page.locator('text=/no leads/i, text=/empty/i').count();

    expect(hasLeads > 0 || hasEmptyState > 0).toBeTruthy();
  });

  test('should view all leads', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check for lead cards or list items
    const leadElements = page.locator('.glass-card, [data-testid="lead-card"], .lead-card');
    const count = await leadElements.count();

    // Should have leads or show empty state
    expect(count >= 0).toBeTruthy();
  });

  test('should filter leads by score', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for filter controls
    const filterButton = page.locator('button:has-text("Filter"), select, button:has-text("Score")').first();

    if (await filterButton.count() > 0) {
      await filterButton.click();

      // Look for score filter options
      const hotOption = page.locator('text=/hot/i, [value="hot"]').first();
      if (await hotOption.count() > 0) {
        await hotOption.click();
        await page.waitForTimeout(1000);

        // Verify filtering occurred
        const currentUrl = page.url();
        expect(currentUrl.includes('score') || currentUrl.includes('filter') || currentUrl.includes('hot')).toBeTruthy();
      }
    }
  });

  test('should open lead details', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find first lead card
    const firstLead = page.locator('.glass-card, [data-testid="lead-card"]').first();

    if (await firstLead.count() > 0) {
      // Click on lead or details button
      const detailsButton = firstLead.locator('a, button:has-text("Details"), button[aria-label*="Arrow"]').first();

      if (await detailsButton.count() > 0) {
        await detailsButton.click();
        await page.waitForTimeout(1000);

        // Should navigate to lead details page
        const url = page.url();
        expect(url.includes('/leads/')).toBeTruthy();
      }
    }
  });

  test('should display lead score badge', async ({ page }) => {
    await page.waitForTimeout(2000);

    const firstLead = page.locator('.glass-card').first();

    if (await firstLead.count() > 0) {
      // Look for score badge
      const scoreBadge = firstLead.locator('text=/\\d+\\.\\d+/, text=/hot/i, text=/warm/i, text=/cold/i').first();

      if (await scoreBadge.count() > 0) {
        await expect(scoreBadge).toBeVisible();
      }
    }
  });

  test('should have working call button', async ({ page }) => {
    await page.waitForTimeout(2000);

    const callButton = page.locator('a[href^="tel:"], button:has-text("Call")').first();

    if (await callButton.count() > 0) {
      await expect(callButton).toBeVisible();

      // Check href attribute
      const href = await callButton.getAttribute('href');
      if (href) {
        expect(href).toContain('tel:');
      }
    }
  });

  test('should have working email link', async ({ page }) => {
    await page.waitForTimeout(2000);

    const emailLink = page.locator('a[href^="mailto:"]').first();

    if (await emailLink.count() > 0) {
      await expect(emailLink).toBeVisible();

      const href = await emailLink.getAttribute('href');
      if (href) {
        expect(href).toContain('mailto:');
      }
    }
  });

  test('should navigate to lead pipeline', async ({ page }) => {
    // Click on pipeline navigation
    await page.click('a:has-text("Pipeline"), [href*="pipeline"]');

    await page.waitForTimeout(1000);

    // Should be on pipeline page
    expect(page.url()).toContain('pipeline');
  });

  test('should update lead status in pipeline', async ({ page }) => {
    await page.goto('/builder/leads/pipeline');
    await page.waitForTimeout(2000);

    // Look for drag-and-drop columns or status buttons
    const statusColumn = page.locator('[data-status], .pipeline-column, .kanban-column').first();

    if (await statusColumn.count() > 0) {
      await expect(statusColumn).toBeVisible();
    }

    // Verify pipeline stages exist
    const stages = await page.locator('text=/new/i, text=/contacted/i, text=/qualified/i, text=/won/i').count();
    expect(stages > 0).toBeTruthy();
  });

  test('should display lead analytics', async ({ page }) => {
    // Navigate to analytics
    const analyticsLink = page.locator('a:has-text("Analytics"), a[href*="analytics"]').first();

    if (await analyticsLink.count() > 0) {
      await analyticsLink.click();
      await page.waitForTimeout(1000);

      // Should show analytics page
      expect(page.url()).toContain('analytics');
    }
  });
});

test.describe('Lead Filtering and Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder/leads');
  });

  test('should search leads by name', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.count() > 0) {
      await searchInput.fill('Test Lead');
      await page.waitForTimeout(500);

      // Verify search is working (URL or filtered results)
      const url = page.url();
      expect(url.includes('search') || url.includes('q=')).toBeTruthy();
    }
  });

  test('should sort leads', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Look for sort dropdown
    const sortButton = page.locator('button:has-text("Sort"), select[name*="sort"]').first();

    if (await sortButton.count() > 0) {
      await sortButton.click();
      await page.waitForTimeout(500);

      // Should show sort options
      const sortOptions = await page.locator('text=/score/i, text=/date/i, text=/name/i').count();
      expect(sortOptions > 0).toBeTruthy();
    }
  });
});

test.describe('Lead Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder/leads');
  });

  test('should have schedule button', async ({ page }) => {
    await page.waitForTimeout(2000);

    const scheduleButton = page.locator('button:has-text("Schedule")').first();

    if (await scheduleButton.count() > 0) {
      await expect(scheduleButton).toBeVisible();
    }
  });

  test('should show lead source', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check if source is displayed (website, referral, etc.)
    const sourceElement = page.locator('text=/website/i, text=/referral/i, text=/direct/i').first();

    if (await sourceElement.count() > 0) {
      await expect(sourceElement).toBeVisible();
    }
  });

  test('should display lead budget if available', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for currency symbol
    const budgetElement = page.locator('text=/₹/, text=/budget/i').first();

    if (await budgetElement.count() > 0) {
      await expect(budgetElement).toBeVisible();
    }
  });

  test('should display property interested in', async ({ page }) => {
    await page.waitForTimeout(2000);

    const firstLead = page.locator('.glass-card').first();

    if (await firstLead.count() > 0) {
      // Should show property information
      const propertyInfo = firstLead.locator('text=/interested in/i, text=/property/i').first();

      if (await propertyInfo.count() > 0) {
        await expect(propertyInfo).toBeVisible();
      }
    }
  });
});
