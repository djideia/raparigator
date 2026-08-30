# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
WORKDIR /repo
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
RUN npm ci --workspace apps/api --include-workspace-root --ignore-scripts

FROM deps AS build
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm run build -w apps/api

FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
RUN npm ci --workspace apps/api --include-workspace-root --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0
RUN addgroup -S sigillus && adduser -S sigillus -G sigillus
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/dist ./dist
COPY --from=build /repo/apps/api/drizzle ./drizzle
COPY apps/api/package.json ./package.json
USER sigillus
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1
CMD ["node", "dist/server.js"]
