# Prompt Inicial para Desenvolvimento — Projeto SPTech

## 1. Contexto Geral

Estamos iniciando um novo projeto chamado **SPTech**.

O sistema será uma plataforma multiambiente, onde cada **Ambiente** representa uma empresa, cliente, turma, comunidade ou portal específico.

Exemplos de ambientes:

- Ecorodovias
- Cliente XPTO
- Turma IA para Negócios
- Comunidade Corporativa ABC

Tudo o que aparece na experiência inicial do usuário deve ser entendido como parte de um **Ambiente**.

Ou seja, Ferramentas, Novidades, Área do Aluno, Aulas, Alunos e Configurações Visuais devem estar vinculados a um Ambiente.

## 2. Conceito Central do Sistema

A entidade principal do sistema é:

```txt
Ambiente
```

Um Ambiente deve funcionar como uma área independente dentro da plataforma, podendo ter:

- Nome próprio
- Logotipo próprio
- Cores próprias
- Cor de fundo própria
- Imagem de capa própria
- Ferramentas vinculadas
- Novidades vinculadas
- Aulas vinculadas
- Alunos vinculados
- Usuários administrativos vinculados
- Configurações visuais próprias
- Layout próprio da home
- Formato próprio dos cards
- Ordem própria das seções

A plataforma deve ser preparada para funcionar como um sistema **white label**, onde cada ambiente pode ter identidade visual personalizada.

## 3. Objetivo do Desenvolvimento

Desenvolver uma aplicação web para gerenciamento e visualização de ambientes educacionais/corporativos, contendo:

- Área administrativa
- Área do aluno
- Gestão de ambientes
- Gestão de ferramentas
- Gestão de novidades
- Gestão de aulas
- Gestão de alunos
- Importação de alunos por CSV/XLSX
- Gestão de usuários administrativos
- Grupos de acesso
- Permissões por grupo
- Personalização visual por ambiente

## 4. Estrutura Principal

### 4.1 Área Administrativa

A área administrativa deve permitir:

- Criar ambientes
- Editar ambientes
- Inativar ambientes
- Personalizar visualmente ambientes
- Cadastrar ferramentas
- Vincular ferramentas a ambientes
- Cadastrar novidades
- Vincular novidades a ambientes
- Cadastrar aulas
- Vincular aulas a ambientes
- Importar alunos por ambiente
- Cadastrar usuários administrativos
- Criar grupos de acesso
- Definir permissões por grupo
- Vincular usuários administrativos a grupos
- Definir se o usuário admin tem acesso global ou apenas a ambientes específicos

### 4.2 Área do Aluno

A área do aluno deve exibir os dados conforme o ambiente ativo.

O aluno só deve visualizar:

- Ambientes aos quais está vinculado
- Ferramentas vinculadas ao ambiente ativo
- Novidades vinculadas ao ambiente ativo
- Aulas vinculadas ao ambiente ativo
- Configurações visuais do ambiente ativo

A experiência visual da área do aluno deve respeitar as configurações white label do ambiente.

## 5. Conceito de White Label por Ambiente

Cada ambiente deve poder ter sua própria identidade visual.

Ao criar ou editar um ambiente, o admin deve conseguir configurar:

- Nome do ambiente
- Slug do ambiente
- Logotipo
- Imagem de capa/banner
- Cor primária
- Cor secundária
- Cor de fundo
- Cor dos textos
- Cor dos botões
- Cor dos cards
- Cor das bordas
- Tema claro ou escuro
- Estilo visual dos cards
- Formato das bordas dos cards
- Tipo de ícones
- Ordem das seções da home
- Visibilidade das seções
- Layout da página inicial

### 5.1 Personalização de Cores

O cadastro do ambiente deve permitir configurar:

```txt
cor_primaria
cor_secundaria
cor_fundo
cor_texto
cor_botao
cor_card
cor_borda
```

Essas cores devem impactar a área do aluno e, se aplicável, também a área pública do ambiente.

### 5.2 Personalização de Logotipo e Imagens

Cada ambiente deve permitir:

```txt
logo_url
imagem_capa_url
favicon_url
imagem_login_url
```

Esses elementos devem ser usados na interface do ambiente.

### 5.3 Personalização de Layout

Cada ambiente deve poder controlar a posição das seções da home.

Exemplo de seções:

- Banner principal
- Ferramentas
- Novidades
- Área do aluno
- Aulas em destaque
- Comunicados

O admin deve conseguir definir:

- Quais seções aparecem
- Ordem das seções
- Título personalizado de cada seção
- Quantidade de itens exibidos por seção
- Se a seção aparece em grid, lista ou carrossel

Exemplo:

```txt
Ambiente Ecorodovias:
1. Banner principal
2. Ferramentas
3. Aulas
4. Novidades

Ambiente Cliente XPTO:
1. Novidades
2. Banner principal
3. Ferramentas
4. Aulas
```

### 5.4 Personalização dos Cards

Cada ambiente deve poder definir o formato visual dos cards.

Opções esperadas:

- Cards arredondados
- Cards quadrados
- Cards flat
- Cards com sombra
- Cards sem sombra
- Cards com borda
- Cards com ícones
- Cards com imagem de fundo
- Cards compactos
- Cards grandes

Configurações sugeridas:

```txt
card_estilo: flat | sombra | borda | imagem
card_borda: quadrado | levemente_arredondado | arredondado | pill
card_tamanho: compacto | medio | grande
card_exibir_icone: true | false
card_exibir_imagem: true | false
card_sombra: true | false
```

Essas configurações devem impactar cards de:

- Ferramentas
- Novidades
- Aulas
- Comunicados
- Destaques

## 6. Banco de Dados Esperado

Criar uma estrutura de banco preparada para multiambiente.

### 6.1 Tabelas principais

```txt
ambientes
configuracoes_ambiente

ferramentas
ambiente_ferramentas

novidades
ambiente_novidades

aulas
ambiente_aulas

alunos
ambiente_alunos

importacoes_alunos
importacoes_alunos_erros

usuarios_admin
grupos_acesso
permissoes
grupo_permissoes
usuarios_admin_grupos

logs_auditoria
```

## 7. Tabela: ambientes

Criar tabela `ambientes` com os seguintes campos:

```txt
id
nome
slug
descricao
status

logo_url
favicon_url
imagem_capa_url
imagem_login_url

cor_primaria
cor_secundaria
cor_fundo
cor_texto
cor_botao
cor_card
cor_borda

tema
layout_home
card_estilo
card_borda
card_tamanho
card_exibir_icone
card_exibir_imagem
card_sombra

criado_em
atualizado_em
criado_por
```

### 7.1 Regras

- O nome do ambiente é obrigatório.
- O slug do ambiente é obrigatório e único.
- O ambiente pode ser criado como rascunho.
- O ambiente só aparece para alunos se estiver ativo.
- Cada ambiente pode ter identidade visual própria.
- Cada ambiente pode ter sua própria ordenação de seções.
- Cada ambiente pode ter seu próprio estilo de card.

### 7.2 Status possíveis

```txt
ativo
inativo
rascunho
arquivado
```

### 7.3 Tema

```txt
claro
escuro
personalizado
```

## 8. Tabela: configuracoes_ambiente

Criar tabela `configuracoes_ambiente` para permitir configurações flexíveis por ambiente.

Campos:

```txt
id
ambiente_id
chave
valor
criado_em
atualizado_em
```

O campo `valor` deve ser `jsonb`.

### 8.1 Exemplos de configurações

```json
{
  "layout_home": {
    "secoes": [
      {
        "tipo": "banner",
        "titulo": "Bem-vindo",
        "ordem": 1,
        "visivel": true
      },
      {
        "tipo": "ferramentas",
        "titulo": "Ferramentas",
        "ordem": 2,
        "visivel": true,
        "modo_exibicao": "grid",
        "limite_itens": 8
      },
      {
        "tipo": "aulas",
        "titulo": "Área do Aluno",
        "ordem": 3,
        "visivel": true,
        "modo_exibicao": "carrossel",
        "limite_itens": 6
      },
      {
        "tipo": "novidades",
        "titulo": "Novidades",
        "ordem": 4,
        "visivel": true,
        "modo_exibicao": "lista",
        "limite_itens": 5
      }
    ]
  }
}
```

Outro exemplo:

```json
{
  "cards": {
    "estilo": "sombra",
    "borda": "arredondado",
    "tamanho": "medio",
    "exibir_icone": true,
    "exibir_imagem": true,
    "sombra": true
  }
}
```

### 8.2 Regras

- Cada configuração pertence a um ambiente.
- A mesma chave não deve se repetir para o mesmo ambiente.
- O sistema deve usar configuração padrão quando o ambiente não possuir configuração personalizada.
- As configurações devem impactar diretamente a interface do ambiente.

## 9. Ferramentas

### 9.1 Tabela: ferramentas

Campos:

```txt
id
nome
descricao
url
icone_url
categoria
tipo_abertura
status
criado_em
atualizado_em
criado_por
```

### 9.2 Tabela: ambiente_ferramentas

Campos:

```txt
id
ambiente_id
ferramenta_id
ordem
destaque
status
criado_em
atualizado_em
```

### 9.3 Regras

- Ferramentas são cadastradas globalmente.
- Ferramentas devem ser vinculadas a ambientes.
- Uma ferramenta pode estar em vários ambientes.
- Uma ferramenta só aparece se estiver ativa e vinculada ao ambiente ativo.
- O vínculo com ambiente controla ordem e destaque.

## 10. Novidades

### 10.1 Tabela: novidades

Campos:

```txt
id
titulo
resumo
conteudo
imagem_url
fonte_nome
fonte_url
categoria
tags
publicado_em
status
criado_em
atualizado_em
criado_por
```

### 10.2 Tabela: ambiente_novidades

Campos:

```txt
id
ambiente_id
novidade_id
destaque
ordem
status
criado_em
```

### 10.3 Regras

- Novidades podem ser cadastradas manualmente.
- Novidades podem ser originadas por automação externa.
- Novidades podem ser vinculadas a um ou mais ambientes.
- Novidades só aparecem para alunos quando estiverem publicadas e vinculadas ao ambiente.
- Novidades podem ter imagem, fonte, categoria e tags.

## 11. Aulas

### 11.1 Tabela: aulas

Campos:

```txt
id
titulo
descricao
video_url
material_url
thumbnail_url
modulo
duracao_minutos
tipo_conteudo
status
criado_em
atualizado_em
criado_por
```

### 11.2 Tabela: ambiente_aulas

Campos:

```txt
id
ambiente_id
aula_id
ordem
modulo_ordem
liberado
data_liberacao
status
criado_em
```

### 11.3 Regras

- Aulas são cadastradas globalmente.
- Aulas devem ser vinculadas a ambientes.
- Uma aula pode estar em vários ambientes.
- A aula só aparece se estiver publicada, liberada e vinculada ao ambiente.
- A data de liberação deve permitir publicação programada.

## 12. Alunos

### 12.1 Tabela: alunos

Campos:

```txt
id
nome_completo
email_acesso
whatsapp
status
criado_em
atualizado_em
```

### 12.2 Tabela: ambiente_alunos

Campos:

```txt
id
ambiente_id
aluno_id
status
origem
importacao_id
criado_em
atualizado_em
```

### 12.3 Regras

- Alunos são cadastrados de forma única.
- O e-mail de acesso deve ser único.
- Um aluno pode estar vinculado a um ou mais ambientes.
- Um aluno só acessa ambientes aos quais está vinculado.
- Um aluno inativo ou bloqueado não deve acessar a plataforma.

## 13. Importação de Alunos

### 13.1 Formatos aceitos

```txt
csv
xlsx
```

### 13.2 Campos obrigatórios do arquivo

```txt
Nome Completo
E-mail de Acesso
WhatsApp
```

### 13.3 Tabela: importacoes_alunos

Campos:

```txt
id
ambiente_id
arquivo_nome
arquivo_url
tipo_arquivo
total_linhas
total_importados
total_atualizados
total_erros
status
criado_por
criado_em
finalizado_em
```

### 13.4 Tabela: importacoes_alunos_erros

Campos:

```txt
id
importacao_id
numero_linha
nome_completo
email_acesso
whatsapp
erro
criado_em
```

### 13.5 Regras

- Toda importação deve estar vinculada a um ambiente.
- O admin deve selecionar o ambiente antes de importar.
- O arquivo deve possuir os campos obrigatórios.
- Se o aluno não existir, criar aluno e vincular ao ambiente.
- Se o aluno já existir, atualizar dados e criar vínculo com o ambiente, se ainda não existir.
- Linhas inválidas devem ser registradas na tabela de erros.
- A importação não deve apagar alunos antigos.
- A importação não deve remover vínculos existentes.

## 14. Usuários Administrativos e Permissões

### 14.1 Tabela: usuarios_admin

Campos:

```txt
id
nome
email
auth_user_id
status
criado_em
atualizado_em
ultimo_acesso_em
```

### 14.2 Tabela: grupos_acesso

Campos:

```txt
id
nome
descricao
escopo
status
criado_em
atualizado_em
```

Escopos possíveis:

```txt
global
ambiente
```

### 14.3 Tabela: permissoes

Campos:

```txt
id
chave
modulo
descricao
criado_em
```

### 14.4 Tabela: grupo_permissoes

Campos:

```txt
id
grupo_id
permissao_id
criado_em
```

### 14.5 Tabela: usuarios_admin_grupos

Campos:

```txt
id
usuario_admin_id
grupo_id
ambiente_id
acesso_global
criado_em
```

### 14.6 Regras

- Usuários administrativos devem ser separados dos alunos.
- Usuários administrativos podem ter acesso global ou por ambiente.
- Usuários administrativos pertencem a grupos.
- Grupos possuem permissões.
- Permissões liberam ações.
- Um usuário pode pertencer a mais de um grupo.
- Um usuário com acesso global pode gerenciar todos os ambientes.
- Um usuário com acesso por ambiente só pode visualizar e gerenciar ambientes autorizados.

## 15. Permissões Iniciais

Criar permissões iniciais para os seguintes módulos:

### 15.1 Ambientes

```txt
ambientes.visualizar
ambientes.criar
ambientes.editar
ambientes.inativar
ambientes.personalizar
ambientes.arquivar
```

### 15.2 Ferramentas

```txt
ferramentas.visualizar
ferramentas.criar
ferramentas.editar
ferramentas.inativar
ferramentas.vincular_ambiente
```

### 15.3 Novidades

```txt
novidades.visualizar
novidades.criar
novidades.editar
novidades.publicar
novidades.arquivar
novidades.vincular_ambiente
```

### 15.4 Aulas

```txt
aulas.visualizar
aulas.criar
aulas.editar
aulas.publicar
aulas.arquivar
aulas.vincular_ambiente
```

### 15.5 Alunos

```txt
alunos.visualizar
alunos.criar
alunos.editar
alunos.importar
alunos.inativar
alunos.vincular_ambiente
```

### 15.6 Usuários e Permissões

```txt
usuarios.visualizar
usuarios.criar
usuarios.editar
usuarios.bloquear
usuarios.vincular_grupo

grupos.visualizar
grupos.criar
grupos.editar
grupos.vincular_permissoes

permissoes.visualizar
permissoes.gerenciar
```

## 16. Telas Administrativas Necessárias

Criar as seguintes telas na área administrativa:

- Login administrativo
- Dashboard admin
- Listagem de ambientes
- Cadastro/Edição de ambiente
- Personalização visual do ambiente
- Gestão de ferramentas
- Vínculo de ferramentas por ambiente
- Gestão de novidades
- Vínculo de novidades por ambiente
- Gestão de aulas
- Vínculo de aulas por ambiente
- Gestão de alunos por ambiente
- Importação de alunos por CSV/XLSX
- Histórico de importações
- Erros de importação
- Gestão de usuários administrativos
- Gestão de grupos de acesso
- Gestão de permissões por grupo

## 17. Tela de Cadastro/Edição de Ambiente

A tela de criação e edição de ambiente deve ser dividida em seções.

### 17.1 Dados Gerais

Campos:

```txt
nome
slug
descricao
status
```

### 17.2 Identidade Visual

Campos:

```txt
logo_url
favicon_url
imagem_capa_url
imagem_login_url
cor_primaria
cor_secundaria
cor_fundo
cor_texto
cor_botao
cor_card
cor_borda
tema
```

### 17.3 Layout da Home

Campos/configurações:

```txt
ordem_das_secoes
secoes_visiveis
titulo_personalizado_das_secoes
modo_exibicao_por_secao
quantidade_de_itens_por_secao
```

Modos de exibição:

```txt
grid
lista
carrossel
destaque
```

### 17.4 Estilo dos Cards

Campos/configurações:

```txt
card_estilo
card_borda
card_tamanho
card_exibir_icone
card_exibir_imagem
card_sombra
```

Opções de estilo:

```txt
flat
sombra
borda
imagem
```

Opções de borda:

```txt
quadrado
levemente_arredondado
arredondado
pill
```

Opções de tamanho:

```txt
compacto
medio
grande
```

### 17.5 Preview

A tela de personalização do ambiente deve possuir um preview visual, mostrando como a home do ambiente ficará com:

- Cores selecionadas
- Logo
- Fundo
- Cards
- Ordem das seções
- Estilo de botões

## 18. Área do Aluno

Criar área do aluno com visualização baseada no ambiente ativo.

### 18.1 Fluxo

```txt
1. Aluno acessa a plataforma.
2. Sistema identifica o aluno pelo e-mail.
3. Sistema verifica ambientes vinculados ao aluno.
4. Se houver apenas um ambiente, entra diretamente nele.
5. Se houver mais de um ambiente, exibe seletor de ambiente.
6. Sistema carrega configurações visuais do ambiente.
7. Sistema exibe a home personalizada.
```

### 18.2 Home do Aluno

A home deve respeitar a configuração do ambiente.

Exibir conforme configuração:

- Banner
- Ferramentas
- Novidades
- Aulas
- Comunicados

A ordem das seções deve vir da configuração do ambiente.

Os cards devem respeitar:

- Cor
- Borda
- Tamanho
- Sombra
- Ícone
- Imagem
- Estilo visual

## 19. Regras de Exibição

### 19.1 Ferramentas

Uma ferramenta só aparece se:

```txt
ambiente.status = ativo
ferramentas.status = ativa
ambiente_ferramentas.status = ativo
```

### 19.2 Novidades

Uma novidade só aparece se:

```txt
ambiente.status = ativo
novidades.status = publicada
ambiente_novidades.status = ativo
```

### 19.3 Aulas

Uma aula só aparece se:

```txt
ambiente.status = ativo
aulas.status = publicada
ambiente_aulas.status = ativo
ambiente_aulas.liberado = true
data_liberacao <= data atual ou data_liberacao vazia
```

### 19.4 Aluno

O aluno só acessa se:

```txt
alunos.status = ativo
ambiente_alunos.status = ativo
ambientes.status = ativo
```

## 20. Logs e Auditoria

Criar tabela `logs_auditoria`.

Campos:

```txt
id
usuario_admin_id
ambiente_id
acao
entidade
entidade_id
dados_anteriores
dados_novos
ip
criado_em
```

Registrar logs para:

- Criação de ambiente
- Edição de ambiente
- Personalização visual de ambiente
- Importação de alunos
- Alteração de permissões
- Vínculo e remoção de alunos
- Vínculo e remoção de ferramentas
- Vínculo e remoção de aulas
- Publicação e arquivamento de novidades

## 21. Regras de Segurança

- Alunos não devem acessar área administrativa.
- Usuários admin não devem acessar ambientes não autorizados.
- A interface deve ocultar ações sem permissão.
- O backend/banco também deve validar permissões.
- Dados de alunos devem ser protegidos.
- Importações devem ser rastreáveis.
- Alterações críticas devem gerar logs.
- Exclusões devem ser preferencialmente lógicas.

## 22. Regras de Integridade

- Não permitir slug duplicado de ambiente.
- Não permitir e-mail duplicado de aluno.
- Não permitir e-mail duplicado de usuário admin.
- Não permitir vínculo duplicado entre ambiente e ferramenta.
- Não permitir vínculo duplicado entre ambiente e novidade.
- Não permitir vínculo duplicado entre ambiente e aula.
- Não permitir vínculo duplicado entre ambiente e aluno.
- Não permitir permissão duplicada no mesmo grupo.
- Não permitir chave de permissão duplicada.

## 23. Dados Mockados Iniciais

Criar dados mockados para validação inicial.

### 23.1 Ambiente 1

```txt
Nome: Ecorodovias
Slug: ecorodovias
Tema: personalizado
Cor primária: verde
Cor secundária: azul
Cards: arredondados com sombra
Seções:
1. Banner
2. Ferramentas
3. Aulas
4. Novidades
```

### 23.2 Ambiente 2

```txt
Nome: SPTech Demo
Slug: sptech-demo
Tema: claro
Cor primária: azul
Cor secundária: cinza
Cards: flat com borda levemente arredondada
Seções:
1. Banner
2. Novidades
3. Ferramentas
4. Aulas
```

### 23.3 Usuário Admin Inicial

```txt
Nome: Super Admin
E-mail: admin@sptech.com
Grupo: Super Admin
Acesso: Global
```

### 23.4 Alunos Mockados

```txt
Aluno 1:
Nome Completo: João Silva
E-mail de Acesso: joao@email.com
WhatsApp: 11999999999
Ambiente: Ecorodovias

Aluno 2:
Nome Completo: Maria Souza
E-mail de Acesso: maria@email.com
WhatsApp: 11988888888
Ambiente: SPTech Demo
```

## 24. Prioridade de Desenvolvimento

### 24.1 Fase 1 — Banco e Estrutura Base

- Criar tabelas principais
- Criar relacionamentos
- Criar constraints
- Criar dados mockados
- Criar autenticação inicial

### 24.2 Fase 2 — Área Admin

- Dashboard admin
- CRUD de ambientes
- Personalização visual do ambiente
- CRUD de ferramentas
- CRUD de novidades
- CRUD de aulas
- Gestão de vínculos por ambiente

### 24.3 Fase 3 — Alunos e Importação

- Cadastro de alunos
- Vínculo de alunos por ambiente
- Importação CSV/XLSX
- Histórico de importações
- Tratamento de erros

### 24.4 Fase 4 — Permissões

- Usuários admin
- Grupos de acesso
- Permissões por grupo
- Acesso global ou por ambiente

### 24.5 Fase 5 — Área do Aluno

- Login do aluno
- Seleção de ambiente
- Home personalizada por ambiente
- Ferramentas
- Novidades
- Aulas

## 25. Diretrizes de UI/UX

A interface deve ser:

- Moderna
- Responsiva
- Clara
- Modular
- Fácil de administrar
- Preparada para múltiplas identidades visuais

### 25.1 Área Admin

A área admin pode seguir uma identidade visual padrão da SPTech.

Deve conter:

- Menu lateral
- Header superior
- Cards de resumo
- Tabelas administrativas
- Formulários organizados por seções
- Filtros e busca
- Modais de confirmação
- Feedback visual para ações

### 25.2 Área do Aluno

A área do aluno deve respeitar o white label do ambiente.

Deve ser:

- Visualmente personalizada
- Simples de navegar
- Focada em acesso rápido às ferramentas
- Focada em novidades e aulas do ambiente
- Totalmente responsiva

## 26. Orientação Final

Desenvolver o Projeto SPTech como uma plataforma multiambiente e white label.

Não construir a aplicação como uma home única e fixa.

A home deve ser dinâmica e baseada no ambiente ativo.

Cada ambiente deve conseguir ter sua própria identidade visual, incluindo cores, logotipo, fundo, layout, ordem das seções e formato dos cards.

A modelagem do banco deve garantir que ferramentas, novidades, aulas e alunos sejam vinculados aos ambientes.

A área administrativa deve permitir controle completo dos ambientes, permissões, usuários, conteúdos e personalização visual.

A área do aluno deve carregar tudo de forma dinâmica conforme o ambiente ao qual o aluno pertence.
