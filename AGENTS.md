# AI Development Rules

Before making any code changes:

## 1. Detect the shape of the project

Check `package.json` (root, and each `apps/*` in a monorepo) and the repo root:

- `turbo.json` present, or an `apps/` + `packages/` layout → Turborepo monorepo → read `monorepo.md` first, then treat each `apps/*` entry as its own project and apply the rules below to it individually.
- `next` in dependencies, no separate standalone backend → Next.js fullstack monolith → also read `nextjs.md`, `nextjs-server-actions.md`, `database.md`.
- `next` in dependencies inside a monorepo `apps/web`, with a separate `apps/api` → Next.js is the frontend only here → also read `nextjs.md` and `api-and-data-fetching.md` (it talks to `apps/api`, not its own database — do not read `nextjs-server-actions.md`/`database.md` for this app).
- `vite` + `react`, no `next` → Vite + React SPA → also read `vite-react.md` and `api-and-data-fetching.md`.
- `hono`, no `react`/`next` → standalone backend package/app → read `monorepo.md` and `database.md`. Frontend skills do not apply.

## 2. Always read these skills, regardless of project shape

- `skills/folder-structure.md` — feature-based architecture, where files go
- `skills/naming-conventions.md` — file, folder, symbol naming
- `skills/imports-and-exports.md` — export style, barrel files, import order
- `skills/typescript.md` — type conventions
- `skills/tooling.md` — linting, formatting, commit conventions

## 3. Read these when the task touches their area

- `skills/react.md` — any component work (Next.js or Vite)
- `skills/tailwindcss.md` — any styling
- `skills/forms.md` — any form, input validation
- `skills/state-management.md` — any shared/global client state or URL query-param state
- `skills/testing.md` — writing or modifying tests
- `skills/api-and-data-fetching.md` — client-side networking against a standalone backend (Vite SPA, or a Next.js app calling a separate API)
- `skills/nextjs-server-actions.md` — data fetching/mutation inside a Next.js monolith that owns its own database
- `skills/database.md` — any schema, query, or migration work
- `skills/monorepo.md` — adding an app or package, or deciding whether something belongs in `apps/` vs `packages/`

## 4. Priority and behavior rules

- Follow project conventions found in existing code over these defaults when the two conflict — these skills define the default for new code, not a mandate to rewrite working code that predates them. If existing code violates a skill, do not silently "fix" it as a side effect of an unrelated task; flag it instead.
- Do not invent architecture not covered by a skill — ask, or pick the closest existing pattern in the codebase.
- Reuse existing components and modules before creating new ones.
- Keep consistency across the codebase.
- Default stack, absent project signals to the contrary: Next.js monolith + Postgres/Drizzle + Actium + Tailwind/shadcn + React Hook Form/Zod + Zustand + nuqs + Biome/Husky/commitlint. Reach for Turborepo/Hono only per the decision rule in `monorepo.md`.
