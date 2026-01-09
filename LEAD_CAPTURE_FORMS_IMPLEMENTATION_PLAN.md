# Advanced Lead Capture Forms - Implementation Status

## ✅ Completed

### 1. Database Migration
- ✅ Migration `076_tamil_nadu_lead_capture_forms.sql` applied successfully
- ✅ Added `calculation_results` JSONB column to `lead_capture_submissions`
- ✅ Extended `leads` table with TN-specific fields:
  - `preferred_city`, `family_type`, `cultural_preferences`
  - `pmay_eligible`, `vastu_important`, `metro_proximity_preference`
  - `buyer_type_primary`, `buyer_type_confidence`, `purchase_timeline`
  - `phone_number`, `lead_score`
- ✅ Created `tn_government_schemes` table for PMAY/TNSCB tracking

### 2. API Routes Created
- ✅ `/api/lead-capture/calculate-roi` - ROI calculation with 5/10/15 year forecasts
- ✅ `/api/lead-capture/calculate-emi` - EMI calculation with amortization schedule
- ✅ `/api/lead-capture/loan-eligibility` - Loan eligibility with TN bank recommendations

### 3. Existing Infrastructure
- ✅ `/api/automation/lead-capture/submit` - Form submission handler (supports all 7 form types)
- ✅ Behavioral tracking integration (`useBehavioralTracking` hook)
- ✅ Design system patterns established (glassmorphism, gradients, animations)

## 🚧 In Progress / To Complete

### Form Components Needed (Following PropertyComparisonTool.tsx pattern)

#### 1. ROI Calculator ⚠️ HIGH PRIORITY
**Status**: API route ready, component needs creation
**File**: `app/components/lead-capture/ROICalculator.tsx`
**Steps**:
- Step 1: Property price, down payment, rental income (no email)
- Step 2: Email for comprehensive ROI report
- Step 3: Phone + investment timeline + purpose
- Step 4: Property visit scheduling

#### 2. EMI Calculator ⚠️ HIGH PRIORITY
**Status**: API route ready, component needs creation
**File**: `app/components/lead-capture/EMICalculator.tsx`
**Steps**:
- Step 1: Property price, down payment, tenure, interest rate (no email)
- Step 2: Email for loan eligibility report
- Step 3: Phone + loan status
- Step 4: Pre-approval assistance

#### 3. Budget Planner ⚠️ CRITICAL FOR TN
**Status**: Needs API route + component
**File**: `app/components/lead-capture/BudgetPlanner.tsx`
**API Route**: `/api/lead-capture/calculate-budget`
**Steps**:
- Step 1: Income, expenses, savings, family type (no email)
- Step 2: Email for budget report
- Step 3: Phone + preferred areas + property preferences
- Step 4: Property visit scheduling

#### 4. Home Loan Eligibility ⚠️ CRITICAL FOR TN
**Status**: API route ready, component needs creation
**File**: `app/components/lead-capture/LoanEligibilityCalculator.tsx`
**Steps**:
- Step 1: Income, CIBIL score, property price (no email)
- Step 2: Email for loan report with bank comparison
- Step 3: Phone + documents status
- Step 4: Pre-approval assistance scheduling

#### 5. Neighborhood Finder
**Status**: Needs API route + component
**File**: `app/components/lead-capture/NeighborhoodFinder.tsx`
**API Route**: `/api/lead-capture/neighborhood-analysis`
**Steps**:
- Step 1: Family type, priorities, localities (no email)
- Step 2: Email for neighborhood report
- Step 3: Phone + family profile (kids, elderly, work location)
- Step 4: Neighborhood tour scheduling

#### 6. Property Valuation
**Status**: Needs API route + component
**File**: `app/components/lead-capture/PropertyValuation.tsx`
**API Route**: `/api/lead-capture/property-valuation/estimate`
**Steps**:
- Step 1: Property details (type, area, locality, age) (no email)
- Step 2: Email for valuation report
- Step 3: Phone + ownership type + verification needs
- Step 4: Property inspection scheduling

## Implementation Pattern

All forms follow this pattern (see `PropertyComparisonTool.tsx`):

```typescript
// 1. State management for each step
const [currentStep, setCurrentStep] = useState(1);
const [submissionId, setSubmissionId] = useState<string | null>(null);
const [leadId, setLeadId] = useState<string | null>(null);
const [step1Data, setStep1Data] = useState<Step1Type>({...});

// 2. Step 1 handler - No email required
const handleStep1Submit = async (e: React.FormEvent) => {
  // Call calculation API if needed
  // Submit to /api/automation/lead-capture/submit
  // Store submission_id, proceed to step 2
};

// 3. Step 2 handler - Email for results
const handleStep2Submit = async (e: React.FormEvent) => {
  // Create/update lead
  // Submit to /api/automation/lead-capture/submit
  // Store lead_id, show results, proceed to step 3
};

// 4. Step 3 handler - Phone + qualification
const handleStep3Submit = async (e: React.FormEvent) => {
  // Update lead with phone and qualification data
  // Submit to /api/automation/lead-capture/submit
  // Trigger automation, proceed to step 4
};

// 5. Step 4 handler - Final profile/visit scheduling
const handleStep4Submit = async (e: React.FormEvent) => {
  // Complete submission
  // Trigger automation workflows
  // Show success screen
};

// 6. UI Structure
<AnimatePresence mode="wait">
  {currentStep === 1 && <Step1Component />}
  {currentStep === 2 && <Step2Component />}
  {currentStep === 3 && <Step3Component />}
  {currentStep === 4 && <Step4Component />}
</AnimatePresence>
```

## Design System

All forms use:
- Container: `bg-gradient-to-br from-slate-800/95 via-slate-800/95 to-slate-900/95 glow-border rounded-xl border border-amber-300/25`
- Primary Button: `bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 font-bold text-lg rounded-lg hover:shadow-lg hover:shadow-amber-500/30`
- Input: `bg-slate-700/50 text-white border border-slate-600/50 focus:border-amber-300/50`
- Animations: `framer-motion` with `initial={{ opacity: 0, x: 20 }}`, `animate={{ opacity: 1, x: 0 }}`

## Tamil Nadu Specific Features

1. **Bilingual Support**: Tamil + English labels (e.g., "Your Name (தங்கள் பெயர்)")
2. **PMAY Integration**: Check eligibility, show subsidy amounts
3. **Local Banks**: Indian Bank, SBI, Canara Bank recommendations
4. **Cultural Preferences**: Temple proximity, Vastu compliance, Tamil medium schools
5. **City-Specific Data**: Chennai, Coimbatore, Madurai areas and pricing
6. **Gold Loans**: Integration for down payment top-up
7. **Metro Connectivity**: Chennai Metro proximity impact on pricing

## Next Steps

1. Create ROI Calculator component (complete example)
2. Create Budget Planner component (critical for TN)
3. Create Home Loan Eligibility component (critical for TN)
4. Create remaining 3 components (EMI, Neighborhood, Valuation)
5. Update `/api/automation/lead-capture/submit` to handle `calculation_results` field
6. Integrate with automation workflows (WhatsApp, Email triggers)
7. Add Tamil language translations
8. Test end-to-end flow for each form

## Notes

- All forms use progressive profiling (no email in step 1)
- Behavioral tracking integrated via `useBehavioralTracking` hook
- Forms trigger automation workflows at steps 2, 3, and 4
- Lead scoring increases with each step completion
- TN-specific features enhance conversion for Tamil Nadu market





















