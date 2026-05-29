# pos.graduacao.cms — AI Agent Instructions

## Project context

CMS de pós-graduação para a SPTech. Multi-tenant learning platform with environments (ambientes), courses, lessons, tools, news, student progress tracking, and project showcases.

**Migration in progress:** Moving from Lovable.dev + Supabase to a self-hosted monorepo.
- Frontend: React 19 + TypeScript + Vite + TanStack Router (SPA) → `frontend/`
- Backend: Fastify 4 + Drizzle ORM + MySQL 8 → `backend/`
- Infra: Docker Compose (MySQL 8, MinIO, Redis, adminer)
- Auth: JWT (access 15min + refresh 7d) with argon2 password hashing
- Storage: MinIO with presigned PUT URLs (client uploads directly, not through backend)

## Workflow

- Present task plan (what, security risks, pen-test checklist) and get user authorization before executing.
- One atomic commit per task. Conventional commits format.
- Branch from `main` for every task. Open PR when done.
- Update `PLAN.md` after each merged PR.
- Security risks and pen-test checklist are surfaced at planning time — not after implementation.

## Code style

- Functions: 4-20 lines. Split if longer.
- Files: under 500 lines. Split by responsibility.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`.
  Prefer names that return <5 grep hits in the codebase.
- Types: explicit. No `any`, no `Dict`, no untyped functions.
- No code duplication. Extract shared logic into a function/module.
- Early returns over nested ifs. Max 2 levels of indentation.
- Exception messages must include the offending value and expected shape.

## Comments

- Keep your own comments. Don't strip them on refactor — they carry
  intent and provenance.
- Write WHY, not WHAT. Skip `// increment counter` above `i++`.
- Docstrings on public functions: intent + one usage example.
- Reference issue numbers / commit SHAs when a line exists because
  of a specific bug or upstream constraint.

## Tests

- Tests run with a single command: `pnpm test` (backend) / `pnpm test:frontend`.
- Every new function gets a test. Bug fixes get a regression test.
- Mock external I/O (API, DB, filesystem) with named fake classes,
  not inline stubs.
- Tests must be F.I.R.S.T: fast, independent, repeatable,
  self-validating, timely.

## Dependencies

- Inject dependencies through constructor/parameter, not global/import.
- Wrap third-party libs behind a thin interface owned by this project.

## Structure

- Monorepo: `frontend/`, `backend/`, `shared/` packages at root.
- Backend: `src/routes/` → `src/services/` → `src/db/schema/`, with `src/middleware/` and `src/plugins/`.
- Frontend: TanStack Router file-based routing under `src/routes/`. Business logic in `src/lib/`.
- Never put business logic in route files — routes are thin.

## Formatting

- Use `prettier`. Run before committing. Don't discuss style.

## Logging

- Structured JSON for observability (Fastify pino logger in backend).
- Plain text only for user-facing CLI output.

## Security rules

- Never commit `.env`, secrets, tokens, or passwords.
- Every authenticated route uses explicit middleware before the handler.
- Permission checks fire before any DB write — never after.
- Rate limiting on all auth and public endpoints.
- All inputs validated via Fastify JSON schema at the route boundary.
- UUID route params validated with regex pattern in schema.
- Tokens stored as SHA-256 hash — never plaintext.
- Pre-signed storage URLs expire in 5 minutes and are scoped to exact key + MIME type.
