# Chennai Phase-1: Trust, Local, Actionable - Implementation Status

## ✅ COMPLETED

### 1. Database Schema (Migration: `chennai_phase1_trust_features`)
- ✅ `rera_snapshots` table - RERA verification with cryptographic hashes
- ✅ `property_documents` table - Document uploads with SHA256 hashing
- ✅ `property_risk_flags` table - Risk flags with severity levels
- ✅ `chennai_locality_insights` table - Chennai-specific insights
- ✅ `property_appreciation_bands` table - Explainable ML predictions
- ✅ `property_audit_pdfs` table - Generated audit PDFs
- ✅ RLS policies configured
- ✅ Indexes for performance

### 2. Backend Services
- ✅ `RERAVerificationService` - RERA snapshot fetching with HTML parsing and SHA256 hashing
- ✅ `DocumentVerificationService` - Document hashing and PDF generation
- ✅ Enhanced `/api/verify/rera` endpoint with snapshot support
- ✅ Dependencies added: beautifulsoup4, lxml, reportlab, Pillow

### 3. Frontend Components
- ✅ `RERAVerification.tsx` - RERA display component with legal disclaimer

### 4. Cleanup
- ✅ Removed 500+ data points feature
- ✅ Rolled back comprehensive property data tables
- ✅ Removed data collection service

---

## 🚧 IN PROGRESS

### 1. Document Upload & PDF Generation
- ⏳ API endpoint for document upload
- ⏳ Supabase Storage integration
- ⏳ PDF generation endpoint
- ⏳ UI component for document upload

### 2. Risk Flags System
- ⏳ Automated risk flag detection
- ⏳ Admin manual flagging UI
- ⏳ Risk flags display component

### 3. Chennai Locality Insights
- ⏳ Flood score data collection
- ⏳ Price trend data (5-year)
- ⏳ Infrastructure data
- ⏳ Rental yield calculation
- ⏳ Safety indicators
- ⏳ UI component for insights display

### 4. Explainable ML Appreciation Bands
- ⏳ ML model implementation (LOW/MEDIUM/HIGH)
- ⏳ Feature explanation system
- ⏳ Methodology page
- ⏳ UI component for predictions

### 5. Tamil Voice & Text Search
- ✅ Basic Tamil voice search exists (`app/app/tools/voice-tamil/page.tsx`)
- ⏳ Enhanced with fuzzy locality matching
- ⏳ Chennai micro-market mapping
- ⏳ Search bar integration

### 6. Builder Lead Flow Enhancement
- ✅ Basic lead system exists
- ⏳ Conversion tracking
- ⏳ Lead quality scoring
- ⏳ Dashboard metrics enhancement

### 7. Marketing Copy Replacement
- ⏳ Replace "100% fraud-free" → "Fraud-risk reduction toolkit"
- ⏳ Replace "Blockchain-verified titles" → "Document snapshot immutability"
- ⏳ Replace "500+ data points" → "Multi-dimensional property insights"
- ⏳ Replace ML accuracy claims → "Explainable ML-based appreciation bands"
- ⏳ Replace "Voice-first in 5+ languages" → "Tamil-first voice search (Chennai)"

### 8. Legal Disclaimers
- ✅ Legal disclaimer text defined
- ⏳ Add to all verification UIs
- ⏳ Add to all PDFs
- ⏳ "How verification works" modal/page

---

## 📋 TODO (Priority Order)

### Sprint 1: Trust Foundation (HIGHEST PRIORITY)
1. ✅ RERA snapshot + PDF audit + mandatory copy replacements + Legal Disclaimer integration
2. ⏳ Document upload + hashing + PDF workflow
3. ⏳ Risk flags display + admin manual flagging

### Sprint 2: Local Insights
4. ⏳ Insights tiles (flood + price sparkline + infra summary + rental yield) with fixtures
5. ⏳ Explainable ML band (predict & explanation) + methodology page

### Sprint 3: Search & UX
6. ⏳ Tamil voice & typed search mapping (v1) with fuzzy locality matching
7. ⏳ Builder lead ingestion + dashboard basic metrics

### Sprint 4: Operations
8. ⏳ Monitoring/logging + admin alerts + LEGAL_REVIEW_REQUIRED gating

---

## 🔍 Acceptance Criteria Status

### RERA Snapshot Test
- ✅ Snapshot object with parsed fields, timestamp, SHA256 hash
- ⏳ UI returns RERA: <number> and "View RERA snapshot" link
- ⏳ PDF includes snapshot and Legal Disclaimer

### Document Upload Test
- ⏳ Upload sample EC/OC PDF fixtures
- ⏳ System computes SHA256 matching expected values
- ⏳ PDF audit containing file names and hashes

### Risk Flags Test
- ⏳ Inject conditions triggering RERA expired and EC missing flags
- ⏳ Listing displays chips with explanations and suggested actions

### Insights Test
- ⏳ Using fixture data for flood/price/infrastructure
- ⏳ Insights section returns and displays all required fields

### ML Predict Test
- ⏳ Given synthetic locality feature vector
- ⏳ Model returns LOW|MEDIUM|HIGH band, confidence, top-3 explanations
- ⏳ UI displays band and "Why?" expanded explanation

### Voice Search Test
- ⏳ Given Tamil audio fixture
- ⏳ Voice search provides transcription and top-2 locality suggestions

### Builder Lead Flow Test
- ⏳ Simulate lead ingestion → mark as VISITED
- ⏳ System updates overview metrics

### Copy / Legal Test
- ⏳ Confirm no banned phrases appear
- ⏳ Mark PR as LEGAL_REVIEW_REQUIRED if found

---

## 📝 Notes

- **SYNTHETIC Data**: All data sources marked as SYNTHETIC until real data sources are approved
- **Legal Review**: Any PR touching verification/fraud/accuracy/blockchain must be flagged
- **Robots Compliance**: Scraping requires explicit approval
- **Production Safety**: Conservative language enforced throughout

---

## 🎯 Next Immediate Steps

1. Complete document upload API endpoint
2. Build PDF generation endpoint
3. Create risk flags detection logic
4. Build Chennai insights data collection
5. Replace all marketing copy
6. Add legal disclaimers to all UIs













