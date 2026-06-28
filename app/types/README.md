# Lead Generation Types

Complete TypeScript type definitions for the Tharaga Lead Generation System.

## Files

- `lead-generation.ts` - Main type definitions
- `lead-generation.example.ts` - Usage examples
- `lead-generation-types.test.ts` - Comprehensive test suite

## Usage

### Basic Import

```typescript
import type {
  UserBehavior,
  LeadScore,
  LeadInteraction,
  LeadPipeline,
  BuilderMetrics,
  MarketingCampaign,
  BuyerPreferences,
  AIRecommendation,
} from '@/types/lead-generation'
```

### Helper Functions

```typescript
import {
  isRecommendationExpired,
  getScoreBadge,
  getStageBadge,
} from '@/types/lead-generation'

// Check if recommendation is expired
const expired = isRecommendationExpired(recommendation)

// Get score badge configuration
const badge = getScoreBadge('Hot Lead')
// Returns: { emoji: '🔥', text: 'Hot Lead', color: 'text-red-600', bgColor: 'bg-red-50' }

// Get stage badge configuration
const stageBadge = getStageBadge('negotiation')
// Returns: { label: 'Negotiating', color: 'bg-yellow-100 text-yellow-800' }
```

## Type Definitions

### Core Types

- **UserBehavior** - Tracks user interactions (property views, searches, etc.)
- **LeadScore** - AI-calculated lead scores with breakdown
- **LeadInteraction** - Builder-lead communication records
- **LeadSource** - Marketing attribution data
- **LeadPipeline** - Sales funnel tracking
- **BuilderMetrics** - Builder performance metrics
- **MarketingCampaign** - Campaign ROI tracking
- **BuyerPreferences** - AI matching preferences
- **AIRecommendation** - Property recommendations

### Enriched Types

- **EnrichedLead** - Lead data with joined user and property information
- **LeadAnalytics** - Aggregated lead statistics

### API Types

- **CalculateScoreRequest/Response** - Lead score calculation
- **GetLeadsRequest/Response** - Lead listing with pagination
- **CreateInteractionRequest/Response** - Interaction creation

## Database Schema Alignment

These types match the exact database schema created in the migration:
`supabase/migrations/20240101000001_lead_generation_complete.sql`

## Testing

Run the test suite to verify type correctness:

```bash
npm test -- lead-generation-types.test.ts
```

All 18 tests pass, covering:
- Type structure validation
- Null value handling
- Helper function correctness
- API response type validation

## Notes

- `AIRecommendation.is_expired` is computed at query time (not stored in DB)
- Use `isRecommendationExpired()` helper function to check expiration
- All timestamps are ISO 8601 strings
- All numeric scores use DECIMAL precision matching the database schema

