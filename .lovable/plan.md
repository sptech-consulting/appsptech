
## Objetivo

Transformar o módulo **Resultados** num espaço rico onde professores (admin) cadastram trabalhos com múltiplas seções, e alunos acessam via código de acesso já existente do ambiente, com um layout que reproduz as telas anexadas (cards numerados + página de detalhe).

## 1. Banco de dados (migration)

Ampliar `trabalhos` e criar tabelas filhas. Tudo com RLS reutilizando as policies já existentes (`is_admin_for_ambiente` / código público).

### Alterações em `trabalhos`
Novas colunas:
- `apresentacao_tipo` enum (`video`, `pptx`, `imagem`, `documento`) — nullable
- `apresentacao_url` text — link YouTube/Vimeo ou arquivo
- `apresentacao_titulo` text
- `apresentacao_descricao` text
- `aplicacao_expectativa` text (rich text / markdown)
- `apresentacao_imagem_url` text (imagem de capa da apresentação, screenshot do produto)
- `subtitulo` text (ex.: "Truth Layer + Revenue Command Center")

### Nova tabela `trabalho_funcionalidades`
- `id`, `trabalho_id` (FK), `ordem`, `titulo`, `descricao`, `imagem_url`, `criado_em`
- RLS: admin do ambiente gerencia; público lê via join se trabalho está publicado (RPC).

### Nova tabela `trabalho_links`
- `id`, `trabalho_id`, `ordem`, `rotulo`, `url`, `icone_url`
- Mesma RLS.

### RPCs públicas (atualização)
- `obter_trabalho_publico(_codigo, _trabalho_id)` retorna também novos campos.
- Novas RPCs:
  - `listar_funcionalidades_publicas(_codigo, _trabalho_id)`
  - `listar_links_publicos(_codigo, _trabalho_id)`

### Storage
Reutilizar bucket existente (ou criar `trabalhos-assets`) para uploads de imagens de funcionalidades e arquivos de apresentação.

## 2. Server functions (admin)

Em `src/lib/trabalhos.functions.ts` (novo arquivo `trabalhos-admin.functions.ts` com `requireSupabaseAuth`):
- `criarTrabalho`, `atualizarTrabalho`, `excluirTrabalho` (lógica via status)
- `salvarFuncionalidade`, `removerFuncionalidade`, `reordenarFuncionalidades`
- `salvarLink`, `removerLink`

Em `src/lib/trabalhos.functions.ts` (público) adicionar:
- `obterTrabalhoCompleto` retornando trabalho + funcionalidades + links em uma chamada.

## 3. Admin UI — "Ambientes e Turmas"

### Lista dentro do edit de ambiente
Em `src/routes/admin.ambientes.$id.tsx`, adicionar aba/seção **Resultados** quando o ambiente tem `codigo_acesso_resultados`:
- Lista de trabalhos do ambiente (CRUD)
- Botão "Novo trabalho"

### Form de trabalho
Nova rota `src/routes/admin.ambientes.$id.trabalhos.$trabalhoId.tsx` (e `.novo.tsx`) com:
- Identificação: título, subtítulo, descrição/resumo, autor, turma, tags
- Mídia: imagem de capa (card), imagem da apresentação (hero do detalhe)
- Apresentação: tipo + URL/upload + título + descrição
- **Funcionalidades**: lista dinâmica de blocos (título, descrição, imagem). Reordenar.
- Aplicação & expectativa: textarea longo
- Links úteis: lista dinâmica (rótulo + URL + ícone opcional)
- Status (rascunho / publicada), destaque

## 4. Aluno UI — Layout dos screenshots

### `src/routes/e.$slug.resultados.tsx` (atualizar)
Cards seguem o screenshot 1:
- Grid 3 colunas em desktop
- Cada card: thumbnail flutuante topo-esquerda, número "01" grande topo-direita (cinza claro), título, descrição (3 linhas), botão "Mostrar detalhes →"
- Estilo glass/floating com sombra suave, sem borda dura. Respeitar tokens do ambiente (`cor_primaria` para botão/número-hover).
- Fundo neutro com leve gradiente da identidade.

### `src/routes/e.$slug.resultados.$trabalhoId.tsx` (refatorar)
Seguindo screenshot 2:
- Header: botão voltar (←), número grande "02" cinza, título grande (destaque com `cor_primaria`), descrição centralizada
- Hero: imagem(ns) de apresentação flutuante com sombra
- Seção "Subtítulo + descrição rica" (texto longo com destaques)
- Bloco apresentação: imagem grande à esquerda + ícone/título/descrição/CTA à direita
- **Principais funcionalidades**: layout zigzag — imagem (lado alternado) + texto. Renderiza dinamicamente de `trabalho_funcionalidades`.
- Bloco "Onde se aplica e expectativa": card destacado com borda fina
- **Links úteis**: rodapé com pílulas/botões pequenos

Player de vídeo embeddado reutilizando `toEmbedUrl` (YouTube/Vimeo) de `e.$slug.aula.$aulaId.tsx`. Extrair para `src/lib/video-embed.ts` para reuso.

## 5. Componente reutilizável

`src/components/ApresentacaoBlock.tsx` para renderizar o bloco de apresentação conforme o tipo:
- `video` → iframe
- `imagem` → `<img>`
- `pptx`/`documento` → botão de download + thumbnail

## Detalhes técnicos

- Tema/cores: usar `cor_primaria/secundaria/fundo/texto` do ambiente em todas as superfícies da área do aluno (já é padrão no projeto). Admin permanece com paleta SPTech.
- Exclusões lógicas: trabalho → `status='arquivada'`. Funcionalidades/links removidos fisicamente.
- Slug: já existe trigger `slugify_pt` em `trabalhos`. Manter resolução por slug.
- RLS: novas tabelas filhas reusam `is_admin_for_ambiente(trabalho.ambiente_id)` e leitura via RPC `SECURITY DEFINER` que valida o código.

## Ordem de execução

1. Migration (tabelas, colunas, RPCs).
2. Server functions admin + público.
3. Admin form completo + lista dentro do ambiente.
4. Refator aluno (cards numerados + detalhe rico).
5. Extrair embed util e revisar visual.

## Confirmação necessária

Por causa do tamanho (migration + ~6 arquivos novos/alterados), confirmo o plano antes de executar. Após "ok", começo pela migration.
