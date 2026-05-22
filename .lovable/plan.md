# Migração TanStack Start → Vite + React SPA (Vercel)

## Contexto e impacto

O projeto hoje roda em **TanStack Start** com SSR no Cloudflare Workers, usando:
- `createServerFn` (RPC server-side) em vários `*.functions.ts`
- Server routes (`src/routes/api/public/novidades/webhook/$token.ts`)
- Middleware `requireSupabaseAuth` (valida JWT no servidor, RLS aplicada como usuário)
- Roteamento file-based (`src/routes/*` + `routeTree.gen.ts`)
- `src/start.ts`, `src/server.ts`, `wrangler.jsonc`

Migrar para **Vite + SPA puro** implica perder a camada servidor. Toda a lógica server-side precisa virar:
1. **Chamadas diretas do client ao Supabase** (RLS já protege — é o caminho recomendado)
2. **Webhook** (`/api/public/novidades/webhook/$token`) → **Supabase Edge Function** (Workers não existe mais)

Lógica que dependia do service role no servidor (se houver) também migra para Edge Functions.

---

## Plano de migração

### Fase 1 — Roteamento (TanStack Router SPA, sem Start)
- Manter `@tanstack/react-router` mas em modo **SPA puro** (sem SSR, sem server routes).
- Substituir bootstrap: remover `src/start.ts`, `src/server.ts`, `src/router.tsx` (versão Start).
- Criar `src/main.tsx` (entry SPA) + `index.html` na raiz, montando `<RouterProvider>`.
- Manter `src/routes/*` (file-based) — o plugin `@tanstack/router-plugin/vite` gera `routeTree.gen.ts` em modo SPA.
- Remover rotas server-only: `src/routes/api/**` (mover lógica conforme Fase 3).

### Fase 2 — Conversão de server functions para chamadas client
Todos os `*.functions.ts` que usam `requireSupabaseAuth` viram chamadas diretas via `supabase` client no browser. RLS continua garantindo segurança.

Arquivos afetados (mapear e migrar um a um):
- `src/lib/ferramenta.functions.ts`
- `src/lib/ambiente.functions.ts`
- Demais `*.functions.ts` em `src/lib/`

Padrão de substituição:
```ts
// Antes (server fn): getFerramentaDetalhe via createServerFn + requireSupabaseAuth
// Depois (client hook): useQuery + supabase.from('ferramentas').select(...).eq(...)
```

Loaders de rota que chamavam server fns viram `useQuery` (TanStack Query) nos componentes, ou `loader` que chama supabase diretamente.

### Fase 3 — Webhook em Supabase Edge Function
- Migrar `src/routes/api/public/novidades/webhook/$token.ts` para `supabase/functions/novidades-webhook/index.ts`.
- Atualizar URL externa que dispara o webhook para a URL da Edge Function.
- Validação do token continua igual (compara contra valor armazenado).

### Fase 4 — Configuração Vite + Vercel
- `vite.config.ts`: remover `@lovable.dev/vite-tanstack-config`, usar config Vite padrão:
  ```ts
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
  import path from 'path'

  export default defineConfig({
    plugins: [TanStackRouterVite({ target: 'react', autoCodeSplitting: true }), react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  })
  ```
- Criar `vercel.json` com rewrite SPA:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- Remover `wrangler.jsonc`, `src/server.ts`, `src/start.ts`.
- Atualizar `package.json` scripts: `build` → `vite build`, `dev` → `vite`.
- Remover dependências: `@tanstack/react-start`, `@lovable.dev/vite-tanstack-config`, `wrangler`.

### Fase 5 — Variáveis de ambiente na Vercel
Configurar no dashboard da Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

(Service role **não vai** para a Vercel — fica só nas Edge Functions Supabase.)

### Fase 6 — Deploy
- Conectar repo GitHub à Vercel (via Lovable → GitHub → Vercel).
- Framework preset: **Vite**.
- Build command: `vite build` · Output: `dist`.
- Deploy.

---

## Riscos e perdas

| Item | Hoje (TanStack Start) | Depois (SPA) |
|---|---|---|
| Segurança | Middleware server valida JWT antes de tocar Supabase | RLS é a única barreira (precisa estar 100% correta em todas as tabelas) |
| SEO | SSR renderiza HTML completo | SPA renderiza vazio até JS carregar (impacto em SEO/preview) |
| Webhook | Rota TanStack | Edge Function Supabase (URL muda) |
| Secrets server-side | `process.env` em server fns | Não existe — tudo client ou Edge Function |
| Performance inicial | HTML pré-renderizado | Tela branca até bundle carregar |

**Importante:** RLS precisa estar revisada em todas as tabelas antes de remover a camada server, porque o client passa a falar direto com o Supabase.

---

## Estimativa de escopo
- ~15–25 arquivos editados (rotas, lib/*.functions.ts → hooks/queries)
- 3–5 arquivos novos (main.tsx, index.html, vercel.json, edge function)
- ~8 arquivos removidos (start.ts, server.ts, wrangler.jsonc, api routes)

---

## Confirmação necessária antes de iniciar
1. **Confirma a perda de SSR/SEO?** Páginas públicas (ex: resultados de trabalhos por código) vão renderizar via JS apenas.
2. **Confirma migrar o webhook para Edge Function Supabase?** A URL externa do webhook precisará ser atualizada onde quer que esteja configurada.
3. **Quer que eu revise as RLS policies das tabelas críticas antes de remover a camada server?** (Recomendado.)

Se confirmar os 3 pontos, executo a migração completa e preparo para deploy na Vercel.