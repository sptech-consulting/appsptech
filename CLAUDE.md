# pos.graduacao.cms — Claude Code Instructions

## Project

CMS de pós-graduação para a SPTech. Plataforma de ensino com múltiplos ambientes (tenants), gerenciamento de cursos/aulas, ferramentas, notícias, progresso de alunos e showcase de trabalhos.

**Stack atual em migração:**
- Frontend: React 19 + TypeScript + Vite + TanStack Router (SPA)
- Backend: em construção — Fastify 4 + Drizzle ORM + MySQL 8
- Infra: Docker Compose (MySQL, MinIO, Redis, adminer)
- Auth: JWT (access 15min + refresh 7d, argon2)
- Storage: MinIO (S3-compatible, presigned URLs)

## Workflow obrigatório

- **Antes de cada task**: apresentar o plano da task (o que será feito, riscos de segurança, pen-test checklist) e aguardar autorização explícita do usuário.
- **Commits**: conventional commits, um commit atômico por task.
- **Branches**: sempre abrir branch a partir de `main`. Nunca committar direto na main.
- **PRs**: abrir PR ao final de cada task. Atualizar `PLAN.md` após o merge.
- **Segurança em primeiro lugar**: toda task passa por pen test antes do PR. Riscos de segurança são discutidos na fase de planejamento, não após a implementação.

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

- Monorepo: `frontend/`, `backend/`, `shared/` packages.
- Backend follows: `routes/` → `services/` → `db/schema/` + `middleware/` + `plugins/`.
- Frontend follows TanStack Router file-based routing under `src/routes/`.
- Predictable paths — never put business logic in route files.

## Formatting

- Use `prettier` (frontend/backend). Run `prettier --write .` before committing.
- Don't discuss style beyond that.

## Logging

- Structured JSON when logging for debugging / observability (backend: Fastify's pino logger).
- Plain text only for user-facing CLI output.

## Security

- Nunca commitar `.env`, tokens, senhas ou chaves.
- Toda rota autenticada usa middleware explícito (`require-auth`, `require-admin`, `require-permission`).
- Permissões verificadas antes de qualquer operação no banco — nunca depois.
- Rate limiting em todos os endpoints públicos e de autenticação.
- Inputs validados via Fastify schema (ajv) na entrada — nunca confiar no cliente.
- UUIDs em params validados via regex no schema da rota.
- Tokens armazenados como hash (SHA-256) — nunca em plaintext.
