# Tharaga Real-Estate Builder SaaS

This repo contains a minimal Dockerized SaaS stack: Next.js app, Express API, and Postgres.

## Prerequisites
- Docker Desktop or Docker Engine 24+ with Compose V2
- Free ports: 3000 (web), 4000 (API), 5432 (Postgres)
- Razorpay account (Subscriptions enabled)
- OpenAI API key (optional for AI features in future)

## One-time setup
1. Copy env file and fill values:
   - `cp saas-server/.env.example saas-server/.env` (Windows: `copy saas-server\.env.example saas-server\.env`)
   - Fill required keys inside `saas-server/.env`
2. Bring up the stack and seed DB:
   ```bash
   docker compose up --build -d
   docker compose exec saas node dist/scripts/sync.js
   ```
3. Open:
   - App: http://localhost:3000
   - API: http://localhost:4000

## Troubleshooting
- If you see "no configuration file provided", ensure you are in the repo root where `docker-compose.yml` exists.
- If ports are busy, stop conflicting processes or change the host ports in `docker-compose.yml`.
