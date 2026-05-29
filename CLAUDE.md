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
- **TDD obrigatório**: escrever os testes **antes** da implementação. Ciclo Red → Green → Refactor. Nenhum PR sem testes passando.
- **Commits**: conventional commits, um commit atômico por task.
- **Branches**: sempre abrir branch a partir de `refactor/loveable-migration`. Nunca committar direto.
- **PRs**: abrir PR ao final de cada task. Atualizar `PLAN.md` após o merge.
- **Segurança em primeiro lugar**: toda task passa por pen test antes do PR. Riscos de segurança são discutidos na fase de planejamento, não após a implementação.

## TDD — Test-Driven Development

### Ciclo por task

```
1. Escrever testes que descrevem o comportamento esperado  →  RED (falham)
2. Implementar o mínimo para os testes passarem           →  GREEN
3. Refatorar mantendo os testes verdes                    →  REFACTOR
4. Adicionar testes de segurança/hardening               →  SECURE
```

### Tipos de teste por camada

**Serviços (`src/services/*.test.ts`)** — unit tests, mock de DB com named fake classes:
```ts
class FakeUsuariosRepo { ... }  // nunca inline stubs
```

**Rotas (`src/routes/**/*.test.ts`)** — integration tests via `app.inject()` (Fastify built-in):
```ts
const response = await app.inject({ method: "POST", url: "/auth/login", payload: {...} });
```

**Middleware (`src/middleware/*.test.ts`)** — unit tests de cada preHandler isolado.

### Testes de segurança obrigatórios por task

Toda task com endpoints deve incluir testes de hardening cobrindo:

- **Auth bypass**: acesso sem token → 401; token expirado → 401; token de aluno em rota admin → 403
- **Privilege escalation**: caller sem permissão → 403; caller scoped tentando operação global → 403
- **IDOR / BOLA**: recurso de ambiente A acessado por admin de ambiente B → 403
- **Input validation**: payload acima do limite → 400; `additionalProperties` extras → 400; UUID malformado → 400
- **Rate limit**: N+1 chamadas → 429

### Estrutura de arquivos de teste

```
backend/src/
├── routes/
│   └── auth/
│       ├── index.ts
│       └── index.test.ts        ← testes da rota
├── services/
│   ├── auth.service.ts
│   └── auth.service.test.ts     ← testes do serviço
└── middleware/
    ├── require-permission.ts
    └── require-permission.test.ts
```

### Comandos

```bash
pnpm test              # backend — vitest run (todos)
pnpm test:watch        # backend — vitest watch
pnpm test:frontend     # frontend — vitest run
pnpm test:coverage     # backend — cobertura
```

### Cobertura mínima esperada

- Serviços: 100% das funções exportadas
- Rotas: happy path + todos os casos de erro documentados no schema
- Segurança: todos os itens do pen-test checklist da task

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
- `additionalProperties: false` em todos os schemas de body/query.
- OWASP API Security Top 10 verificado em cada PR com rotas novas.
