# PeerChat

Nearby, end-to-end encrypted peer-to-peer chat. Discover people around you by
distance (never exact location), connect via QR code or proximity, and chat
directly over WebRTC — messages and files never touch a database.

## How it works

- **Discovery** — Clients report their geolocation to a lightweight WebSocket
  signaling server. The server computes the haversine distance between peers
  and broadcasts *distance only*; raw coordinates are never shared between
  clients.
- **Pairing** — Peers connect either by scanning a QR code (`qr-connect`
  feature) or by picking someone from the nearby list.
- **Transport** — Once paired, clients exchange WebRTC signaling data through
  the server, then talk directly to each other over a P2P data channel for
  chat and file transfers.
- **Encryption** — Each client generates a keypair; messages are encrypted
  end-to-end with a per-session key (`shared/lib/crypto`) before ever leaving
  the device.
- **Offline relay** — If a target peer is offline, `relay-message` payloads
  are queued in Redis and delivered/drained the next time that peer connects.
  The server only ever sees encrypted envelopes.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- Custom Bun HTTP server (`server/server.ts`) mounting Next.js and attaching a
  raw `ws` WebSocket signaling server on the same HTTP server
- Redis (via `ioredis`) for the offline relay queue
- WebRTC for peer-to-peer data channels
- Tailwind CSS + shadcn/ui components
- Zustand for client state, React Hook Form + Zod for forms
- Biome for lint/format, Husky + commitlint for commit hygiene

## Project structure

```
server/            Custom HTTP server, WS signaling server, Redis relay store
src/app/            Next.js App Router routes
src/features/       Feature modules: chat, nearby, qr-connect, profile, settings
src/shared/         Shared lib (crypto, webrtc, ws, geolocation), UI, hooks, store
```

Each feature under `src/features/*` owns its own `components/`, `hooks/`,
`store/`, `types/`, etc. — see `AGENTS.md` / `skills/` for the full
conventions this codebase follows.

## Getting started

Requires [Bun](https://bun.sh) and a running Redis instance.

```bash
cp .env.example .env
# edit .env if your Redis instance isn't at redis://127.0.0.1:6379

bun install
bun run dev
```

The app (Next.js + signaling server on the same port) is served at
[http://localhost:6677](http://localhost:6677) in production and via the
default Next.js dev port locally, per `PORT` in `server/server.ts`.

### Scripts

| Script            | Description                              |
| ----------------- | ----------------------------------------- |
| `bun run dev`      | Start the custom dev server                |
| `bun run build`    | Build the Next.js production bundle        |
| `bun run start`    | Run the production server (`NODE_ENV=production`) |
| `bun run lint`     | Lint with Biome                            |
| `bun run format`   | Format with Biome                          |

## Deployment

A `Dockerfile` and `docker-compose.yml` are provided, targeting
[Coolify](https://coolify.io) with Traefik routing. The compose file runs the
app and a Redis instance; set `APP_DOMAIN` for the Traefik host rule. See the
comments in `docker-compose.yml` for HTTPS/TLS caveats specific to Coolify's
raw compose deployment mode.

```bash
docker compose up -d --build
```

The container exposes port `6677` and includes a healthcheck against
`/api/health`.
