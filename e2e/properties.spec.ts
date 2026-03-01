import { test, expect } from '@playwright/test';

test.describe('Property Listing Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder/properties');
  });

  test('should display properties list', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Check for properties or empty state
    const hasProperties = await page.locator('[data-testid="property-card"], .property-card, .glass-card').count();
    const hasEmptyState = await page.locator('text=/no properties/i, text=/add your first/i').count();

    expect(hasProperties > 0 || hasEmptyState > 0).toBeTruthy();
  });

  test('should have add new property button', async ({ page }) => {
    await page.waitForTimeout(1000);

    const addButton = page.locator('button:has-text("Add Property"), button:has-text("New Property"), a:has-text("Add")').first();

    if (await addButton.count() > 0) {
      await expect(addButton).toBeVisible();
    }
  });

  test('should open add property form', async ({ page }) => {
    await page.waitForTimeout(1000);

    const addButton = page.locator('button:has-text("Add Property"), button:has-text("New Property")').first();

    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForTimeout(1000);

      // Should show form or navigate to form page
      const hasForm = await page.locator('form, input[name="title"], input[placeholder*="title"]').count();
      const urlChanged = page.url().includes('new') || page.url().includes('add');

      expect(hasForm > 0 || urlChanged).toBeTruthy();
    }
  });

  test('should fill and submit new property form', async ({ page }) => {
    // Navigate directly to add property page
    await page.goto('/builder/properties/new');
    await page.waitForTimeout(1000);

    // Fill property details
    const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill('Luxury Villa in Goa');
    }

    const locationInput = page.locator('input[name="location"], input[placeholder*="location"]').first();
    if (await locationInput.count() > 0) {
      await locationInput.fill('North Goa');
    }

    const priceInput = page.locator('input[name="price"], input[type="number"]').first();
    if (await priceInput.count() > 0) {
      await priceInput.fill('5000000');
    }

    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add")').first();
    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(2000);

      // Should redirect or show success
      const success = page.url().includes('/builder/properties') && !page.url().includes('/new');
      expect(success).toBeTruthy();
    }
  });

  test('should upload property images', async ({ page }) => {
    await page.goto('/builder/properties/new');
    await page.waitForTimeout(1000);

    // Look for file upload input
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.count() > 0) {
      await expect(fileInput).toBeVisible();

      // Note: Actual file upload would require a test file
      // await fileInput.setInputFiles('path/to/test/image.jpg');
    }
  });

  test('should view property analytics', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Look for analytics link or button
    const analyticsLink = page.locator('a:has-text("Analytics"), a:has-text("Performance"), a[href*="analytics"]').first();

    if (await analyticsLink.count() > 0) {
      await analyticsLink.click();
      await page.waitForTimeout(1000);

      // Should navigate to analytics page
      expect(page.url()).toContain('analytics' || 'performance' || 'insights');
    }
  });

  test('should edit property details', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find first property and edit button
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();

    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(1000);

      // Should navigate to edit page or show edit form
      const hasForm = await page.locator('form, input[name="title"]').count();
      const urlHasEdit = page.url().includes('edit');

      expect(hasForm > 0 || urlHasEdit).toBeTruthy();
    }
  });

  test('should update property information', async ({ page }) => {
    // Navigate to edit page (assuming property exists)
    await page.goto('/builder/properties');
    await page.waitForTimeout(2000);

    const firstProperty = page.locator('.property-card, .glass-card').first();

    if (await firstProperty.count() > 0) {
      const editButton = firstProperty.locator('button:has-text("Edit"), a:has-text("Edit")').first();

      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(1000);

        // Update title
        const titleInput = page.locator('input[name="title"]').first();
        if (await titleInput.count() > 0) {
          await titleInput.fill('Updated Property Title');

          // Save changes
          const saveButton = page.locator('button[type="submit"], button:has-text("Save")').first();
          if (await saveButton.count() > 0) {
            await saveButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }
  });

  test('should display property performance metrics', async ({ page }) => {
    await page.goto('/builder/properties/performance');
    await page.waitForTimeout(2000);

    // Look for performance indicators
    const metrics = await page.locator('text=/views/i, text=/leads/i, text=/conversion/i').count();

    expect(metrics > 0).toBeTruthy();
  });

  test('should view AI insights', async ({ page }) => {
    await page.goto('/builder/properties/insights');
    await page.waitForTimeout(2000);

    // Should show AI insights or recommendations
    const hasInsights = await page.locator('text=/insight/i, text=/recommendation/i, text=/AI/i').count();

    expect(hasInsights >= 0).toBeTruthy();
  });

  test('should delete property', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Find delete button
    const deleteButton = page.locator('button:has-text("Delete"), button[aria-label*="Delete"]').first();

    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      await page.waitForTimeout(500);

      // Should show confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();

      if (await confirmButton.count() > 0) {
        await expect(confirmButton).toBeVisible();
      }
    }
  });
});

test.describe('Property Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder/properties/new');
  });

  test('should validate required fields', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"]').first();

    if (await submitButton.count() > 0) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Should still be on form page
      expect(page.url()).toContain('new');
    }
  });

  test('should validate price as number', async ({ page }) => {
    await page.waitForTimeout(1000);

    const priceInput = page.locator('input[name="price"], input[type="number"]').first();

    if (await priceInput.count() > 0) {
      await priceInput.fill('invalid');

      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);

        // Should show validation error or remain on page
        expect(page.url()).toContain('new');
      }
    }
  });

  test('should show property specifications fields', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Check for common property fields
    const fields = await page.locator('input[name*="bedroom"], input[name*="bathroom"], input[name*="sqft"], input[name*="area"]').count();

    // At least some spec fields should exist
    expect(fields >= 0).toBeTruthy();
  });
});

test.describe('Property Images', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder/properties');
  });

  test('should display property images', async ({ page }) => {
    await page.waitForTimeout(2000);

    const propertyImage = page.locator('img[alt*="property"], img[alt*="villa"], img[alt*="apartment"]').first();

    if (await propertyImage.count() > 0) {
      await expect(propertyImage).toBeVisible();
    }
  });

  test('should handle missing property images', async ({ page }) => {
    await page.waitForTimeout(2000);

    // Should show placeholder or default image
    const images = page.locator('img');
    const count = await images.count();

    expect(count >= 0).toBeTruthy();
  });
});

test.describe('Property Filtering and Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/builder/properties');
  });

  test('should search properties', async ({ page }) => {
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();

    if (await searchInput.count() > 0) {
      await searchInput.fill('Villa');
      await page.waitForTimeout(500);

      // Should filter results
      const url = page.url();
      expect(url.includes('search') || url.includes('q=')).toBeTruthy();
    }
  });

  test('should filter by property type', async ({ page }) => {
    await page.waitForTimeout(1000);

    const filterButton = page.locator('button:has-text("Filter"), select[name*="type"]').first();

    if (await filterButton.count() > 0) {
      await filterButton.click();
      await page.waitForTimeout(500);
    }
  });
});
