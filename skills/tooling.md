# Tooling (Linting, Formatting, Git Hooks)

## Purpose

This document defines the required linting, formatting, and commit conventions for all frontend and backend projects in this stack.

---

# Core Principles

Always:

- Use Biome for linting and formatting.
- Enforce checks via git hooks, not just CI.
- Enforce commit message format via commitlint.
- Never let inconsistent formatting land in the repository.

---

# Linting & Formatting — Biome

Always use Biome. Do not add ESLint or Prettier alongside it — Biome replaces both.

In a monorepo, this is the base config in `packages/config/biome.json`; apps extend it.

```json
{
    "extends": ["@repo/config/biome.json"]
}
```

In a single Next.js monolith, this is the root `biome.json` directly.

## Canonical Config

```json
{
    "$schema": "https://biomejs.dev/schemas/2.3.10/schema.json",
    "assist": {
        "actions": {
            "source": {
                "organizeImports": {
                    "level": "on",
                    "options": {
                        "groups": [
                            "**",
                            [":NODE:", ":BUN:"],
                            "@*",
                            ":PACKAGE:",
                            ":BLANK_LINE:",
                            "@/**",
                            ":BLANK_LINE:",
                            ":PATH:"
                        ]
                    }
                }
            }
        },
        "enabled": true
    },
    "vcs": {
        "enabled": false,
        "clientKind": "git",
        "useIgnoreFile": false
    },
    "css": {
        "parser": {
            "tailwindDirectives": true
        }
    },
    "files": {
        "ignoreUnknown": false
    },
    "formatter": {
        "enabled": true,
        "indentStyle": "tab"
    },
    "linter": {
        "domains": {
            "next": "recommended",
            "react": "recommended"
        },
        "enabled": true,
        "rules": {
            "complexity": {
                "noForEach": "error"
            },
            "performance": {
                "noReExportAll": "error"
            },
            "recommended": true,
            "style": {
                "noEnum": "error",
                "noExportedImports": "error",
                "noNamespace": "error",
                "noNestedTernary": "error",
                "useDefaultSwitchClause": "error",
                "useFilenamingConvention": {
                    "level": "error",
                    "options": {
                        "filenameCases": ["kebab-case"]
                    }
                },
                "useNumericSeparators": "error",
                "useReactFunctionComponents": "error"
            },
            "suspicious": {
                "noAlert": "error",
                "noVar": "error",
                "useAwait": "error"
            },
            "correctness": {
                "noUnusedImports": "error"
            }
        }
    },
    "javascript": {
        "formatter": {
            "quoteStyle": "double"
        }
    }
}
```

Treat this as a baseline, not fixed — trim or add rules per project as needed, as long as the change is deliberate, not a way to silence a real finding.

### What each non-obvious rule enforces

Several rules mechanically enforce conventions already documented elsewhere — Biome now catches them at commit time instead of relying on review:

- `style.noEnum` → `typescript.md` ("Never use enums")
- `performance.noReExportAll` → `imports-and-exports.md` ("Never use wildcard exports")
- `correctness.noUnusedImports` → `imports-and-exports.md` ("Never import the same module multiple times" / unused imports forbidden)
- `style.noNestedTernary` → `react.md` ("Avoid deeply nested ternaries")
- `style.useFilenamingConvention` (kebab-case) → `naming-conventions.md` (file naming)
- `style.useReactFunctionComponents` → `react.md` ("Never generate class components")

Rules that introduce conventions not otherwise documented:

- `complexity.noForEach` — use `for...of`, `.map()`, `.filter()`, or `.reduce()` instead of `.forEach()`. `.forEach()` can't `break`, doesn't compose with `await` correctly, and its return value is always discarded.
- `style.noExportedImports` — don't `import { x } from "y"` and then separately `export { x }`. Write `export { x } from "y"` directly in one statement.
- `style.noNamespace` — no TypeScript `namespace` declarations. Use modules.
- `style.useDefaultSwitchClause` — every `switch` must have a `default` case, even if it just throws or is a no-op, so exhaustiveness is explicit.
- `style.useNumericSeparators` — large numeric literals need separators: `1_000_000`, not `1000000`.
- `suspicious.noAlert` — no `alert()` / `confirm()` / `prompt()`.
- `suspicious.noVar` — no `var`, use `const`/`let`.
- `suspicious.useAwait` — an `async` function must contain at least one `await`; drop `async` if it doesn't.
- `linter.domains.next` / `linter.domains.react` — enables Next.js- and React-specific rule sets (hooks rules, etc.) automatically; do not hand-roll a substitute for these.

### Formatting notes

- `formatter.indentStyle: "tab"` — actual project files use tabs. Skill docs in this repo show spaces in code blocks purely for Markdown readability; that is not a style exception, real source files are tab-indented and `biome check --write` will convert them.
- `javascript.formatter.quoteStyle: "double"` — matches the double-quote style already used throughout every example in these skill docs.
- `css.parser.tailwindDirectives: true` — required so Tailwind's `@apply`/`@theme` and similar at-rules parse without errors in CSS files.
- `vcs.enabled: false` — Biome does not read `.gitignore`. Add build output/dependency directories to `files.ignore` in `biome.json` directly if they need excluding.

### Import Organization

`assist.actions.source.organizeImports` auto-sorts every import according to the `groups` order above whenever `biome check --write` runs. Do not hand-order imports to a different scheme — let Biome own import order. This supersedes the manual "React, then third-party, then alias, then relative" description in `imports-and-exports.md`; the enforced order is whatever this config's `groups` produce, not a hand-maintained convention.

## Commands

```text
biome check --write .
```

Run this before committing and in CI. Do not hand-fix formatting or import order that Biome can fix automatically.

---

# Editor Integration

Configure format-on-save with the Biome editor extension.

Never commit code that would be reformatted by `biome check --write .`.

---

# Git Hooks — Husky

Always use Husky for git hooks.

```text
.husky/
├── pre-commit
└── commit-msg
```

## pre-commit

Run Biome against staged files before allowing a commit.

```sh
bunx biome check --write --no-errors-on-unmatched $(git diff --cached --name-only --diff-filter=ACM)
```

## commit-msg

Run commitlint against the commit message.

```sh
bunx commitlint --edit "$1"
```

Never bypass hooks with `--no-verify` as a routine practice — only for genuine emergencies, and never for style/lint failures.

---

# Commit Messages — Commitlint

Always enforce Conventional Commits via commitlint.

```text
<type>(<scope>): <subject>
```

## Allowed Types

```text
feat
fix
refactor
perf
docs
style
test
chore
build
ci
revert
```

## Good

```text
feat(auth): add password reset flow
fix(cart): correct total calculation on discount
refactor(users): extract user mapper into shared module
```

## Bad

```text
update stuff
fix bug
WIP
```

Configuration lives in `commitlint.config.js`, extending `@commitlint/config-conventional`.

---

# CI Enforcement

CI must run the same checks as the git hooks: `biome check .` and, where present, `commitlint` on the PR's commit range. A failing hook locally must also fail CI — hooks are a fast local gate, not a substitute for CI.

---

# AI Rules

When generating tooling config or commits:

- Use Biome, never ESLint/Prettier.
- Wire Biome into a Husky `pre-commit` hook against staged files.
- Wire commitlint into a Husky `commit-msg` hook.
- Write commit messages in Conventional Commits format.
- Keep shared config in `packages/config` in a monorepo, extended per app.

---

# Forbidden

Never generate:

- ESLint or Prettier config alongside Biome
- A commit hook that can be silently skipped by default
- Commit messages outside the Conventional Commits format
- Duplicated Biome config across apps in a monorepo instead of extending `packages/config`

---

# Goal

Every commit should be:

- Formatted and linted automatically before it lands
- Structured as a Conventional Commit
- Consistent across every app in the repo
