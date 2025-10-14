Tharaga Builder SaaS — Setup Guide

Stack
- Frontend: Next.js 14 (TypeScript) in `app/`
- Backend: Express + PostgreSQL in `saas-server/`
- Payments: Razorpay Subscriptions (webhooks)
- AI: OpenAI API (image/summary/intent)
- Docker: `docker-compose.yml` for db + server + app

Quick start (Docker)
1. Copy `saas-server/.env.example` to `.env` and fill Razorpay/OpenAI keys.
2. Run: `docker compose up --build -d`
3. Run DB bootstrap once: `docker compose exec saas node dist/scripts/sync.js`
4. App: http://localhost:3000  API: http://localhost:4000

Local dev (without Docker)
- Start Postgres `postgres://postgres:postgres@localhost:5432/tharaga`
- In `saas-server/`: `npm i && npm run build && node dist/scripts/sync.js && npm run start`
- In `app/`: `npm i && NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev`

Key API endpoints
- GET `/api/me/entitlements` → tier, trial/grace, feature flags
- POST `/api/properties` → gated by listing limit; returns `seo_summary`
- POST `/api/leads` → soft‑gated by monthly leads; optional `voice_transcript` for AI intent
- POST `/api/billing/subscribe` → creates Razorpay subscription; returns `short_url`
- POST `/api/billing/webhook` → updates tier/grace on payments

Feature gates & tiers
- `app/components/ui/FeatureGate.tsx` provides `<EntitlementsProvider/>` and `<FeatureGate feature="..."/>`
- `saas-server/src/pricing.ts` defines per‑tier limits and booleans.

Seeds
- `saas-server/src/scripts/sync.ts` creates schema and demo orgs for Free/Growth/Pro.

Notes
- Free trial: 14 days of Growth (set on signup via your auth flow; you can update `orgs.trial_ends_at`).
- Downgrade protection: webhook sets `grace_until` to 30 days on failure.
- Annual discount: handled by using yearly plan IDs in Razorpay.

Replace homepage section
- `index.html` now features “SaaS for Real‑Estate Builders” section and CTAs to `/app/saas`.
