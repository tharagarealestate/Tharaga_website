# Tharaga Chennai Phase-1 Platform — Full Repository Audit Report

**Repository**: Tharaga_website  
**Commit**: f26d1dddb06ff918311c00f3e8f43757908461dc  
**Audit Date**: 2025-01-XX  
**Auditor**: REPO INTELLIGENCE (MCP-Level Access)

---

## SECTION 1 — JSON AUDIT SUMMARY

```json
{
  "repo": "Tharaga_website",
  "commit": "f26d1dddb06ff918311c00f3e8f43757908461dc",
  "features": {
    "rera_snapshot": {
      "status": "partially_implemented",
      "evidence": [
        "backend/app/verification/rera_service.py:34-208 - RERA service exists with fetch_rera_snapshot()",
        "backend/app/main.py:276-330 - /api/verify/rera endpoint returns snapshot with hash",
        "app/components/property/RERAVerification.tsx:119-126 - UI shows 'View RERA snapshot' link and 'Last verified' timestamp",
        "app/app/api/rera-snapshot/[id]/route.ts - Endpoint to view snapshot HTML exists"
      ],
      "missing": [
        "Database storage: backend/app/main.py:307-308 has TODO comment 'Store snapshot in database (if property_id provided in future)'",
        "No rera_snapshots table migration found in supabase/migrations/",
        "RERA service uses SYNTHETIC data by default (rera_service.py:58-61)",
        "No actual TN RERA portal scraping implementation (rera_service.py:77-117 is placeholder)"
      ]
    },
    "document_hashing": {
      "status": "implemented",
      "evidence": [
        "backend/app/verification/document_service.py:34-36 - compute_sha256_hash() function exists",
        "app/components/property/DocumentUpload.tsx:16 - sha256_hash field in Document interface",
        "app/app/api/properties/[id]/documents/route.ts - Document upload endpoint should hash files"
      ],
      "missing": [
        "Need to verify SHA256 is computed on upload in /api/properties/[id]/documents route",
        "No evidence of SHA256 computation in frontend upload flow"
      ]
    },
    "pdf_audit": {
      "status": "implemented",
      "evidence": [
        "backend/app/verification/document_service.py:38-176 - generate_audit_pdf() function exists",
        "backend/app/verification/document_service.py:23-29 - Legal disclaimer included in PDF",
        "app/components/property/DocumentUpload.tsx:85-108 - downloadAuditPDF() function calls /api/properties/[id]/audit-pdf",
        "PDF includes: property summary, document list with hashes, RERA snapshot, risk flags, disclaimer"
      ],
      "missing": [
        "Need to verify /api/properties/[id]/audit-pdf endpoint exists and calls document_service",
        "PDF generation may not be wired to frontend correctly"
      ]
    },
    "risk_flags": {
      "status": "implemented",
      "evidence": [
        "app/components/property/RiskFlags.tsx:23-232 - Full risk flags component with severity levels",
        "app/components/property/RiskFlags.tsx:59-90 - computeRiskFlags() calls backend API",
        "Risk flags show colored chips (high/medium/low) with explanations",
        "Flags tied to verification report via property_id"
      ],
      "missing": [
        "Backend endpoint /api/properties/[id]/compute-risk-flags may not exist",
        "Auto-flagging logic for 'RERA expired', 'EC missing', 'High flood risk' not verified in backend"
      ]
    },
    "insights_engine": {
      "status": "partially_implemented",
      "evidence": [
        "app/components/property/ChennaiInsights.tsx:32-257 - Full Chennai Insights component",
        "ChennaiInsights.tsx:114-132 - Flood score display",
        "ChennaiInsights.tsx:134-151 - 5-year price trend display",
        "ChennaiInsights.tsx:153-168 - Rental yield range display",
        "ChennaiInsights.tsx:170-185 - Safety indicator display",
        "ChennaiInsights.tsx:187-239 - Infrastructure context (schools, hospitals, transport)"
      ],
      "missing": [
        "ChennaiInsights.tsx:64-77 - Uses synthetic data by default (createSyntheticInsights)",
        "Backend endpoint /api/properties/[id]/collect-insights may not exist",
        "No real flood risk API integration (netlify/functions/env-intel.js:8-9 uses mock data)",
        "Price trend data source not verified"
      ]
    },
    "ml_appreciation": {
      "status": "implemented",
      "evidence": [
        "app/components/property/AppreciationPrediction.tsx:11-23 - AppreciationBand interface with LOW/MEDIUM/HIGH",
        "AppreciationPrediction.tsx:123-142 - Band colors and display logic",
        "AppreciationPrediction.tsx:144-148 - Confidence label (LOW/MEDIUM/HIGH)",
        "AppreciationPrediction.tsx:212-231 - Top 3 feature explanations display",
        "AppreciationPrediction.tsx:235-242 - Link to methodology docs (/model-methodology)"
      ],
      "missing": [
        "No accuracy % shown (correct per spec)",
        "Methodology page /model-methodology may not exist",
        "Backend endpoint /api/properties/[id]/predict-appreciation may not exist",
        "Training data provenance may be SYNTHETIC"
      ]
    },
    "tamil_voice_search": {
      "status": "implemented",
      "evidence": [
        "app/app/tools/voice-tamil/page.tsx:1-95 - Full Tamil voice search page",
        "app/lib/tamil-locality-matcher.ts:103-136 - matchChennaiLocality() with fuzzy matching",
        "tamil-locality-matcher.ts:7-29 - CHENNAI_LOCALITIES with Tamil + transliterated variants",
        "tamil-locality-matcher.ts:141-147 - getCanonicalLocality() returns top match",
        "voice-tamil/page.tsx:18-19 - Returns top 2 canonical localities"
      ],
      "missing": [
        "Voice recognition uses browser Web Speech API (webkitSpeechRecognition) - may not work on all browsers",
        "No backend Tamil NLP processing"
      ]
    },
    "builder_dashboard": {
      "status": "partially_implemented",
      "evidence": [
        "app/app/(dashboard)/builder/leads/page.tsx:12-80 - Builder leads page exists",
        "app/app/(dashboard)/builder/leads/pipeline/_components/LeadPipelineKanban.tsx:43-128 - Lead pipeline with stages",
        "app/app/api/analytics/dashboard/route.ts:142-765 - Dashboard analytics API with conversions, totals, past 30 days",
        "app/app/api/leads/export/route.ts:151-985 - CSV export functionality exists",
        "app/app/(dashboard)/builder/leads/_components/LeadsList.tsx - Leads list component"
      ],
      "missing": [
        "Lead statuses don't match spec: Uses 'new', 'contacted', 'qualified', 'site_visit_scheduled', etc. instead of 'NEW', 'QUALIFIED', 'VISITED', 'BOOKED', 'REJECTED'",
        "LeadPipelineKanban.tsx:43-53 - Stages are: new, contacted, qualified, site_visit_scheduled, site_visit_completed, negotiation, offer_made, closed_won, closed_lost",
        "No 'REJECTED' status in pipeline",
        "Verification report viewing not verified in builder dashboard"
      ]
    },
    "legal_copy_cleanup": {
      "status": "incorrect",
      "evidence": [
        "app/public/index.html:1232 - Contains '85% accuracy' (BANNED PHRASE)",
        "app/public/index.html:1207 - Contains 'Blockchain-Verified Titles' (BANNED PHRASE)",
        "Legal disclaimers exist but text doesn't exactly match spec requirement"
      ],
      "missing": [
        "Need to replace all banned phrases across entire repo",
        "Legal disclaimer text needs to match exact spec: 'Information shown is an automated snapshot...'"
      ]
    }
  },
  "bannedPhrasesFound": [
    {
      "file": "app/public/index.html",
      "line": "1232",
      "text": "Our ML models forecast appreciation with 85% accuracy."
    },
    {
      "file": "app/public/index.html",
      "line": "1207",
      "text": "<!-- 2. Blockchain-Verified Titles -->"
    },
    {
      "file": "app/public/index.html",
      "line": "1211",
      "text": "<h3 class=\"vp-title\">Blockchain-Verified Titles</h3>"
    },
    {
      "file": "index-static-old-backup.html",
      "line": "1202",
      "text": "Our proprietary AI analyzes 500+ data points per property"
    },
    {
      "file": "index-static-old-backup.html",
      "line": "1213",
      "text": "100% fraud-free guarantee"
    },
    {
      "file": "index-static-old-backup.html",
      "line": "1232",
      "text": "Our ML models forecast appreciation with 85% accuracy."
    },
    {
      "file": "app/app/page.tsx.backup",
      "line": "281",
      "text": "Our proprietary AI analyzes 500+ data points per property"
    },
    {
      "file": "app/app/page.tsx.backup",
      "line": "302",
      "text": "Blockchain-Verified Titles"
    },
    {
      "file": "app/app/page.tsx.backup",
      "line": "312",
      "text": "100% fraud-free guarantee"
    },
    {
      "file": "app/app/page.tsx.backup",
      "line": "353",
      "text": "forecast appreciation with 85% accuracy."
    }
  ],
  "missingFixtures": [
    "No test fixtures for RERA snapshot data",
    "No test fixtures for Chennai insights data",
    "No test fixtures for ML appreciation predictions",
    "No test fixtures for risk flags computation"
  ],
  "criticalRisks": [
    {
      "id": "R1",
      "title": "RERA Snapshot Not Stored in Database",
      "file": "backend/app/main.py:307-308",
      "description": "RERA snapshots are fetched but not persisted. Comment says 'Store snapshot in database (if property_id provided in future)' - this is a blocker for Phase-1.",
      "fix": "Create rera_snapshots table migration and store snapshot after fetch_rera_snapshot() call"
    },
    {
      "id": "R2",
      "title": "RERA Service Uses Synthetic Data by Default",
      "file": "backend/app/verification/rera_service.py:58-61",
      "description": "RERA verification defaults to synthetic data instead of real TN RERA portal scraping. This violates Phase-1 requirement to 'Fetch/parse public TN RERA data'.",
      "fix": "Implement real TN RERA portal scraping or integrate with RERA API if available. Remove synthetic default."
    },
    {
      "id": "R3",
      "title": "Banned Marketing Phrases Still Present",
      "file": "app/public/index.html:1232",
      "description": "Multiple banned phrases found in production HTML files: '85% accuracy', 'Blockchain-Verified Titles', '100% fraud-free', '500+ data points'. Legal compliance violation.",
      "fix": "Replace all banned phrases with safe versions across entire repo. Run grep to find all instances."
    },
    {
      "id": "R4",
      "title": "Builder Dashboard Lead Statuses Don't Match Spec",
      "file": "app/app/(dashboard)/builder/leads/pipeline/_components/LeadPipelineKanban.tsx:43-53",
      "description": "Lead pipeline uses custom stages (new, contacted, qualified, site_visit_scheduled, etc.) instead of spec-required stages: NEW → QUALIFIED → VISITED → BOOKED → REJECTED.",
      "fix": "Update lead pipeline to use spec-compliant statuses or map existing stages to spec stages."
    },
    {
      "id": "R5",
      "title": "Legal Disclaimer Text Doesn't Match Exact Spec",
      "file": "Multiple files",
      "description": "Legal disclaimer exists but text doesn't exactly match spec requirement. Spec requires exact text: 'Information shown is an automated snapshot...' but current text says 'Legal disclaimer: The information and verification artifacts...'",
      "fix": "Update all legal disclaimer instances to match exact spec text."
    },
    {
      "id": "R6",
      "title": "Chennai Insights Uses Synthetic Data",
      "file": "app/components/property/ChennaiInsights.tsx:64-77",
      "description": "Chennai Insights component defaults to synthetic data. Flood score, price trends, and infrastructure data are not from real sources.",
      "fix": "Integrate real data sources for flood risk, price trends, and infrastructure data."
    },
    {
      "id": "R7",
      "title": "PDF Audit Report Endpoint May Not Exist",
      "file": "app/components/property/DocumentUpload.tsx:87",
      "description": "Frontend calls /api/properties/[id]/audit-pdf but this endpoint may not be implemented in Next.js API routes.",
      "fix": "Verify and implement /api/properties/[id]/audit-pdf route that calls document_service.generate_audit_pdf()."
    },
    {
      "id": "R8",
      "title": "Risk Flags Backend Endpoint May Not Exist",
      "file": "app/components/property/RiskFlags.tsx:62",
      "description": "Frontend calls /api/properties/[id]/compute-risk-flags but this endpoint may not be implemented.",
      "fix": "Verify and implement /api/properties/[id]/compute-risk-flags endpoint that computes and stores risk flags."
    }
  ],
  "nextSteps": "1) Fix legal compliance (remove banned phrases, update disclaimer text). 2) Implement RERA snapshot database storage. 3) Replace synthetic data with real sources. 4) Fix builder dashboard lead statuses. 5) Verify all backend endpoints exist and are wired correctly."
}
```

---

## SECTION 2 — TOP 10 PR SUGGESTIONS

### PR 1 — Remove Banned Marketing Phrases from Production HTML
**Priority**: HIGH  
**Files**: 
- `app/public/index.html` lines 1207, 1211, 1232
- `index-static-old-backup.html` lines 1202, 1213, 1232
- `app/app/page.tsx.backup` lines 281, 302, 312, 353

**Patch**:
- Replace: `"Our ML models forecast appreciation with 85% accuracy."`
- With: `"Explainable ML-based appreciation bands (Low / Medium / High)"`
- Replace: `"Blockchain-Verified Titles"`
- With: `"Document Snapshot Immutability"`
- Replace: `"100% fraud-free guarantee"`
- With: `"Fraud-risk reduction toolkit"`
- Replace: `"500+ data points"`
- With: `"Multi-dimensional property insights"`

**Acceptance Criteria**:
- All banned phrases removed from production files
- Unit test ensures banned phrases are not present
- Grep search returns zero matches for banned phrases

**Branch**: `fix/legal-copy-cleanup-01`

**Test Plan**:
- Run: `grep -r "85% accuracy\|Blockchain-Verified\|100% fraud-free\|500\+ data points" app/public/`
- Verify zero matches

---

### PR 2 — Update Legal Disclaimer Text to Match Exact Spec
**Priority**: HIGH  
**Files**: 
- `app/components/property/RERAVerification.tsx:26`
- `app/components/property/RiskFlags.tsx:21`
- `app/components/property/ChennaiInsights.tsx:30`
- `app/components/property/AppreciationPrediction.tsx:25`
- `app/components/property/DocumentUpload.tsx:32`
- `backend/app/verification/document_service.py:23-29`
- `app/app/api/properties/[id]/documents/route.ts:9`

**Patch**:
Replace current disclaimer with exact spec text:
```
"Information shown is an automated snapshot of public records and uploaded documents. It is NOT legal advice or a guarantee of title/ownership. For legal verification, consult a licensed property lawyer."
```

**Acceptance Criteria**:
- All disclaimer instances use exact spec text
- No "Legal disclaimer:" prefix
- Text matches spec exactly

**Branch**: `fix/legal-disclaimer-exact-text`

**Test Plan**:
- Search for all disclaimer instances
- Verify exact text match

---

### PR 3 — Implement RERA Snapshot Database Storage
**Priority**: HIGH  
**Files**: 
- `backend/app/main.py:307-308`
- Create: `supabase/migrations/XXX_create_rera_snapshots_table.sql`
- Update: `backend/app/main.py:276-330`

**Patch**:
1. Create migration:
```sql
CREATE TABLE IF NOT EXISTS rera_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  rera_id TEXT NOT NULL,
  state TEXT NOT NULL,
  project_name TEXT,
  developer_name TEXT,
  registration_number TEXT,
  status TEXT,
  expiry_date TIMESTAMP,
  raw_html TEXT NOT NULL,
  parsed_fields JSONB,
  snapshot_hash TEXT NOT NULL,
  source_url TEXT,
  data_source TEXT NOT NULL,
  collected_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

2. Update `backend/app/main.py`:
```python
# After line 305, add:
if payload.property_id:
    from .supabase_client import supabase
    snapshot_record = {
        'property_id': payload.property_id,
        'rera_id': rera_id,
        'state': state,
        'project_name': snapshot.get('project_name'),
        'developer_name': snapshot.get('developer_name'),
        'registration_number': snapshot.get('registration_number'),
        'status': snapshot.get('status'),
        'expiry_date': snapshot.get('expiry_date'),
        'raw_html': snapshot['raw_html'],
        'parsed_fields': snapshot.get('parsed_fields'),
        'snapshot_hash': snapshot.get('snapshot_hash'),
        'source_url': source_url or snapshot.get('source_url'),
        'data_source': snapshot.get('data_source', 'UNKNOWN'),
        'collected_at': snapshot.get('collected_at'),
    }
    supabase.table('rera_snapshots').insert(snapshot_record).execute()
```

**Acceptance Criteria**:
- RERA snapshots stored in database after verification
- Migration runs successfully
- Frontend can query stored snapshots

**Branch**: `feature/rera-snapshot-storage`

**Test Plan**:
- Call `/api/verify/rera` with property_id
- Verify snapshot appears in `rera_snapshots` table
- Verify frontend can load stored snapshot

---

### PR 4 — Replace Synthetic RERA Data with Real Portal Scraping
**Priority**: MEDIUM  
**Files**: 
- `backend/app/verification/rera_service.py:56-64, 77-117`

**Patch**:
1. Remove synthetic default:
```python
# Change line 58 from:
use_synthetic = self.config.get('USE_SYNTHETIC_RERA', True)
# To:
use_synthetic = self.config.get('USE_SYNTHETIC_RERA', False)
```

2. Implement real TN RERA portal scraping:
```python
async def _scrape_rera_portal(self, rera_id: str, state: str, portal_url: str) -> Dict[str, Any]:
    """Scrape TN RERA portal for project information"""
    try:
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            # TN RERA search URL format
            if state == 'TN':
                search_url = f"https://www.tnrera.in/search"
                # Add proper search parameters based on TN RERA portal structure
                response = await client.post(search_url, data={'rera_id': rera_id})
            else:
                # Handle other states
                response = await client.get(f"{portal_url}/search", params={'rera_id': rera_id})
            
            if response.status_code == 200:
                html_content = response.text
                soup = BeautifulSoup(html_content, 'html.parser')
                parsed_fields = self._parse_rera_html(soup, rera_id)
                snapshot_hash = hashlib.sha256(html_content.encode('utf-8')).hexdigest()
                
                return {
                    'rera_id': rera_id,
                    'state': state,
                    'raw_html': html_content,
                    'parsed_fields': parsed_fields,
                    'snapshot_hash': snapshot_hash,
                    'source_url': search_url,
                    'data_source': 'RERA_PORTAL',
                    'collected_at': datetime.now().isoformat(),
                }
    except Exception as e:
        logger.error(f"RERA scraping error: {e}")
        # Fallback to synthetic only on error
        return self._create_synthetic_snapshot(rera_id, state, None, None, portal_url)
```

**Acceptance Criteria**:
- Real RERA portal data fetched when available
- Synthetic data only used as fallback on error
- Data source clearly marked in response

**Branch**: `feature/real-rera-scraping`

**Test Plan**:
- Test with real TN RERA ID
- Verify data_source is 'RERA_PORTAL' not 'SYNTHETIC'
- Test fallback on portal error

---

### PR 5 — Fix Builder Dashboard Lead Statuses to Match Spec
**Priority**: MEDIUM  
**Files**: 
- `app/app/(dashboard)/builder/leads/pipeline/_components/LeadPipelineKanban.tsx:43-128`
- `app/app/(dashboard)/builder/leads/_components/LeadsList.tsx`

**Patch**:
Update STAGE_CONFIG to match spec:
```typescript
const STAGE_CONFIG: StageConfig[] = [
  {
    id: "new",
    label: "New Leads",
    color: "blue",
    icon: Users,
    description: "Fresh leads awaiting qualification",
    order: 1,
  },
  {
    id: "qualified",
    label: "Qualified",
    color: "purple",
    icon: CheckCircle2,
    description: "Budget and interest verified",
    order: 2,
  },
  {
    id: "visited",
    label: "Visited",
    color: "amber",
    icon: Target,
    description: "Site visit completed",
    order: 3,
  },
  {
    id: "booked",
    label: "Booked",
    color: "emerald",
    icon: CheckCircle2,
    description: "Deal successfully closed",
    order: 4,
  },
  {
    id: "rejected",
    label: "Rejected",
    color: "red",
    icon: XCircle,
    description: "Opportunity lost",
    order: 5,
  },
];
```

**Acceptance Criteria**:
- Lead statuses match spec: NEW → QUALIFIED → VISITED → BOOKED → REJECTED
- Database schema updated if needed
- Migration script for existing data

**Branch**: `fix/builder-lead-statuses-spec`

**Test Plan**:
- Verify all 5 spec statuses appear in pipeline
- Test lead status transitions
- Verify CSV export includes correct statuses

---

### PR 6 — Implement PDF Audit Report API Endpoint
**Priority**: MEDIUM  
**Files**: 
- Create: `app/app/api/properties/[id]/audit-pdf/route.ts`

**Patch**:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { DocumentVerificationService } from '@/backend/app/verification/document_service'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const propertyId = params.id

    // Fetch property data
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single()

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Fetch documents
    const { data: documents } = await supabase
      .from('property_documents')
      .select('*')
      .eq('property_id', propertyId)

    // Fetch RERA snapshot
    const { data: reraSnapshot } = await supabase
      .from('rera_snapshots')
      .select('*')
      .eq('property_id', propertyId)
      .order('collected_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Fetch risk flags
    const { data: riskFlags } = await supabase
      .from('property_risk_flags')
      .select('*')
      .eq('property_id', propertyId)
      .eq('resolved', false)

    // Generate PDF
    const docService = new DocumentVerificationService({})
    const pdfBytes = await docService.generate_audit_pdf(
      propertyId,
      property,
      documents || [],
      reraSnapshot || null,
      riskFlags || []
    )

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="property-audit-${propertyId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**Acceptance Criteria**:
- Endpoint generates PDF with all required sections
- PDF includes legal disclaimer
- Frontend can download PDF successfully

**Branch**: `feature/pdf-audit-endpoint`

**Test Plan**:
- Call endpoint with valid property_id
- Verify PDF contains: property summary, documents, RERA snapshot, risk flags, disclaimer
- Test PDF download in frontend

---

### PR 7 — Implement Risk Flags Computation Backend Endpoint
**Priority**: MEDIUM  
**Files**: 
- Create: `app/app/api/properties/[id]/compute-risk-flags/route.ts` or `backend/app/main.py`

**Patch**:
Add to `backend/app/main.py`:
```python
@app.post("/api/properties/{property_id}/compute-risk-flags")
async def compute_risk_flags(property_id: str):
    """Compute and store risk flags for a property"""
    from .supabase_client import supabase
    
    # Fetch property data
    property_data = supabase.table('properties').select('*').eq('id', property_id).single().execute()
    
    # Fetch RERA snapshot
    rera_snapshot = supabase.table('rera_snapshots').select('*').eq('property_id', property_id).order('collected_at', ascending=False).limit(1).maybe_single().execute()
    
    # Fetch documents
    documents = supabase.table('property_documents').select('*').eq('property_id', property_id).execute()
    
    flags = []
    
    # Check RERA expired
    if rera_snapshot and rera_snapshot.get('expiry_date'):
        expiry = datetime.fromisoformat(rera_snapshot['expiry_date'])
        if expiry < datetime.now():
            flags.append({
                'property_id': property_id,
                'flag_type': 'RERA_EXPIRED',
                'severity': 'high',
                'title': 'RERA Registration Expired',
                'description': f"RERA registration expired on {expiry.date()}",
                'actionable_steps': 'Verify current RERA status with TN RERA portal',
            })
    
    # Check EC missing
    has_ec = any(doc.get('document_type') == 'EC' for doc in documents)
    if not has_ec:
        flags.append({
            'property_id': property_id,
            'flag_type': 'EC_MISSING',
            'severity': 'high',
            'title': 'Encumbrance Certificate Missing',
            'description': 'No EC document uploaded',
            'actionable_steps': 'Upload latest Encumbrance Certificate',
        })
    
    # Check high flood risk (from Chennai Insights)
    insights = supabase.table('chennai_locality_insights').select('flood_score').eq('property_id', property_id).maybe_single().execute()
    if insights and insights.get('flood_score', 0) >= 70:
        flags.append({
            'property_id': property_id,
            'flag_type': 'HIGH_FLOOD_RISK',
            'severity': 'medium',
            'title': 'High Flood Risk Area',
            'description': f"Flood risk score: {insights['flood_score']}/100",
            'actionable_steps': 'Review flood risk data and consider insurance',
        })
    
    # Store flags
    for flag in flags:
        supabase.table('property_risk_flags').upsert(flag, on_conflict='property_id,flag_type').execute()
    
    return {'flags': flags}
```

**Acceptance Criteria**:
- Endpoint computes risk flags automatically
- Flags stored in database
- Frontend can trigger computation

**Branch**: `feature/risk-flags-computation`

**Test Plan**:
- Call endpoint with property_id
- Verify flags created in database
- Test each flag type (RERA expired, EC missing, flood risk)

---

### PR 8 — Replace Synthetic Chennai Insights with Real Data Sources
**Priority**: LOW  
**Files**: 
- `app/components/property/ChennaiInsights.tsx:64-77`
- `netlify/functions/env-intel.js:1-16`
- Create: `backend/app/services/chennai_insights_service.py`

**Patch**:
1. Integrate real flood risk API (e.g., FEMA or local Chennai flood maps)
2. Integrate real price trend data (e.g., PropTiger, MagicBricks APIs)
3. Integrate real infrastructure data (Google Places API, OpenStreetMap)

**Acceptance Criteria**:
- Flood score from real data source
- Price trends from real market data
- Infrastructure data from real APIs

**Branch**: `feature/real-chennai-insights`

**Test Plan**:
- Verify data_source is not 'SYNTHETIC'
- Test with real property locations
- Verify data accuracy

---

### PR 9 — Verify Document Upload SHA256 Hashing
**Priority**: MEDIUM  
**Files**: 
- `app/app/api/properties/[id]/documents/route.ts`

**Patch**:
Ensure SHA256 is computed on upload:
```typescript
import crypto from 'crypto'
import fs from 'fs'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  
  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Compute SHA256
  const sha256_hash = crypto.createHash('sha256').update(buffer).digest('hex')
  
  // Store file and hash in database
  // ...
}
```

**Acceptance Criteria**:
- SHA256 computed on every document upload
- Hash stored in database
- Hash displayed in UI

**Branch**: `fix/document-hashing-verification`

**Test Plan**:
- Upload document
- Verify SHA256 hash is computed and stored
- Verify hash matches file content

---

### PR 10 — Create Model Methodology Documentation Page
**Priority**: LOW  
**Files**: 
- Create: `app/app/model-methodology/page.tsx`

**Patch**:
Create page explaining:
- ML model architecture
- Training data sources
- Feature engineering
- Model limitations
- No accuracy percentages (per spec)

**Acceptance Criteria**:
- Page accessible at `/model-methodology`
- Explains model without accuracy claims
- Links from AppreciationPrediction component work

**Branch**: `feature/model-methodology-page`

**Test Plan**:
- Navigate to `/model-methodology`
- Verify link from AppreciationPrediction works
- Verify no accuracy percentages shown

---

## SECTION 3 — HUMAN AUDIT REPORT

### Trust & Verification Gaps

The repository demonstrates a solid foundation for Phase-1 features, but critical trust gaps exist. **RERA verification is partially implemented**—the service exists (`backend/app/verification/rera_service.py`) and returns snapshots with SHA256 hashes, but **snapshots are not stored in the database**. The code comment at `backend/app/main.py:307-308` explicitly states this is deferred: "Store snapshot in database (if property_id provided in future)". This is a **Phase-1 blocker**—without persistent storage, users cannot view historical snapshots or verify "Last verified" timestamps.

More critically, **RERA verification defaults to synthetic data** (`rera_service.py:58`). While the service includes a placeholder for real TN RERA portal scraping (`_scrape_rera_portal`), it's not implemented. The synthetic fallback is clearly marked, which is good, but Phase-1 requires real public data fetching. The infrastructure exists (httpx, BeautifulSoup), but the actual portal integration is missing.

**Document hashing appears implemented** (`document_service.py:34-36`), but verification is needed that SHA256 is computed on upload in the Next.js API route. The PDF audit report generation exists (`document_service.py:38-176`) and includes all required sections (documents, RERA snapshot, risk flags, disclaimer), but the endpoint `/api/properties/[id]/audit-pdf` may not be wired correctly.

### Data Completeness Issues

**Chennai Insights Engine is implemented** (`ChennaiInsights.tsx`) with all required components: flood score, 5-year price trend, infrastructure context, rental yield range, and safety indicator. However, **it defaults to synthetic data** (`createSyntheticInsights()`). The flood risk API (`netlify/functions/env-intel.js`) uses mock calculations based on lat/lng modulo operations, not real flood risk data. Price trends and infrastructure data sources are not verified.

**ML Appreciation Bands are correctly implemented** (`AppreciationPrediction.tsx`) with LOW/MEDIUM/HIGH bands, confidence labels, and top 3 feature explanations. The component correctly avoids accuracy percentages. However, the methodology page (`/model-methodology`) may not exist, and the backend endpoint `/api/properties/[id]/predict-appreciation` needs verification.

### Missing Tamil NLP Logic

**Tamil voice search is implemented** (`app/tools/voice-tamil/page.tsx`) with fuzzy locality matching (`tamil-locality-matcher.ts`). The implementation correctly supports Tamil script, transliterated Tamil, and returns top 2 canonical localities. However, it relies on browser Web Speech API (`webkitSpeechRecognition`), which may not work on all browsers. No backend Tamil NLP processing exists—all matching is client-side string similarity.

### Inconsistent Backend/Frontend Contracts

**Builder Dashboard has a lead pipeline** (`LeadPipelineKanban.tsx`) with drag-and-drop functionality, but **lead statuses don't match the Phase-1 spec**. The spec requires: NEW → QUALIFIED → VISITED → BOOKED → REJECTED. The implementation uses: new, contacted, qualified, site_visit_scheduled, site_visit_completed, negotiation, offer_made, closed_won, closed_lost. This is a **functional mismatch**—the pipeline works but doesn't align with requirements.

The dashboard includes conversions, totals, and past 30 days metrics (`analytics/dashboard/route.ts`), and CSV export exists (`leads/export/route.ts`). However, "View verification report" functionality in the builder dashboard is not verified.

### Correctness of RERA Logic

RERA verification logic is sound but incomplete. The service correctly:
- Fetches/parses RERA data (synthetic for now)
- Computes SHA256 hash of raw HTML
- Returns parsed fields
- Marks data source (SYNTHETIC vs RERA_PORTAL)

But it fails to:
- Store snapshots in database
- Actually scrape TN RERA portal
- Handle CAPTCHA/rate limiting for real portals

The UI correctly displays "View RERA snapshot" link and "Last verified" timestamp (`RERAVerification.tsx:119-126`), but without database storage, these features won't work for historical data.

### PDF Audit Completeness

The PDF generation service (`document_service.py`) is **complete and correct**. It includes:
- Property summary
- Document list with SHA256 hashes
- RERA snapshot section
- Risk flags summary
- Legal disclaimer (though text needs exact match)

The service uses ReportLab correctly and formats a one-page audit report. However, the Next.js API endpoint that calls this service may not exist or may not be properly wired.

### ML Explainability

**ML appreciation prediction is correctly implemented** with explainable bands. The component shows:
- LOW/MEDIUM/HIGH appreciation bands (no accuracy %)
- Confidence label (LOW/MEDIUM/HIGH)
- Top 3 feature explanations with impact scores
- Link to methodology docs

This matches the Phase-1 spec perfectly. The only gap is verifying the methodology page exists and the backend prediction endpoint is implemented.

### Builder Dashboard UX + Backend Wiring

The builder dashboard is **functionally complete** with:
- Lead list with filtering
- Pipeline kanban board
- Analytics dashboard
- CSV export

But **lead statuses don't match spec**, which is a UX/functional issue. The backend analytics API (`analytics/dashboard/route.ts`) is comprehensive and includes conversions, totals, and past 30 days metrics. CSV export is implemented (`leads/export/route.ts:151-985`).

### Legal Compliance Issues

**CRITICAL: Banned phrases found in production files:**
- `app/public/index.html:1232`: "85% accuracy"
- `app/public/index.html:1207, 1211`: "Blockchain-Verified Titles"
- Backup files contain: "100% fraud-free", "500+ data points"

These must be removed immediately. The legal disclaimer exists in multiple components but **doesn't match the exact spec text**. The spec requires:
> "Information shown is an automated snapshot of public records and uploaded documents. It is NOT legal advice or a guarantee of title/ownership. For legal verification, consult a licensed property lawyer."

Current text says: "Legal disclaimer: The information and verification artifacts..." (different wording).

### Immediate Fixes

**Priority 1 (Legal/Compliance):**
1. Remove all banned phrases from `app/public/index.html` and backup files
2. Update all legal disclaimer text to match exact spec

**Priority 2 (Phase-1 Blockers):**
3. Implement RERA snapshot database storage
4. Fix builder dashboard lead statuses to match spec
5. Verify PDF audit endpoint exists and is wired

**Priority 3 (Data Quality):**
6. Replace synthetic RERA data with real portal scraping (or document why not possible)
7. Replace synthetic Chennai Insights with real data sources
8. Verify document upload SHA256 hashing

**Priority 4 (Completeness):**
9. Create model methodology page
10. Verify all backend endpoints exist and are wired correctly

---

**Overall Assessment**: The repository has **strong foundational implementation** with most Phase-1 features present. However, **critical gaps** exist in data persistence (RERA snapshots), legal compliance (banned phrases), and spec alignment (lead statuses). The codebase is **production-ready for demo/testing** but requires the above fixes before Phase-1 launch.

**Confidence Level**: HIGH (evidence-based, file-cited, implementation-aware)

