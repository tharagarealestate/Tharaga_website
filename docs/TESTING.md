# Testing Guide

This document provides comprehensive information about the testing setup for the Tharaga real estate platform.

## Table of Contents

- [Installation](#installation)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Unit Tests](#unit-tests)
- [Component Tests](#component-tests)
- [E2E Tests](#e2e-tests)

## Installation

All testing dependencies are already installed. If you need to reinstall them:

```bash
npm install -D @testing-library/react @testing-library/jest-dom @playwright/test vitest @testing-library/user-event jsdom @vitejs/plugin-react
npx playwright install
```

## Test Structure

```
├── lib/__tests__/               # Unit tests
│   ├── leadScoring.test.ts      # Lead scoring algorithm tests
│   └── helpers.test.ts          # Helper function tests
├── components/__tests__/        # Component tests
│   ├── LeadCard.test.tsx        # LeadCard component tests
│   ├── PropertyCard.test.tsx    # PropertyCard component tests
│   └── Sidebar.test.tsx         # Sidebar navigation tests
├── e2e/                         # E2E tests
│   ├── signup.spec.ts           # User signup flow tests
│   ├── dashboard.spec.ts        # Lead management tests
│   └── properties.spec.ts       # Property listing tests
├── test/setup.ts                # Vitest setup file
├── vitest.config.ts             # Vitest configuration
└── playwright.config.ts         # Playwright configuration
```

## Running Tests

### Unit & Component Tests (Vitest)

```bash
# Run all unit/component tests
npm run test

# Run tests in watch mode (recommended for development)
npm run test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI (interactive mode)
npm run test:e2e:ui

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Run specific test file
npm run test:e2e -- e2e/signup.spec.ts

# Run tests in specific browser
npm run test:e2e -- --project=chromium
npm run test:e2e -- --project=firefox
npm run test:e2e -- --project=webkit
```

## Unit Tests

### Lead Scoring Algorithm

**File:** `lib/__tests__/leadScoring.test.ts`

Tests the lead scoring algorithm that analyzes lead messages and assigns intent scores.

**Test Coverage:**
- High intent messages (ready to book, finalize) → score 0.85
- Medium intent messages (loan, visit, interested) → score 0.45-0.65
- Low intent messages (browsing) → score 0.35
- Case insensitivity
- Empty message handling
- Multiple signal matching

**Example:**
```typescript
const result = calculateLeadScore('I am ready to book this property');
// result: { score: 0.85, label: 'high' }
```

### Helper Functions

**File:** `lib/__tests__/helpers.test.ts`

Tests utility functions used across the application.

**Test Coverage:**
- `getScoreColor(score)` - Maps scores to color codes
  - Score 9-10: Gold (#D4AF37) - Hot leads
  - Score 7-9: Orange (#F59E0B) - Warm leads
  - Score 5-7: Blue (#3B82F6) - Developing leads
  - Score 3-5: Gray (#6B7280) - Cold leads
  - Score 0-3: Light gray (#9CA3AF) - Low leads

- `getScoreLabel(score)` - Returns emoji + label for scores
  - 9-10: "🔥 Hot"
  - 7-9: "⚡ Warm"
  - 5-7: "📈 Developing"
  - 3-5: "❄️ Cold"
  - 0-3: "⏸️ Low"

- `formatCurrency(amount)` - Formats numbers as Indian currency
  - 1000 → "1,000"
  - 100000 → "1,00,000"
  - 10000000 → "1,00,00,000"

- `formatDistanceToNow(date)` - Formats relative time
  - 5 minutes ago
  - 2 hours ago
  - 3 days ago

## Component Tests

### LeadCard Component

**File:** `components/__tests__/LeadCard.test.tsx`

Tests the lead card component that displays lead information.

**Test Coverage:**
- Renders with correct lead data (name, email, phone)
- Displays correct score with label
- Shows score badge with correct color for different score ranges
- Tel links work correctly (`tel:+91...`)
- Mailto links work correctly (`mailto:...`)
- Action buttons render (Call, Schedule)
- Budget formatting (Indian currency format)
- Missing budget handled gracefully
- Source displayed with proper capitalization
- Time ago displayed
- View details link works
- Missing property title shows "-"
- Skeleton loader renders

### PropertyCard Component

**File:** `components/__tests__/PropertyCard.test.tsx`

Tests the property card component from recommendations carousel.

**Test Coverage:**
- Renders with correct property data
- Displays property specs (BHK, bathrooms, sqft, location)
- Images display correctly
- Request details button triggers callback
- See similar link works
- Save button renders
- Missing specs handled gracefully
- Area sqft rounds correctly
- All specs display when available

### Sidebar Component

**File:** `components/__tests__/Sidebar.test.tsx`

Tests the dashboard sidebar navigation component.

**Test Coverage:**
- Renders sidebar with logo and navigation
- All navigation items render
- Active route highlighting works correctly
- Nested routes (like /builder/leads/pipeline) highlight parent
- Help link renders at bottom
- Logo links to builder home
- Only one route highlighted at a time
- Deeply nested routes handled

## E2E Tests

### User Signup Flow

**File:** `e2e/signup.spec.ts`

Tests the complete user signup and verification process.

**Test Coverage:**
- Trial signup form displays
- Form validation (required fields, email format)
- Form submission
- OTP verification screen
- Redirect to trial dashboard after verification
- Back/cancel buttons work
- Resend OTP button

### Lead Management

**File:** `e2e/dashboard.spec.ts`

Tests lead management functionality in the builder dashboard.

**Test Coverage:**
- Leads list displays
- Filter leads by score
- Open lead details
- Lead score badge displays
- Call button works (tel: link)
- Email link works (mailto: link)
- Navigate to pipeline view
- Update lead status in pipeline
- View lead analytics
- Search leads by name
- Sort leads
- Schedule button
- Lead source display
- Budget display
- Property interest display

### Property Listing

**File:** `e2e/properties.spec.ts`

Tests property management functionality.

**Test Coverage:**
- Properties list displays
- Add new property button
- Add property form (title, location, price)
- Upload property images
- View property analytics
- Edit property details
- Update property information
- Performance metrics display
- AI insights
- Delete property
- Form validation (required fields, price as number)
- Property specifications fields
- Property images display
- Search properties
- Filter by property type

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';

describe('My Function', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should perform action', async ({ page }) => {
  await page.goto('/path');
  await page.click('button');
  await expect(page.locator('.result')).toBeVisible();
});
```

## Best Practices

1. **Unit Tests:**
   - Test pure functions and business logic
   - Mock external dependencies
   - Use descriptive test names
   - Test edge cases and error conditions

2. **Component Tests:**
   - Test user interactions
   - Verify rendered output
   - Test accessibility
   - Mock Next.js components when needed

3. **E2E Tests:**
   - Test critical user journeys
   - Use data-testid for stable selectors
   - Handle loading states with waitForTimeout
   - Test across different browsers

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Unit Tests
  run: npm run test

- name: Run E2E Tests
  run: npm run test:e2e
```

## Troubleshooting

### Tests failing due to missing dependencies
```bash
npm install
npx playwright install
```

### Port conflicts for E2E tests
Update `playwright.config.ts` to use a different port:
```typescript
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:3001',  // Change port
}
```

### Vitest can't find modules
Check `vitest.config.ts` path aliases match your project structure.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
