# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-24
**Commit:** b18b87756
**Branch:** agent-board

## OVERVIEW

AI-powered development tool. Monorepo with Bun, TypeScript, Effect, SolidJS, Astro, and Electron.

## STRUCTURE

```
packages/
  app/          SolidJS web app (agent board UI)
  console/      Console application
  core/         Core runtime, auth, models, plugins
  desktop/      Electron desktop app
  docs/         Documentation
  enterprise/   Enterprise features
  extensions/   VS Code extension
  function/     Cloudflare Workers functions
  http-recorder/ HTTP test recorder
  identity/     Identity/auth service
  llm/          Effect Schema-first LLM core
  opencode/     Main CLI + server + TUI
  plugin/       Plugin system
  sdk/js/       JavaScript SDK
  slack/        Slack integration
  storybook/    UI storybook
  ui/           SolidJS component library
  web/          Astro docs site
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| LLM provider routing | `packages/llm/src/route/` | Protocol + endpoint + auth + framing |
| Server HTTP API | `packages/opencode/src/server/routes/instance/httpapi/` | Effect HttpApi patterns |
| UI components | `packages/ui/src/components/` | SolidJS components |
| Desktop app | `packages/desktop/` | Electron + renderer/preload/main |
| Database schema | `packages/opencode/src/**/*.sql.ts` | Drizzle sqlite |
| Test fixtures | `packages/opencode/test/fixture/` | tmpdir, testEffect helpers |
| SDK generation | `packages/sdk/js/script/build.ts` | Regenerate JS SDK |

## CONVENTIONS

- **Default branch:** `dev` (not `main`)
- **Module shape:** Flat top-level exports + `export * as Foo from "."` self-reexport at bottom. No `export namespace`.
- **Multi-sibling dirs:** No barrel `index.ts`. Import specific siblings.
- **Config modules:** `export * as ConfigX from "./x"` at top of file in `src/config`.
- **Database:** snake_case columns, `<entity>_id` joins, `<table>_<column>_idx` indexes.
- **Drizzle:** `bun run db generate --name <slug>` from `packages/opencode`.

## ANTI-PATTERNS

- Do NOT use GitHub Actions (user explicitly hates it)
- Do NOT run tests from repo root (guard: `do-not-run-tests-from-root`)
- Do NOT use `export namespace Foo { ... }`
- Do NOT extract single-use helpers preemptively
- Do NOT use `try`/`catch` where possible
- Do NOT use `any` type
- Do NOT use `let` when `const` + ternary works
- Do NOT use `else` — prefer early returns
- Do NOT unnecessary destructure — use dot notation
- Do NOT mock in tests — test actual implementation
- Do NOT run `tsc` directly — use `bun typecheck` from package dirs
- Do NOT restart the app/server during debugging (`packages/app`)
- Do NOT use `Effect.fork` or `Effect.forkDaemon` (v4 beta) — use `Effect.forkIn(scope)`

## STYLE

- Use Bun APIs (`Bun.file()`) when possible
- Rely on type inference; avoid explicit annotations unless for exports
- Prefer functional array methods (flatMap, filter, map) over for loops
- In `Effect.gen`, yield errors directly: `yield* new MyError(...)` not `yield* Effect.fail(...)`
- Use `Effect.void` not `Effect.succeed(undefined)`
- Reduce variable count by inlining single-use values
- Keep helpers close to code they support, below main export

## COMMANDS

```bash
# Dev
bun dev                 # TUI (packages/opencode)
bun dev:web             # Web app (packages/app)
bun dev:desktop         # Desktop app
bun dev:console         # Console app

# Quality
bun typecheck           # Turbo typecheck all packages
bun lint                # oxlint
bun test                # FAILS — do not run from root

# Package-specific
cd packages/opencode && bun test
cd packages/llm && bun test
cd packages/opencode && bun run db generate --name <slug>

# SDK
./packages/sdk/js/script/build.ts
```

## ISSUE TRACKING

This project uses **bd (beads)** for issue tracking. Run `bd prime` for full workflow.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

**Rules:**
- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

## SESSION COMPLETION

**Work is NOT complete until `git push` succeeds.**

1. File issues for remaining work
2. Run quality gates (tests, linters, builds)
3. Update issue status
4. **PUSH:**
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. Clean up stashes, prune branches
6. Verify all changes committed AND pushed
7. Hand off context for next session

**CRITICAL:** NEVER stop before pushing. NEVER say "ready to push when you are" — YOU must push.

## Deployment

Observed deployment configuration:

- GitHub Actions workflows in `.github/workflows`

General redeploy process:

1. Commit and push changes to the default branch.
2. Trigger the relevant CI/CD pipeline or run the documented deploy command.
3. If the project is served via GitHub Pages, the site redeploys automatically after the push.
