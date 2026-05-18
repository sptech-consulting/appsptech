# Slugs amigáveis para ferramenta, aula, novidade e trabalho

Trocar UUIDs nas URLs por slugs legíveis, com fallback por UUID para não quebrar links antigos.

## URLs

| Hoje | Depois |
|---|---|
| `/e/$slug/ferramenta/$ferramentaId` | `/e/$slug/ferramenta/$ferramentaSlug` |
| `/e/$slug/aula/$aulaId` | `/e/$slug/aula/$aulaSlug` |
| `/e/$slug/novidade/$novidadeId` | `/e/$slug/novidade/$novidadeSlug` |
| `/e/$slug/resultados/$trabalhoId` | `/e/$slug/resultados/$trabalhoSlug` |

Slug global por entidade (não por ambiente) — mais simples e suficiente.

## Banco

Migration única adicionando `slug text` (nullable, único) em:
- `ferramentas`
- `aulas`
- `novidades`
- `trabalhos`

Backfill automático no migration: gerar slug a partir do título via função `slugify_pt(text)` (lowercase, sem acento, `[^a-z0-9]+` → `-`, trim `-`), com sufixo numérico em caso de colisão.

Função `slugify_pt` fica em `public` e é reutilizada por triggers `BEFORE INSERT/UPDATE` que preenchem `slug` automaticamente quando vier `NULL` ou quando o título mudar e o slug ainda for o derivado anterior.

Índices únicos parciais (`WHERE slug IS NOT NULL`) em cada tabela.

## Resolução nas rotas

Em cada loader/route, resolver param assim:
1. Se o param casa com formato UUID → buscar por `id`.
2. Senão → buscar por `slug`.

Isso preserva links antigos compartilhados (UUID) e ativa os novos slugs sem redirect explícito.

Helper único `resolveBySlugOrId(table, param)` em `src/lib/slug.ts`.

## Frontend

- `src/routes/e.$slug.index.tsx`: ao navegar para ferramenta/aula/novidade, passar `slug` (com fallback para `id` quando ausente).
- `src/routes/e.$slug.resultados.tsx`: idem para trabalho.
- Rotas de detalhe: renomear param para `$ferramentaSlug` / `$aulaSlug` / `$novidadeSlug` / `$trabalhoSlug` e atualizar consultas via helper.
- Admin: exibir o slug (read-only por enquanto) no formulário de edição de cada entidade, com botão "regenerar a partir do título". Edição manual fica para um próximo passo.

## Arquivos afetados

- novo: `supabase/migrations/*_slugs.sql`
- novo: `src/lib/slug.ts`
- editar: `src/routes/e.$slug.ferramenta.$ferramentaId.tsx` → renomear arquivo + loader
- editar: `src/routes/e.$slug.aula.$aulaId.tsx` → idem
- editar: `src/routes/e.$slug.novidade.$novidadeId.tsx` → idem
- editar: `src/routes/e.$slug.resultados.$trabalhoId.tsx` → idem
- editar: `src/routes/e.$slug.index.tsx`, `src/routes/e.$slug.resultados.tsx` (navegação)
- editar: `src/lib/ferramenta.functions.ts`, `aula-player.functions.ts`, `novidade.functions.ts`, `trabalhos.functions.ts` (aceitar slug ou id)
- editar: admins (`admin.ferramentas.$id.tsx`, `admin.aulas.tsx`, `admin.trabalhos.tsx`, novidades dentro de `admin.ambientes.$id.tsx`) — mostrar slug

## Compatibilidade

- Links antigos com UUID continuam funcionando.
- `routeTree.gen.ts` é regenerado automaticamente após renomear os arquivos.
