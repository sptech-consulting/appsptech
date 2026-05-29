FROM node:20-alpine AS base
RUN corepack enable pnpm
WORKDIR /app
COPY package.json ./

# ── dev stage ────────────────────────────────────────────────────────────────
FROM base AS dev
RUN pnpm install
COPY . .
EXPOSE 3001
CMD ["pnpm", "dev"]

# ── builder stage ─────────────────────────────────────────────────────────────
FROM base AS builder
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ── production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS production
RUN corepack enable pnpm
WORKDIR /app
COPY package.json ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
EXPOSE 3001
USER node
CMD ["node", "dist/server.js"]
