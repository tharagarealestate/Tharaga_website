FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4000

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY dist ./dist

EXPOSE 4000
# Run DB sync once on container start, then launch server
CMD ["sh", "-lc", "node dist/scripts/sync.js && node dist/server.js"]
