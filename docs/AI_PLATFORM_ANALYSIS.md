# Tharaga Real Estate AI Platform - Comprehensive Analysis

## Executive Summary

Tharaga is a full-stack AI-powered real estate SaaS platform built for the Indian market (focused on Tamil Nadu/Chennai). It serves three user roles: **Builders/Agents**, **Buyers/Consumers**, and **Admins**. The platform combines property listing management, AI-driven lead scoring, behavioral automation, CRM integration, and multi-channel marketing into a single unified dashboard.

**Tech Stack:** Next.js 14 | React 18 | TypeScript | Supabase (PostgreSQL) | Tailwind CSS | Framer Motion | Netlify

---

## 1. Architecture Overview

### Frontend
- **Framework:** Next.js 14.2.33 (App Router)
- **Language:** TypeScript 5.5.4
- **UI:** Tailwind CSS 3.4.10 + Framer Motion 12.x
- **State:** React Query v5 (server state) + Context API (local state)
- **Design System:** Custom glassmorphism system with Amber/Slate color palette
- **Fonts:** Playfair Display (headings), Plus Jakarta Sans & Manrope (body)

### Backend
- **API:** Next.js API Routes (274+ endpoints)
- **Database:** Supabase (PostgreSQL with RLS)
- **Auth:** Supabase Auth (JWT + session-based)
- **Serverless:** Netlify Functions (edge + serverless)
- **Deployment:** Netlify with Next.js plugin

### AI Models
| Provider | Model | Use Case | Tier |
|----------|-------|----------|------|
| Groq | Llama 3.3 70B | Simple tasks (scoring, classification) | Free |
| Google | Gemini 2.0 Flash | Content generation | Free |
| Anthropic | Claude Sonnet 4 | Complex analysis | Paid |
| OpenAI | GPT-4o-mini | Chat, search, market analysis | Paid |
| OpenAI | GPT-4 / GPT-3.5 | Content generation | Paid |

### Integrations
- **CRM:** Zoho CRM (2-way sync with field mapping)
- **Payments:** Razorpay + Stripe
- **Communications:** Twilio (SMS/WhatsApp), Resend (Email)
- **Calendar:** Google Calendar (OAuth)
- **Compliance:** RERA verification system

---

## 2. AI Features Analysis

### 2.1 Multi-Model AI Router (`app/lib/ai/router.ts`)
**Purpose:** Cost-optimized routing of AI tasks to the cheapest capable model.

**Routing Logic:**
- Simple tasks (scoring, classification) -> Groq Llama 3.3 70B (free)
- Medium tasks (content, descriptions) -> Google Gemini 2.0 Flash (free)
- Complex tasks (market analysis) -> Claude Sonnet 4 (paid)

**Features:**
- Fallback chains (tries multiple providers)
- Response caching in Supabase (`ai_cache` table) with TTL
- Token usage tracking for cost monitoring
- 8 task types supported: lead_scoring, intent_classification, content_generation, property_description, market_analysis, chat_response, translation, summarization

### 2.2 Lead Generation with Claude (`app/lib/services/leadGeneration.ts`)
**Model:** Claude 3.5 Sonnet

**Capabilities:**
- Generates realistic Indian buyer profiles
- Quality scoring (0-100)
- Budget estimation with 30% variance
- Interest level classification (high/medium/low)
- Timeline prediction (immediate, 3 months, 6 months, 1 year)
- Preferred location and property type inference
- Fallback to synthetic data if Claude API fails

### 2.3 Lead Enrichment & Analysis (`app/lib/services/openai-lead-service.ts`)
**Model:** GPT-4o-mini

**Methods:**
1. `enrichLead()` - Company/job inference, income estimation, buying power scoring
2. `analyzeLeadIntent()` - Sentiment analysis, intent classification, urgency assessment
3. `generateWorkflowRecommendation()` - Smart workflow action suggestions with priority
4. `generatePersonalizedMessage()` - AI-generated personalized outreach messages

### 2.4 AI Insights & Predictive Scoring (`app/lib/services/ai-insights.ts`)
**Method:** Heuristic-based ML (no external API calls)

**Scoring Model (4 factors):**
- Engagement Score (25%)
- Intent Score (30%)
- Fit Score (25%)
- Urgency Score (20%)

**Output:** Conversion probability, next best action, optimal contact time, close date prediction

### 2.5 Enhanced Search with AI (`app/lib/ai/enhanced-search.ts`)
**Model:** GPT-4o-mini via `/api/ai/enhanced-search`

**Capabilities:**
- Natural language query understanding
- Intent classification (property_search, location_query, price_inquiry, amenity_search, investment_analysis, comparison)
- Entity extraction with confidence scoring
- Budget range parsing ("under 50L", "between 30L to 60L")
- BHK/property type detection
- Tamil-English mixed query support
- Fallback to regex-based pattern matching

### 2.6 AI Chat Assistant (`app/app/api/ai/chat/route.ts`)
**Model:** GPT-4o-mini

**Features:**
- Context-aware responses (knows current dashboard page)
- 6-message conversation history
- Fallback knowledge base with categories: leads, property, revenue, analytics, messaging, settings
- Graceful degradation when API unavailable
- Builder-only access (authentication required)

### 2.7 Market Analysis (`app/app/api/ai/market-analysis/route.ts`)
**Model:** GPT-4o-mini

**Output:** Price/sqft calculations, 5yr/10yr forecasts, demand assessment, growth rate, investment scoring (0-100), development tracking

### 2.8 AI Recommendations (`app/app/api/ai/recommendations/route.ts`)
**Model:** GPT-4o-mini

**Process:** Analyzes last 20 user searches, extracts preference patterns, generates match scores (0-100), provides match reasons per property

### 2.9 AI Content Generator (`app/components/ai/AIContentGenerator.tsx`)
**Models:** GPT-4 / GPT-3.5 Turbo (configurable)

**Content Types:** Property descriptions, key highlights, email subject lines, WhatsApp messages, social media posts, FAQ generation

**Options:** 4 tones (professional, casual, luxury, friendly), 3 languages (English, Hindi, Tamil), 1-3 variants per generation

### 2.10 Virtual Staging (`app/app/api/ai/virtual-staging/route.ts`)
**Backend:** External FastAPI service

**Styles:** Modern, luxury, minimalist, traditional, Scandinavian
**Room Types:** Living room, bedroom, kitchen, bathroom, dining room
**Features:** Job queuing, real-time progress tracking via Supabase subscriptions

### 2.11 Advanced AI Tools (`app/lib/services/advanced-ai-tools-service.ts`)
**Models:** OpenAI GPT-4o + Claude Sonnet 4

**6 Premium Tools:**
1. Advanced ROI Calculator (market forecasts, tax optimization, investment scoring)
2. Advanced EMI Analysis (risk assessment, prepayment optimization, bank recommendations)
3. Advanced Budget Analysis (financial health, savings optimization, property matching)
4. Advanced Loan Eligibility (CIBIL assessment, credit risk modeling, approval probability)
5. Advanced Neighborhood Analysis (livability scoring, growth prediction, geospatial analysis)
6. Advanced Property Valuation (AVM ensemble, AI-based valuation, market comparison)

---

## 3. Database Schema (50+ Tables)

### Core Tables
| Category | Tables | Purpose |
|----------|--------|---------|
| **Auth & Identity** | `profiles`, `user_roles` | User management, RBAC |
| **Properties** | `properties`, `localities`, `price_index`, `metro_stations` | Listings & market data |
| **Leads** | `leads`, `lead_scores`, `lead_interactions`, `lead_pipeline` | CRM & pipeline |
| **Automation** | `workflow_templates`, `workflow_executions`, `automation_queue` | Workflow engine |
| **Messaging** | `message_templates`, `message_campaigns`, `newsletter_subscribers` | Multi-channel comms |
| **Analytics** | `platform_metrics`, `revenue_metrics`, `user_events`, `property_analytics` | Business intelligence |
| **Billing** | `org_subscriptions`, `payments` | Subscriptions & payments |
| **Integration** | `crm_field_mappings`, `crm_record_mappings`, `crm_sync_log` | Zoho CRM sync |
| **AI** | `ai_cache`, `ai_generated_content`, `content_templates` | AI response caching |
| **Security** | `audit_logs`, `auth_rate_limits`, `webhook_logs` | Security & compliance |
| **Behavioral** | `user_behavior`, `behavioral_profiles`, `user_preferences` | Behavior tracking |

### Lead Pipeline Stages
```
new -> contacted -> qualified -> site_visit_scheduled -> site_visit_completed -> negotiation -> offer_made -> closed_won / closed_lost
```

### Lead Scoring Components
- Budget alignment score
- Engagement score
- Property fit score
- Contact intent score
- Recency score
- Time investment score
- Categories: Hot / Warm / Developing / Cold / Low Quality

---

## 4. API Endpoints (274+ Routes)

### By Category
| Category | Count | Key Endpoints |
|----------|-------|---------------|
| **Admin** | 15 | builders, metrics, audit-logs, security |
| **Builder** | 20+ | leads, properties, revenue, stats, webhooks |
| **Leads** | 30+ | CRUD, pipeline, scoring, enrichment, export |
| **AI** | 10 | chat, search, recommendations, staging, market analysis |
| **Automation** | 25+ | workflows, email sequences, behavioral tracking |
| **Marketing** | 15+ | content generation, social media, SEO, WhatsApp |
| **Messaging** | 10 | SMS, WhatsApp, email, templates, campaigns |
| **CRM** | 10 | Zoho connect/sync, field mappings, dashboard |
| **Analytics** | 15+ | dashboard, funnel, geographic, export |
| **Billing** | 15 | plans, subscribe, cancel, invoices, quotas |
| **Properties** | 25+ | upload, optimize, documents, risk flags |
| **Tools** | 8 | ROI, EMI, budget, loan, valuation, neighborhood |
| **Webhooks** | 15 | Razorpay, Stripe, Twilio, Zoho, custom |
| **Calendar** | 10 | Google Calendar, site visits, availability |
| **Search** | 8 | advanced, suggestions, map, voice |

---

## 5. Page/Route Map

### Public Routes
- `/` - Homepage with hero, features, pricing sections
- `/about` - About page
- `/pricing` - Subscription pricing
- `/properties/[id]` - Property detail pages
- `/property-listing` - Property browsing
- `/tools/*` - 12 calculator tools (ROI, EMI, budget, loan, etc.)
- `/chennai/[locality]` - Chennai locality market pages
- `/tours/*` - Virtual tours, AR staging

### Protected Routes
- `/(dashboard)/builder/*` - Builder dashboard (20+ sub-pages)
- `/(dashboard)/buyer/*` - Buyer dashboard
- `/(dashboard)/admin/*` - Admin panel (analytics, leads, properties, security, settings)

### Builder Dashboard Sections
- Overview (AI insights, KPIs, anomaly alerts)
- Leads (table, Kanban pipeline, scoring, enrichment)
- Properties (management, optimization, distribution)
- Revenue (tracking, forecasting, payments)
- Analytics (funnels, geographic, user growth)
- CRM (Zoho integration dashboard)
- Messaging (email, WhatsApp, SMS automation)
- Billing (subscription, invoices, quota tracking)
- AI Content (generation, virtual staging)
- Automation (visual workflow builder)

---

## 6. Authentication & Security

### Auth Flow
1. User logs in via Supabase Auth (email/password)
2. Session stored in browser localStorage
3. Middleware validates JWT on protected routes
4. API routes verify Bearer tokens
5. Row-Level Security enforced at database level

### Role Matrix
| Feature | Admin | Builder | Buyer | Public |
|---------|-------|---------|-------|--------|
| Property CRUD | All | Own only | View | View |
| Lead management | All | Own only | Own saved | - |
| Analytics | Platform | Own | Basic | - |
| Automation | - | Own | - | - |
| CRM integration | - | Own | - | - |
| Billing | View all | Own | - | View pricing |
| AI tools | All | Premium | Basic | Calculator tools |

### Security Features
- Row-Level Security (RLS) on all tables
- JWT token validation + refresh
- Rate limiting (`auth_rate_limits` table)
- Audit logging (`audit_logs` table)
- CSP headers configured
- CORS policy enforcement
- Admin restricted to owner email

---

## 7. Subscription Model

### Tharaga PRO (Single Tier)
| Plan | Price | Savings |
|------|-------|---------|
| Monthly | Rs.4,999/month | - |
| Yearly | Rs.4,166/month (Rs.49,992/year) | Rs.9,996/year (17%) |
| Trial | 14 days free | No credit card |

### All Features Included
- Unlimited properties, leads, team members, storage
- Full CRM pipeline + Zoho integration
- AI lead scoring + market analysis
- Email, WhatsApp, SMS automation
- Advanced analytics dashboard
- RERA verification
- Virtual tours
- API access + webhooks
- White-label + custom domain
- Priority support (2-hour response)

---

## 8. Performance Optimizations

### Implemented
- **Request deduplication** - Prevents duplicate concurrent API calls
- **useRef tracking** - Tracks in-flight requests to prevent double-fetching
- **AI response caching** - Supabase `ai_cache` table with TTL (reduces costs 60-70%)
- **Multi-model routing** - Free models for simple tasks, paid for complex
- **React Query** - Server state caching and background refresh
- **Effect consolidation** - Reduced cascading re-renders
- **Polling optimization** - Separated initial fetch from refresh/polling logic

### Architecture Patterns
- Lazy AI client initialization (avoids build-time errors)
- Graceful degradation (all AI features have fallbacks)
- Modular dashboard with URL-driven section routing
- Supabase real-time subscriptions for live updates

---

## 9. Environment Variables Required

### Critical
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (backend) |

### AI Services
| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Claude API |
| `OPENAI_API_KEY` | OpenAI GPT models |
| `GROQ_API_KEY` | Groq Llama (free tier) |
| `GOOGLE_AI_API_KEY` | Google Gemini (free tier) |

### Integrations
| Variable | Purpose |
|----------|---------|
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payment processing |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` | SMS/WhatsApp |
| `RESEND_API_KEY` | Email delivery |
| `ADMIN_TOKEN` | Admin API access |

---

## 10. Key Strengths

1. **Multi-model AI strategy** - Free tiers first, paid as fallback (cost-optimized)
2. **Comprehensive automation** - Visual workflow builder with behavioral triggers
3. **Real Indian market focus** - RERA compliance, Tamil language, Chennai localities, INR pricing
4. **Graceful degradation** - Every AI feature has a fallback (never fully fails)
5. **Unified dashboard** - Single-page architecture with URL-driven sections
6. **Full-stack CRM** - Lead pipeline, scoring, enrichment, CRM sync all built-in
7. **Multi-channel marketing** - Email, SMS, WhatsApp, social media from one platform
8. **Smart calculators** - ROI, EMI, budget, loan, valuation, neighborhood tools
9. **Behavioral psychology** - Buyer classification, readiness scoring, optimal contact timing
10. **Enterprise security** - RLS, audit logs, rate limiting, role-based access

---

## 11. Areas for Improvement

1. **Testing coverage** - E2E tests configured but limited coverage
2. **Error monitoring** - No Sentry/error tracking service integrated
3. **CDN/Image optimization** - Could benefit from Cloudinary or similar
4. **API versioning** - No versioning strategy for API routes
5. **Documentation** - Many markdown docs but no centralized developer docs
6. **Mobile app** - Web-only, no native mobile app
7. **Offline support** - Service worker registered but minimal offline capability
8. **Search indexing** - No Elasticsearch/Algolia for faster property search
9. **A/B testing infrastructure** - Content variations exist but no formal A/B framework
10. **Load testing** - No documented load testing results

---

*Analysis generated: February 2026*
*Platform version: 0.1.0*
*Total API endpoints: 274+*
*Total database tables: 50+*
*AI models integrated: 5 (Claude, GPT-4, GPT-4o-mini, Llama 3.3, Gemini 2.0)*
