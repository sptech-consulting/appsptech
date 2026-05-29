CREATE TABLE `ambiente_alunos` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ambiente_id` char(36) NOT NULL,
	`aluno_id` char(36) NOT NULL,
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`origem` text,
	`importacao_id` char(36),
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.914',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.914',
	CONSTRAINT `ambiente_alunos_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_amb_aluno` UNIQUE(`ambiente_id`,`aluno_id`)
);
--> statement-breakpoint
CREATE TABLE `ambiente_aulas` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ambiente_id` char(36) NOT NULL,
	`aula_id` char(36) NOT NULL,
	`ordem` int DEFAULT 0,
	`modulo_ordem` int DEFAULT 0,
	`liberado` boolean DEFAULT true,
	`data_liberacao` datetime(3),
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.913',
	CONSTRAINT `ambiente_aulas_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_amb_aula` UNIQUE(`ambiente_id`,`aula_id`)
);
--> statement-breakpoint
CREATE TABLE `ambiente_cursos` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ambiente_id` char(36) NOT NULL,
	`curso_id` char(36) NOT NULL,
	`ordem` int NOT NULL DEFAULT 0,
	`destaque` boolean DEFAULT false,
	`liberado` boolean DEFAULT true,
	`data_liberacao` datetime(3),
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.914',
	CONSTRAINT `ambiente_cursos_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_amb_curso` UNIQUE(`ambiente_id`,`curso_id`)
);
--> statement-breakpoint
CREATE TABLE `ambiente_ferramentas` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ambiente_id` char(36) NOT NULL,
	`ferramenta_id` char(36) NOT NULL,
	`ordem` int DEFAULT 0,
	`destaque` boolean DEFAULT false,
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.913',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.913',
	CONSTRAINT `ambiente_ferramentas_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_amb_ferr` UNIQUE(`ambiente_id`,`ferramenta_id`)
);
--> statement-breakpoint
CREATE TABLE `ambiente_novidades` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ambiente_id` char(36) NOT NULL,
	`novidade_id` char(36) NOT NULL,
	`destaque` boolean DEFAULT false,
	`ordem` int DEFAULT 0,
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.913',
	CONSTRAINT `ambiente_novidades_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_amb_nov` UNIQUE(`ambiente_id`,`novidade_id`)
);
--> statement-breakpoint
CREATE TABLE `ambientes` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`nome` text NOT NULL,
	`slug` varchar(255) NOT NULL,
	`descricao` text,
	`status` enum('ativo','inativo','rascunho','arquivado') NOT NULL DEFAULT 'rascunho',
	`logo_url` text,
	`favicon_url` text,
	`imagem_capa_url` text,
	`imagem_login_url` text,
	`cor_primaria` varchar(20) DEFAULT '#ED145B',
	`cor_secundaria` varchar(20) DEFAULT '#1F2A44',
	`cor_fundo` varchar(20) DEFAULT '#FFFFFF',
	`cor_texto` varchar(20) DEFAULT '#1F2A44',
	`cor_botao` varchar(20) DEFAULT '#ED145B',
	`cor_card` varchar(20) DEFAULT '#FFFFFF',
	`cor_borda` varchar(20) DEFAULT '#D0D3D4',
	`tema` enum('claro','escuro','personalizado') NOT NULL DEFAULT 'claro',
	`layout_home` json DEFAULT ('{}'),
	`card_estilo` enum('flat','sombra','borda','imagem') DEFAULT 'sombra',
	`card_borda` enum('quadrado','levemente_arredondado','arredondado','pill') DEFAULT 'arredondado',
	`card_tamanho` enum('compacto','medio','grande') DEFAULT 'medio',
	`card_exibir_icone` boolean DEFAULT true,
	`card_exibir_imagem` boolean DEFAULT true,
	`card_sombra` boolean DEFAULT true,
	`efeito_card_tilt_3d` boolean NOT NULL DEFAULT false,
	`efeito_card_glow` boolean NOT NULL DEFAULT false,
	`efeito_card_scale` boolean NOT NULL DEFAULT false,
	`efeito_botao_lift` boolean NOT NULL DEFAULT false,
	`efeito_entrada_animada` boolean NOT NULL DEFAULT false,
	`efeito_som_hover` boolean NOT NULL DEFAULT false,
	`efeito_som_volume` int NOT NULL DEFAULT 40,
	`efeito_blobs_fundo` boolean NOT NULL DEFAULT false,
	`webhook_token` varchar(255),
	`codigo_acesso_resultados` varchar(50),
	`playbook_titulo` text,
	`playbook_descricao` text,
	`playbook_capa_url` text,
	`playbook_arquivo_url` text,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.911',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.911',
	`criado_por` char(36),
	CONSTRAINT `ambientes_id` PRIMARY KEY(`id`),
	CONSTRAINT `ambientes_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `ambientes_webhook_token_unique` UNIQUE(`webhook_token`),
	CONSTRAINT `ambientes_codigo_acesso_resultados_unique` UNIQUE(`codigo_acesso_resultados`)
);
--> statement-breakpoint
CREATE TABLE `alunos` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`nome_completo` text NOT NULL,
	`email_acesso` varchar(320) NOT NULL,
	`senha_hash` text,
	`whatsapp` varchar(20),
	`status` enum('ativo','inativo','bloqueado') NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.923',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.923',
	CONSTRAINT `alunos_id` PRIMARY KEY(`id`),
	CONSTRAINT `alunos_email_acesso_unique` UNIQUE(`email_acesso`)
);
--> statement-breakpoint
CREATE TABLE `importacoes_alunos` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ambiente_id` char(36) NOT NULL,
	`arquivo_nome` text,
	`arquivo_url` text,
	`tipo_arquivo` enum('csv','xlsx'),
	`total_linhas` int DEFAULT 0,
	`total_importados` int DEFAULT 0,
	`total_atualizados` int DEFAULT 0,
	`total_erros` int DEFAULT 0,
	`status` enum('pendente','processando','concluida','com_erros','falhou') NOT NULL DEFAULT 'pendente',
	`criado_por` char(36),
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.923',
	`finalizado_em` datetime(3),
	CONSTRAINT `importacoes_alunos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `importacoes_alunos_erros` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`importacao_id` char(36) NOT NULL,
	`numero_linha` int,
	`nome_completo` text,
	`email_acesso` varchar(320),
	`whatsapp` varchar(20),
	`erro` text,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.923',
	CONSTRAINT `importacoes_alunos_erros_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grupo_permissoes` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`grupo_id` char(36) NOT NULL,
	`permissao_id` char(36) NOT NULL,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.934',
	CONSTRAINT `grupo_permissoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_grupo_perm` UNIQUE(`grupo_id`,`permissao_id`)
);
--> statement-breakpoint
CREATE TABLE `grupos_acesso` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`escopo` enum('global','ambiente') NOT NULL DEFAULT 'ambiente',
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.933',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.933',
	CONSTRAINT `grupos_acesso_id` PRIMARY KEY(`id`),
	CONSTRAINT `grupos_acesso_nome_unique` UNIQUE(`nome`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`token_hash` varchar(64) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`tipo_usuario` enum('admin','aluno') NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`used_at` datetime(3),
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.934',
	CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `password_reset_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `permissoes` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`chave` varchar(100) NOT NULL,
	`modulo` varchar(100) NOT NULL,
	`descricao` text,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.934',
	CONSTRAINT `permissoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `permissoes_chave_unique` UNIQUE(`chave`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`token_hash` varchar(64) NOT NULL,
	`usuario_id` char(36) NOT NULL,
	`tipo_usuario` enum('admin','aluno') NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`revoked_at` datetime(3),
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.934',
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `refresh_tokens_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `usuarios_admin` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`nome` text NOT NULL,
	`email` varchar(320) NOT NULL,
	`senha_hash` text,
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.933',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.933',
	`ultimo_acesso_em` datetime(3),
	CONSTRAINT `usuarios_admin_id` PRIMARY KEY(`id`),
	CONSTRAINT `usuarios_admin_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `usuarios_admin_grupos` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`usuario_admin_id` char(36) NOT NULL,
	`grupo_id` char(36) NOT NULL,
	`ambiente_id` char(36),
	`acesso_global` boolean DEFAULT false,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.934',
	CONSTRAINT `usuarios_admin_grupos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aulas` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`titulo` text NOT NULL,
	`descricao` text,
	`video_url` text,
	`material_url` text,
	`thumbnail_url` text,
	`duracao_minutos` int,
	`tipo_conteudo` enum('video','texto','pdf','link','misto') DEFAULT 'video',
	`status` enum('rascunho','publicada','arquivada') NOT NULL DEFAULT 'rascunho',
	`modulo_id` char(36),
	`ordem` int NOT NULL DEFAULT 0,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.942',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.942',
	`criado_por` char(36),
	CONSTRAINT `aulas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cursos` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`titulo` text NOT NULL,
	`descricao` text,
	`capa_url` text,
	`categoria` text,
	`carga_horaria_minutos` int,
	`nivel` text,
	`status` enum('rascunho','publicada','arquivada') NOT NULL DEFAULT 'rascunho',
	`criado_por` char(36),
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.942',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.942',
	CONSTRAINT `cursos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modulos` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`curso_id` char(36) NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.942',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.942',
	CONSTRAINT `modulos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ferramenta_blocos` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ferramenta_id` char(36) NOT NULL,
	`titulo` text NOT NULL,
	`conteudo` text NOT NULL,
	`ordem` int NOT NULL DEFAULT 0,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.953',
	CONSTRAINT `ferramenta_blocos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ferramenta_casos_teste` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ferramenta_id` char(36) NOT NULL,
	`titulo` text NOT NULL,
	`badge` text,
	`prompt_exemplo` text,
	`explicacao` text,
	`ordem` int NOT NULL DEFAULT 0,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.953',
	CONSTRAINT `ferramenta_casos_teste_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ferramenta_casos_uso` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ferramenta_id` char(36) NOT NULL,
	`texto` text NOT NULL,
	`ordem` int NOT NULL DEFAULT 0,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.952',
	CONSTRAINT `ferramenta_casos_uso_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ferramenta_funcionalidades` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ferramenta_id` char(36) NOT NULL,
	`titulo` text NOT NULL,
	`descricao` text,
	`imagem_url` text,
	`ordem` int NOT NULL DEFAULT 0,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.953',
	CONSTRAINT `ferramenta_funcionalidades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ferramenta_tags` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ferramenta_id` char(36) NOT NULL,
	`tipo` enum('input','output','integracao') NOT NULL,
	`rotulo` text NOT NULL,
	`ordem` int NOT NULL DEFAULT 0,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.952',
	CONSTRAINT `ferramenta_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ferramentas` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`nome` text NOT NULL,
	`subtitulo` text,
	`descricao` text,
	`descricao_longa` text,
	`url` text,
	`icone_url` text,
	`imagem_capa_url` text,
	`frase_destaque` text,
	`categoria` text,
	`tipo_abertura` enum('nova_aba','mesma_aba','modal') DEFAULT 'nova_aba',
	`status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.952',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.952',
	`criado_por` char(36),
	CONSTRAINT `ferramentas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `novidades` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ambiente_id` char(36) NOT NULL,
	`titulo` text NOT NULL,
	`resumo` text,
	`conteudo` text,
	`imagem_url` text,
	`fonte_nome` text,
	`fonte_url` text,
	`categoria` text,
	`tags` json DEFAULT ('[]'),
	`publicado_em` datetime(3),
	`status` enum('rascunho','publicada','arquivada') NOT NULL DEFAULT 'rascunho',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.961',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.961',
	`criado_por` char(36),
	CONSTRAINT `novidades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trabalho_funcionalidades` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`trabalho_id` char(36) NOT NULL,
	`ordem` int NOT NULL DEFAULT 0,
	`titulo` text NOT NULL,
	`descricao` text,
	`imagem_url` text,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.973',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.973',
	CONSTRAINT `trabalho_funcionalidades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trabalho_links` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`trabalho_id` char(36) NOT NULL,
	`ordem` int NOT NULL DEFAULT 0,
	`rotulo` text NOT NULL,
	`url` text NOT NULL,
	`icone_url` text,
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.973',
	CONSTRAINT `trabalho_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trabalhos` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`ambiente_id` char(36) NOT NULL,
	`titulo` text NOT NULL,
	`subtitulo` text,
	`resumo` text,
	`conteudo` text,
	`autor_nome` text NOT NULL,
	`turma` text,
	`imagem_capa_url` text,
	`link_externo` text,
	`tags` json DEFAULT ('[]'),
	`status` enum('rascunho','publicada','arquivada') NOT NULL DEFAULT 'rascunho',
	`destaque` boolean NOT NULL DEFAULT false,
	`ordem` int NOT NULL DEFAULT 0,
	`publicado_em` datetime(3),
	`visualizacoes` int NOT NULL DEFAULT 0,
	`apresentacao_tipo` enum('video','pptx','imagem','documento','link'),
	`apresentacao_url` text,
	`apresentacao_titulo` text,
	`apresentacao_descricao` text,
	`apresentacao_imagem_url` text,
	`aplicacao_expectativa` text,
	`criado_por` char(36),
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.973',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.973',
	CONSTRAINT `trabalhos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aula_comentario_curtidas` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`comentario_id` char(36) NOT NULL,
	`aluno_id` char(36),
	`usuario_admin_id` char(36),
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.981',
	CONSTRAINT `aula_comentario_curtidas_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_aluno_curtida` UNIQUE(`comentario_id`,`aluno_id`),
	CONSTRAINT `uniq_admin_curtida` UNIQUE(`comentario_id`,`usuario_admin_id`)
);
--> statement-breakpoint
CREATE TABLE `aula_comentarios` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`aula_id` char(36) NOT NULL,
	`ambiente_id` char(36) NOT NULL,
	`aluno_id` char(36),
	`usuario_admin_id` char(36),
	`parent_id` char(36),
	`conteudo` varchar(4000) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'ativo',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.980',
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.980',
	CONSTRAINT `aula_comentarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aluno_aula_progresso` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`aluno_id` char(36) NOT NULL,
	`aula_id` char(36) NOT NULL,
	`concluida` char(1) NOT NULL DEFAULT '0',
	`concluida_em` datetime(3),
	`segundos_assistidos` int NOT NULL DEFAULT 0,
	`atualizado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.981',
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.981',
	CONSTRAINT `aluno_aula_progresso_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_aluno_aula` UNIQUE(`aluno_id`,`aula_id`)
);
--> statement-breakpoint
CREATE TABLE `logs_auditoria` (
	`id` char(36) NOT NULL DEFAULT '(UUID())',
	`usuario_admin_id` char(36),
	`ambiente_id` char(36),
	`acao` text NOT NULL,
	`entidade` text,
	`entidade_id` char(36),
	`dados_anteriores` json,
	`dados_novos` json,
	`ip` varchar(45),
	`criado_em` datetime(3) NOT NULL DEFAULT '2026-05-29 12:57:40.989',
	CONSTRAINT `logs_auditoria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_ambiente_cursos_amb` ON `ambiente_cursos` (`ambiente_id`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_ambientes_status` ON `ambientes` (`status`);--> statement-breakpoint
CREATE INDEX `idx_aulas_modulo` ON `aulas` (`modulo_id`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_modulos_curso` ON `modulos` (`curso_id`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_fb_ferramenta` ON `ferramenta_blocos` (`ferramenta_id`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_fct_ferramenta` ON `ferramenta_casos_teste` (`ferramenta_id`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_fcu_ferramenta` ON `ferramenta_casos_uso` (`ferramenta_id`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_ff_ferramenta` ON `ferramenta_funcionalidades` (`ferramenta_id`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_ft_ferramenta` ON `ferramenta_tags` (`ferramenta_id`,`tipo`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_novidades_ambiente` ON `novidades` (`ambiente_id`);--> statement-breakpoint
CREATE INDEX `idx_trabalho_func_trab` ON `trabalho_funcionalidades` (`trabalho_id`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_trabalho_links_trab` ON `trabalho_links` (`trabalho_id`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_trabalhos_ambiente` ON `trabalhos` (`ambiente_id`,`status`,`ordem`);--> statement-breakpoint
CREATE INDEX `idx_aula_coment_aula` ON `aula_comentarios` (`aula_id`,`criado_em`);--> statement-breakpoint
CREATE INDEX `idx_aula_coment_parent` ON `aula_comentarios` (`parent_id`);