# Frontend — Next.js app
# Usage: docker build -t paladinscat-frontend --build-arg MODE=dev .
#   MODE=prod (default): build + optimized runtime
#   MODE=dev: dev server with hot reload

ARG MODE=prod

# Build stage (shared)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci
COPY . .
RUN npm run build

# Dev stage
FROM node:22-alpine AS dev
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . ./
CMD ["sh", "-c", "npm install && npx next dev -H 0.0.0.0"]

# Prod runtime
FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev
USER node
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]

# Select final stage based on MODE
FROM dev AS dev-final
FROM runtime AS prod-final
FROM ${MODE}-final
