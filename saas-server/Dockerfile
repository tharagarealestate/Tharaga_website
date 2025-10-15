# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4000

# Copy package artifacts and install production deps
COPY --from=build /app/package.json ./
# Replace `npm ci` with `npm install`
RUN npm install --omit=dev

# Copy built code
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/server.js"]
