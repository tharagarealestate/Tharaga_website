# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci
COPY . .
RUN npm run build

# Run stage
FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["npm", "start"]
