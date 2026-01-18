# Build stage
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm install

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Forward env vars needed during build (Next can prerender/optimize client code)
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_URL="$SUPABASE_URL" \
    SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
    NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY"
# Ensure a .env.production file exists in the builder image
# Prefer copying from common Secret File mount locations on Render/containers; fall back to an empty file
RUN set -e; \
    for P in \
      "/etc/secrets/.env.production" \
      "/opt/render/.env.production" \
      "/run/secrets/.env.production" \
    ; do \
      if [ -f "$P" ]; then \
        echo "[env] Using secret file at $P"; \
        cp "$P" ./.env.production; \
        break; \
      fi; \
    done; \
    if [ ! -f ./.env.production ]; then \
      echo "[env] No secret .env.production found; creating empty placeholder"; \
      : > ./.env.production; \
    fi
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Carry .env.production into the runtime image (used by next start)
COPY --from=builder /app/.env.production ./.env.production
EXPOSE 3000
CMD ["npm","run","start"]
