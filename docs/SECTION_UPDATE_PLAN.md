# Section Update Plan - Deep Analysis

## Analysis Summary
After deep analysis with advanced reasoning, here's the implementation plan for each section:

### 1. ContactsSection ✅ HIGH PRIORITY
**Current Structure:**
- Uses custom header with manual styling
- Uses `getCardClassName()` for stats cards (5 cards in grid)
- Uses `getCardClassName()` for filter card
- Uses `getCardClassName()` for contact list items
- Manual loading/empty states

**Updates Needed:**
- ✅ Replace header with `StandardPageWrapper`
- ✅ Stats cards: Use `GlassCard` with `statCard` props (5 cards in grid - custom grid needed)
- ✅ Filter card: Use `GlassCard` with `sectionCard` props OR keep as simple card
- ✅ Contact list: Use `StandardCard` wrapper OR keep individual cards with GlassCard
- ✅ Loading state: Use `LoadingState` component
- ✅ Empty state: Use `EmptyState` component

**Special Handling:**
- Stats grid: Need custom grid (5 columns: 2 on sm, 5 on larger) - not standard 4-column
- Contact cards: Individual cards in list - can use GlassCard with custom styling
- Filter section: Can be a simple GlassCard

### 2. NegotiationsSection ✅ MEDIUM PRIORITY
**Current Structure:**
- Uses `getSectionClassName()` wrapper
- Wraps `NegotiationsDashboard` component

**Updates Needed:**
- ✅ Replace with `StandardPageWrapper`
- ✅ Wrap content in appropriate container (NegotiationsDashboard is a complex component)

**Special Handling:**
- NegotiationsDashboard is a complex child component - just wrap it, don't modify it

### 3. PipelineSection ✅ MEDIUM PRIORITY
**Current Structure:**
- Uses `getSectionClassName()` wrapper  
- Wraps `LeadPipelineKanban` component

**Updates Needed:**
- ✅ Replace with `StandardPageWrapper`
- ✅ Wrap content in appropriate container

**Special Handling:**
- LeadPipelineKanban is a complex component - just wrap it

### 4. ContractsSection ✅ MEDIUM PRIORITY
**Current Structure:**
- Uses `getSectionClassName()` wrapper
- Wraps `ContractsManager` component

**Updates Needed:**
- ✅ Replace with `StandardPageWrapper`
- ✅ Wrap content appropriately

**Special Handling:**
- ContractsManager is complex - just wrap it

### 5. ViewingsSection ✅ MEDIUM PRIORITY
**Current Structure:**
- Uses `getSectionClassName()` wrapper
- Wraps `ViewingsCalendar` component

**Updates Needed:**
- ✅ Replace with `StandardPageWrapper`
- ✅ Wrap content appropriately

**Special Handling:**
- ViewingsCalendar is complex - just wrap it

### 6. BehaviorAnalyticsSection ✅ MEDIUM PRIORITY
**Current Structure:**
- Uses `getSectionClassName()` wrapper
- Wraps `BehaviorTrackingPage` component

**Updates Needed:**
- ✅ Replace with `StandardPageWrapper`
- ✅ Wrap content appropriately

**Special Handling:**
- BehaviorTrackingPage is complex - just wrap it

### 7. DealLifecycleSection ✅ MEDIUM PRIORITY
**Current Structure:**
- Uses `getSectionClassName()` wrapper
- Wraps `DealLifecycleTracker` component

**Updates Needed:**
- ✅ Replace with `StandardPageWrapper`
- ✅ Wrap content appropriately

**Special Handling:**
- DealLifecycleTracker is complex - just wrap it

### 8. ClientOutreachSection ⚠️ COMPLEX
**Current Structure:**
- Uses `getSectionClassName()` in multiple places
- Complex tab-based interface
- Multiple modals and forms

**Updates Needed:**
- ⚠️ Replace main wrapper with `StandardPageWrapper`
- ⚠️ Individual cards can use GlassCard where appropriate
- ⚠️ Keep tab structure as-is (it's functional)

**Special Handling:**
- Complex component with tabs - update wrapper only, keep internal structure

### 9. UltraAutomationAnalyticsSection ⚠️ COMPLEX
**Current Structure:**
- Uses `getSectionClassName()` multiple times
- Complex analytics with charts
- Multiple metric cards

**Updates Needed:**
- ⚠️ Replace main wrapper with `StandardPageWrapper`
- ⚠️ Metric cards already use GlassCard - verify they match design system
- ⚠️ Charts and analytics - keep as-is

**Special Handling:**
- Already partially updated - verify consistency

### 10. LeadsSection ⚠️ VERY COMPLEX
**Current Structure:**
- Custom background gradients (needs removal)
- Complex filter system
- Multiple modals
- Custom command center

**Updates Needed:**
- ⚠️ Remove custom backgrounds (layout handles it)
- ⚠️ Update main section wrapper
- ⚠️ Keep filter system (functional)
- ⚠️ Update card styles to use GlassCard

**Special Handling:**
- Most complex section - needs careful update
- Filter system and modals should be preserved
- Focus on wrapper and card styling

## Implementation Order

1. **ContactsSection** - High priority, straightforward structure
2. **Simple wrapper sections** (Negotiations, Pipeline, Contracts, Viewings, Behavior, DealLifecycle) - Just wrapper updates
3. **Complex sections** (ClientOutreach, UltraAutomationAnalytics, LeadsSection) - Requires careful analysis

## Key Principles

1. **Use StandardPageWrapper** for all page headers
2. **Use StandardCard** for content containers (Recent Leads, My Properties style)
3. **Use GlassCard** directly for metric/stats cards
4. **Use EmptyState/LoadingState** for consistent states
5. **Preserve complex child components** - just wrap them properly
6. **Maintain functionality** - only update styling, not behavior

