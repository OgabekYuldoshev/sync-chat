# syntax=docker/dockerfile:1

# PeerChat runs a custom Node HTTP server (server/server.ts) that mounts
# Next.js via the next() API and attaches a raw WebSocket signaling server
# to the same http.Server for the "upgrade" event. Next's `output: "standalone"`
# generates a replacement for `next start` that this app never uses, so this
# image ships a production-only node_modules install instead of relying on
# standalone tracing.

ARG BUN_VERSION=1

# ---- deps: full install (incl. devDependencies) for the build step ----
FROM oven/bun:${BUN_VERSION} AS deps
WORKDIR /app
ENV HUSKY=0
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- builder: compile the Next.js production build ----
FROM oven/bun:${BUN_VERSION} AS builder
WORKDIR /app
ENV HUSKY=0
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# ---- runner: production-only node_modules + build output ----
FROM oven/bun:${BUN_VERSION}-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HUSKY=0

RUN groupadd --system --gid 1001 nodejs \
	&& useradd --system --uid 1001 --gid nodejs peerchat

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server ./server
COPY --from=builder /app/src ./src

RUN chown -R peerchat:nodejs /app
USER peerchat

EXPOSE 6677
ENV PORT=6677

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
	CMD bun -e "fetch('http://localhost:' + (process.env.PORT ?? 6677) + '/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "run", "server/server.ts"]
