# Frontend — Next.js app
# Usage: docker build -t paladinscat-frontend --build-arg MODE=dev .
#   MODE=prod (default): build + optimized runtime
#   MODE=dev: dev server with hot reload

ARG MODE=prod

# Build stage (shared)
FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_SERVER_API_URL=http://localhost:3304
ARG NEXT_BUILD_CPUS=2
ARG NEXT_PUBLIC_LOCALE_BASE_URL=/locales
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_SERVER_API_URL=${NEXT_SERVER_API_URL}
ENV NEXT_BUILD_CPUS=${NEXT_BUILD_CPUS}
ENV NEXT_PUBLIC_LOCALE_BASE_URL=${NEXT_PUBLIC_LOCALE_BASE_URL}
COPY src/frontend/package.json src/frontend/package-lock.json src/frontend/tsconfig.json ./
RUN npm ci
COPY community-locales /community-locales
ENV PALADINSCAT_LOCALES_REPO=/community-locales
COPY src/frontend/ .
RUN npm run build

# Dev stage
FROM node:22-alpine AS dev
WORKDIR /app
COPY src/frontend/package.json ./
RUN npm install
COPY community-locales /community-locales
ENV PALADINSCAT_LOCALES_REPO=/community-locales
COPY src/frontend/ ./
CMD ["sh", "-c", "npm install && npm run dev -- -H 0.0.0.0"]

# Prod runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN chown node:node /app
USER node
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev
COPY --chown=node:node --from=builder /app/.next ./.next
COPY --chown=node:node --from=builder /app/public ./public
EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]

# Select final stage based on MODE
FROM dev AS dev-final
FROM runtime AS prod-final
FROM ${MODE}-final
