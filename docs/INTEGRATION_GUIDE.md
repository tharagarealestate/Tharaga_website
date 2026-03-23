# Integration Guide - Advanced Documentation Features

## Quick Start

### 1. Run Migrations

Execute these SQL migrations in Supabase Dashboard SQL Editor in order:

1. `supabase/migrations/073_ai_documentation_assistant.sql`
2. `supabase/migrations/074_interactive_walkthroughs.sql`
3. `supabase/migrations/075_documentation_analytics.sql`

### 2. Generate Embeddings

After adding documentation entries, run:

```bash
node scripts/generate-documentation-embeddings.mjs
```

### 3. Add Components to Dashboard

#### Option A: Add AI Assistant to Layout (Recommended)

Add to your main dashboard layout file:

```tsx
// app/(dashboard)/builder/layout.tsx or similar
'use client';

import AIDocumentationAssistant from '@/app/(dashboard)/builder/_components/documentation/AIDocumentationAssistant';
import { usePathname } from 'next/navigation';

export default function BuilderLayout({ children }) {
  const pathname = usePathname();
  
  return (
    <>
      {children}
      <AIDocumentationAssistant contextPageUrl={pathname} />
    </>
  );
}
```

#### Option B: Add to Specific Pages

```tsx
// In any feature page
import AIDocumentationAssistant from '@/app/(dashboard)/builder/_components/documentation/AIDocumentationAssistant';

export default function FeaturePage() {
  return (
    <div>
      {/* Your page content */}
      
      <AIDocumentationAssistant
        contextFeatureKey="behavioral_lead_scoring"
        contextPageUrl="/builder/leads"
      />
    </div>
  );
}
```

### 4. Add Recommendations Widget

Add to sidebar or feature discovery area:

```tsx
import AIFeatureRecommendations from '@/app/(dashboard)/builder/_components/documentation/AIFeatureRecommendations';

// In your sidebar component
<div className="p-4">
  <AIFeatureRecommendations />
</div>
```

### 5. Add Walkthroughs to Feature Pages

```tsx
import InteractiveWalkthrough from '@/app/(dashboard)/builder/_components/documentation/InteractiveWalkthrough';

export default function LeadScoringPage() {
  return (
    <div>
      {/* Your page content */}
      
      <InteractiveWalkthrough
        featureKey="behavioral_lead_scoring"
        onComplete={() => console.log('Walkthrough completed')}
      />
    </div>
  );
}
```

## Component Props

### AIDocumentationAssistant

```tsx
interface AIDocumentationAssistantProps {
  contextFeatureKey?: string;  // Optional: current feature key
  contextPageUrl?: string;      // Optional: current page URL
  isOpen?: boolean;             // Optional: controlled open state
  onClose?: () => void;         // Optional: close handler
}
```

### InteractiveWalkthrough

```tsx
interface InteractiveWalkthroughProps {
  featureKey: string;           // Required: feature key for walkthrough
  onComplete?: () => void;      // Optional: completion callback
  onDismiss?: () => void;       // Optional: dismiss callback
}
```

### AIFeatureRecommendations

No props required - automatically loads recommendations for current user.

## Environment Variables

Ensure these are set:

```env
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Testing

1. **AI Assistant**: Click floating bot icon, ask questions
2. **Recommendations**: Check sidebar/widget for recommendations
3. **Walkthroughs**: Create walkthrough in DB, visit feature page
4. **Analytics**: Events tracked automatically, view in admin dashboard

## Troubleshooting

- **No embeddings**: Run embedding generation script
- **RLS errors**: Check user authentication and policies
- **API errors**: Check environment variables and Supabase connection
- **No recommendations**: Ensure user has viewed some features first
































