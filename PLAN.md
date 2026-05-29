# PLAN.md — Migração Supabase → Self-Hosted

Rastreador de tasks da migração. Cada task é discutida antes de executar, tem branch própria e PR ao final.

**Branch alvo dos PRs**: `refactor/loveable-migration`

**Protocolo de segurança:** toda task inclui análise de riscos e pen-test checklist — discutidos antes da execução.

**Commits:** conventional commits, atômico por task. Branch a partir de `refactor/loveable-migration`. PR ao final.

---

## FASE 0 — Configuração & Scaffolding

- [x] **Task 0.1** — Adicionar guia de estilo aos arquivos de config do projeto
  `feat/project-config-files` · [PR #1](https://github.com/sptech-consulting/pos.graduacao.cms/pull/1)

- [x] **Task 0.2** — Scaffold do monorepo pnpm
  `feat/monorepo-scaffold` · [PR #2](https://github.com/sptech-consulting/pos.graduacao.cms/pull/2)

- [ ] **Task 0.3** — Docker Compose baseline
  `feat/docker-compose` · MySQL 8, MinIO, Redis, adminer, backend placeholder, `.env.example`

---

## FASE 1 — Fundação do Backend

- [ ] **Task 1.1** — Fastify server + config + health check
  `feat/backend-server` · server.ts, config.ts (Zod), GET /health, Dockerfile

- [ ] **Task 1.2** — Schema Drizzle ORM + migrations
  `feat/drizzle-schema` · Traduzir 17 migrations SQL → Drizzle schema por domínio, seed de permissões

---

## FASE 2 — Autenticação

- [ ] **Task 2.1** — JWT login + refresh + logout
  `feat/auth-jwt` · auth.service.ts, argon2, refresh_tokens table, POST /auth/login|refresh|logout

- [ ] **Task 2.2** — Fluxo de reset de senha
  `feat/password-reset` · password_reset_tokens, POST /auth/forgot-password|reset-password, nodemailer

- [ ] **Task 2.3** — Fluxo de convite de admin
  `feat/admin-invite` · Substitui Edge Function admin-users, POST /admin/usuarios + PATCH status/grupos

---

## FASE 3 — Middleware de Autorização (substitui RLS)

- [ ] **Task 3.1** — Middleware RBAC para admin
  `feat/rbac-middleware` · require-auth, require-admin, require-permission, require-ambiente-scope

- [ ] **Task 3.2** — Middleware de acesso de aluno
  `feat/aluno-middleware` · require-aluno-auth, require-aluno-ambiente

---

## FASE 4 — Endpoints CRUD Admin

- [ ] **Task 4.1** — Ambientes CRUD
  `feat/admin-ambientes`

- [ ] **Task 4.2** — Cursos, Módulos, Aulas CRUD
  `feat/admin-cursos`

- [ ] **Task 4.3** — Ferramentas CRUD + sub-recursos
  `feat/admin-ferramentas`

- [ ] **Task 4.4** — Alunos CRUD + importação em lote
  `feat/admin-alunos` · Substitui Edge Function admin-alunos

- [ ] **Task 4.5** — Trabalhos CRUD + acesso público
  `feat/trabalhos`

- [ ] **Task 4.6** — Novidades CRUD + webhook
  `feat/novidades` · Substitui Edge Function novidades-webhook

- [ ] **Task 4.7** — Grupos, Permissões, Comentários, Logs, Métricas
  `feat/admin-rbac-logs`

---

## FASE 5 — Endpoints do Aluno

- [ ] **Task 5.1** — Home do aluno + dados do ambiente
  `feat/aluno-home`

- [ ] **Task 5.2** — Player de aula + progresso + comentários
  `feat/aluno-player`

- [ ] **Task 5.3** — Detalhe de ferramenta + novidade
  `feat/aluno-content`

---

## FASE 6 — Migração de Storage

- [ ] **Task 6.1** — MinIO presigned URL service
  `feat/storage`

- [ ] **Task 6.2** — Migração do ImageUpload no frontend
  `feat/frontend-storage`

---

## FASE 7 — Migração do Frontend

- [ ] **Task 7.1** — API client + integração de auth
  `feat/frontend-auth` · Substitui integrations/supabase/ por integrations/api/

- [ ] **Task 7.2** — Migrar arquivos `*.functions.ts` (um branch por arquivo)
  `feat/frontend-fn-*` · 10 arquivos, ordem por profundidade de dependência

---

## FASE 8 — Hardening

- [ ] **Task 8.1** — Security headers + CORS
  `feat/security-headers` · @fastify/helmet, CORS allowlist

- [ ] **Task 8.2** — Integração do audit log
  `feat/audit-log` · audit.service.ts, IP capture, failed auth logging

- [ ] **Task 8.3** — Auditoria de validação de inputs
  `feat/input-validation` · Revisão de todos os schemas Fastify
