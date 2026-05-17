export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aluno_aula_progresso: {
        Row: {
          aluno_id: string
          atualizado_em: string
          aula_id: string
          concluida: boolean
          concluida_em: string | null
          criado_em: string
          id: string
          segundos_assistidos: number
        }
        Insert: {
          aluno_id: string
          atualizado_em?: string
          aula_id: string
          concluida?: boolean
          concluida_em?: string | null
          criado_em?: string
          id?: string
          segundos_assistidos?: number
        }
        Update: {
          aluno_id?: string
          atualizado_em?: string
          aula_id?: string
          concluida?: boolean
          concluida_em?: string | null
          criado_em?: string
          id?: string
          segundos_assistidos?: number
        }
        Relationships: []
      }
      alunos: {
        Row: {
          atualizado_em: string
          auth_user_id: string | null
          criado_em: string
          email_acesso: string
          id: string
          nome_completo: string
          status: Database["public"]["Enums"]["aluno_status"]
          whatsapp: string | null
        }
        Insert: {
          atualizado_em?: string
          auth_user_id?: string | null
          criado_em?: string
          email_acesso: string
          id?: string
          nome_completo: string
          status?: Database["public"]["Enums"]["aluno_status"]
          whatsapp?: string | null
        }
        Update: {
          atualizado_em?: string
          auth_user_id?: string | null
          criado_em?: string
          email_acesso?: string
          id?: string
          nome_completo?: string
          status?: Database["public"]["Enums"]["aluno_status"]
          whatsapp?: string | null
        }
        Relationships: []
      }
      ambiente_alunos: {
        Row: {
          aluno_id: string
          ambiente_id: string
          atualizado_em: string
          criado_em: string
          id: string
          importacao_id: string | null
          origem: string | null
          status: Database["public"]["Enums"]["generic_status"]
        }
        Insert: {
          aluno_id: string
          ambiente_id: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          importacao_id?: string | null
          origem?: string | null
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Update: {
          aluno_id?: string
          ambiente_id?: string
          atualizado_em?: string
          criado_em?: string
          id?: string
          importacao_id?: string | null
          origem?: string | null
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ambiente_alunos_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambiente_alunos_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_aa_importacao"
            columns: ["importacao_id"]
            isOneToOne: false
            referencedRelation: "importacoes_alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      ambiente_aulas: {
        Row: {
          ambiente_id: string
          aula_id: string
          criado_em: string
          data_liberacao: string | null
          id: string
          liberado: boolean | null
          modulo_ordem: number | null
          ordem: number | null
          status: Database["public"]["Enums"]["generic_status"]
        }
        Insert: {
          ambiente_id: string
          aula_id: string
          criado_em?: string
          data_liberacao?: string | null
          id?: string
          liberado?: boolean | null
          modulo_ordem?: number | null
          ordem?: number | null
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Update: {
          ambiente_id?: string
          aula_id?: string
          criado_em?: string
          data_liberacao?: string | null
          id?: string
          liberado?: boolean | null
          modulo_ordem?: number | null
          ordem?: number | null
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ambiente_aulas_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambiente_aulas_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      ambiente_cursos: {
        Row: {
          ambiente_id: string
          criado_em: string
          curso_id: string
          data_liberacao: string | null
          destaque: boolean | null
          id: string
          liberado: boolean | null
          ordem: number
          status: Database["public"]["Enums"]["generic_status"]
        }
        Insert: {
          ambiente_id: string
          criado_em?: string
          curso_id: string
          data_liberacao?: string | null
          destaque?: boolean | null
          id?: string
          liberado?: boolean | null
          ordem?: number
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Update: {
          ambiente_id?: string
          criado_em?: string
          curso_id?: string
          data_liberacao?: string | null
          destaque?: boolean | null
          id?: string
          liberado?: boolean | null
          ordem?: number
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ambiente_cursos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      ambiente_ferramentas: {
        Row: {
          ambiente_id: string
          atualizado_em: string
          criado_em: string
          destaque: boolean | null
          ferramenta_id: string
          id: string
          ordem: number | null
          status: Database["public"]["Enums"]["generic_status"]
        }
        Insert: {
          ambiente_id: string
          atualizado_em?: string
          criado_em?: string
          destaque?: boolean | null
          ferramenta_id: string
          id?: string
          ordem?: number | null
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Update: {
          ambiente_id?: string
          atualizado_em?: string
          criado_em?: string
          destaque?: boolean | null
          ferramenta_id?: string
          id?: string
          ordem?: number | null
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ambiente_ferramentas_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambiente_ferramentas_ferramenta_id_fkey"
            columns: ["ferramenta_id"]
            isOneToOne: false
            referencedRelation: "ferramentas"
            referencedColumns: ["id"]
          },
        ]
      }
      ambiente_novidades: {
        Row: {
          ambiente_id: string
          criado_em: string
          destaque: boolean | null
          id: string
          novidade_id: string
          ordem: number | null
          status: Database["public"]["Enums"]["generic_status"]
        }
        Insert: {
          ambiente_id: string
          criado_em?: string
          destaque?: boolean | null
          id?: string
          novidade_id: string
          ordem?: number | null
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Update: {
          ambiente_id?: string
          criado_em?: string
          destaque?: boolean | null
          id?: string
          novidade_id?: string
          ordem?: number | null
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ambiente_novidades_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ambiente_novidades_novidade_id_fkey"
            columns: ["novidade_id"]
            isOneToOne: false
            referencedRelation: "novidades"
            referencedColumns: ["id"]
          },
        ]
      }
      ambientes: {
        Row: {
          atualizado_em: string
          card_borda: Database["public"]["Enums"]["card_borda_t"] | null
          card_estilo: Database["public"]["Enums"]["card_estilo_t"] | null
          card_exibir_icone: boolean | null
          card_exibir_imagem: boolean | null
          card_sombra: boolean | null
          card_tamanho: Database["public"]["Enums"]["card_tamanho_t"] | null
          cor_borda: string | null
          cor_botao: string | null
          cor_card: string | null
          cor_fundo: string | null
          cor_primaria: string | null
          cor_secundaria: string | null
          cor_texto: string | null
          criado_em: string
          criado_por: string | null
          descricao: string | null
          efeito_blobs_fundo: boolean
          efeito_botao_lift: boolean
          efeito_card_glow: boolean
          efeito_card_scale: boolean
          efeito_card_tilt_3d: boolean
          efeito_entrada_animada: boolean
          efeito_som_hover: boolean
          efeito_som_volume: number
          favicon_url: string | null
          id: string
          imagem_capa_url: string | null
          imagem_login_url: string | null
          layout_home: Json | null
          logo_url: string | null
          nome: string
          slug: string
          status: Database["public"]["Enums"]["ambiente_status"]
          tema: Database["public"]["Enums"]["ambiente_tema"]
        }
        Insert: {
          atualizado_em?: string
          card_borda?: Database["public"]["Enums"]["card_borda_t"] | null
          card_estilo?: Database["public"]["Enums"]["card_estilo_t"] | null
          card_exibir_icone?: boolean | null
          card_exibir_imagem?: boolean | null
          card_sombra?: boolean | null
          card_tamanho?: Database["public"]["Enums"]["card_tamanho_t"] | null
          cor_borda?: string | null
          cor_botao?: string | null
          cor_card?: string | null
          cor_fundo?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          cor_texto?: string | null
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          efeito_blobs_fundo?: boolean
          efeito_botao_lift?: boolean
          efeito_card_glow?: boolean
          efeito_card_scale?: boolean
          efeito_card_tilt_3d?: boolean
          efeito_entrada_animada?: boolean
          efeito_som_hover?: boolean
          efeito_som_volume?: number
          favicon_url?: string | null
          id?: string
          imagem_capa_url?: string | null
          imagem_login_url?: string | null
          layout_home?: Json | null
          logo_url?: string | null
          nome: string
          slug: string
          status?: Database["public"]["Enums"]["ambiente_status"]
          tema?: Database["public"]["Enums"]["ambiente_tema"]
        }
        Update: {
          atualizado_em?: string
          card_borda?: Database["public"]["Enums"]["card_borda_t"] | null
          card_estilo?: Database["public"]["Enums"]["card_estilo_t"] | null
          card_exibir_icone?: boolean | null
          card_exibir_imagem?: boolean | null
          card_sombra?: boolean | null
          card_tamanho?: Database["public"]["Enums"]["card_tamanho_t"] | null
          cor_borda?: string | null
          cor_botao?: string | null
          cor_card?: string | null
          cor_fundo?: string | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          cor_texto?: string | null
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          efeito_blobs_fundo?: boolean
          efeito_botao_lift?: boolean
          efeito_card_glow?: boolean
          efeito_card_scale?: boolean
          efeito_card_tilt_3d?: boolean
          efeito_entrada_animada?: boolean
          efeito_som_hover?: boolean
          efeito_som_volume?: number
          favicon_url?: string | null
          id?: string
          imagem_capa_url?: string | null
          imagem_login_url?: string | null
          layout_home?: Json | null
          logo_url?: string | null
          nome?: string
          slug?: string
          status?: Database["public"]["Enums"]["ambiente_status"]
          tema?: Database["public"]["Enums"]["ambiente_tema"]
        }
        Relationships: []
      }
      aula_comentario_curtidas: {
        Row: {
          aluno_id: string | null
          comentario_id: string
          criado_em: string
          id: string
          usuario_admin_id: string | null
        }
        Insert: {
          aluno_id?: string | null
          comentario_id: string
          criado_em?: string
          id?: string
          usuario_admin_id?: string | null
        }
        Update: {
          aluno_id?: string | null
          comentario_id?: string
          criado_em?: string
          id?: string
          usuario_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aula_comentario_curtidas_comentario_id_fkey"
            columns: ["comentario_id"]
            isOneToOne: false
            referencedRelation: "aula_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      aula_comentarios: {
        Row: {
          aluno_id: string | null
          ambiente_id: string
          atualizado_em: string
          aula_id: string
          conteudo: string
          criado_em: string
          id: string
          parent_id: string | null
          status: string
          usuario_admin_id: string | null
        }
        Insert: {
          aluno_id?: string | null
          ambiente_id: string
          atualizado_em?: string
          aula_id: string
          conteudo: string
          criado_em?: string
          id?: string
          parent_id?: string | null
          status?: string
          usuario_admin_id?: string | null
        }
        Update: {
          aluno_id?: string | null
          ambiente_id?: string
          atualizado_em?: string
          aula_id?: string
          conteudo?: string
          criado_em?: string
          id?: string
          parent_id?: string | null
          status?: string
          usuario_admin_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aula_comentarios_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "aula_comentarios"
            referencedColumns: ["id"]
          },
        ]
      }
      aulas: {
        Row: {
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          descricao: string | null
          duracao_minutos: number | null
          id: string
          material_url: string | null
          modulo: string | null
          modulo_id: string | null
          ordem: number
          status: Database["public"]["Enums"]["publicacao_status"]
          thumbnail_url: string | null
          tipo_conteudo: Database["public"]["Enums"]["aula_tipo"] | null
          titulo: string
          video_url: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          material_url?: string | null
          modulo?: string | null
          modulo_id?: string | null
          ordem?: number
          status?: Database["public"]["Enums"]["publicacao_status"]
          thumbnail_url?: string | null
          tipo_conteudo?: Database["public"]["Enums"]["aula_tipo"] | null
          titulo: string
          video_url?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          material_url?: string | null
          modulo?: string | null
          modulo_id?: string | null
          ordem?: number
          status?: Database["public"]["Enums"]["publicacao_status"]
          thumbnail_url?: string | null
          tipo_conteudo?: Database["public"]["Enums"]["aula_tipo"] | null
          titulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_ambiente: {
        Row: {
          ambiente_id: string
          atualizado_em: string
          chave: string
          criado_em: string
          id: string
          valor: Json
        }
        Insert: {
          ambiente_id: string
          atualizado_em?: string
          chave: string
          criado_em?: string
          id?: string
          valor?: Json
        }
        Update: {
          ambiente_id?: string
          atualizado_em?: string
          chave?: string
          criado_em?: string
          id?: string
          valor?: Json
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_ambiente_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cursos: {
        Row: {
          atualizado_em: string
          capa_url: string | null
          carga_horaria_minutos: number | null
          categoria: string | null
          criado_em: string
          criado_por: string | null
          descricao: string | null
          id: string
          nivel: string | null
          status: Database["public"]["Enums"]["publicacao_status"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          capa_url?: string | null
          carga_horaria_minutos?: number | null
          categoria?: string | null
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nivel?: string | null
          status?: Database["public"]["Enums"]["publicacao_status"]
          titulo: string
        }
        Update: {
          atualizado_em?: string
          capa_url?: string | null
          carga_horaria_minutos?: number | null
          categoria?: string | null
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          id?: string
          nivel?: string | null
          status?: Database["public"]["Enums"]["publicacao_status"]
          titulo?: string
        }
        Relationships: []
      }
      ferramentas: {
        Row: {
          atualizado_em: string
          categoria: string | null
          criado_em: string
          criado_por: string | null
          descricao: string | null
          icone_url: string | null
          id: string
          nome: string
          status: Database["public"]["Enums"]["generic_status"]
          tipo_abertura:
            | Database["public"]["Enums"]["ferramenta_abertura"]
            | null
          url: string | null
        }
        Insert: {
          atualizado_em?: string
          categoria?: string | null
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          icone_url?: string | null
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["generic_status"]
          tipo_abertura?:
            | Database["public"]["Enums"]["ferramenta_abertura"]
            | null
          url?: string | null
        }
        Update: {
          atualizado_em?: string
          categoria?: string | null
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          icone_url?: string | null
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["generic_status"]
          tipo_abertura?:
            | Database["public"]["Enums"]["ferramenta_abertura"]
            | null
          url?: string | null
        }
        Relationships: []
      }
      grupo_permissoes: {
        Row: {
          criado_em: string
          grupo_id: string
          id: string
          permissao_id: string
        }
        Insert: {
          criado_em?: string
          grupo_id: string
          id?: string
          permissao_id: string
        }
        Update: {
          criado_em?: string
          grupo_id?: string
          id?: string
          permissao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_permissoes_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_acesso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_permissoes_permissao_id_fkey"
            columns: ["permissao_id"]
            isOneToOne: false
            referencedRelation: "permissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_acesso: {
        Row: {
          atualizado_em: string
          criado_em: string
          descricao: string | null
          escopo: Database["public"]["Enums"]["grupo_escopo"]
          id: string
          nome: string
          status: Database["public"]["Enums"]["generic_status"]
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          escopo?: Database["public"]["Enums"]["grupo_escopo"]
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          escopo?: Database["public"]["Enums"]["grupo_escopo"]
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["generic_status"]
        }
        Relationships: []
      }
      importacoes_alunos: {
        Row: {
          ambiente_id: string
          arquivo_nome: string | null
          arquivo_url: string | null
          criado_em: string
          criado_por: string | null
          finalizado_em: string | null
          id: string
          status: Database["public"]["Enums"]["importacao_status"]
          tipo_arquivo: Database["public"]["Enums"]["importacao_tipo"] | null
          total_atualizados: number | null
          total_erros: number | null
          total_importados: number | null
          total_linhas: number | null
        }
        Insert: {
          ambiente_id: string
          arquivo_nome?: string | null
          arquivo_url?: string | null
          criado_em?: string
          criado_por?: string | null
          finalizado_em?: string | null
          id?: string
          status?: Database["public"]["Enums"]["importacao_status"]
          tipo_arquivo?: Database["public"]["Enums"]["importacao_tipo"] | null
          total_atualizados?: number | null
          total_erros?: number | null
          total_importados?: number | null
          total_linhas?: number | null
        }
        Update: {
          ambiente_id?: string
          arquivo_nome?: string | null
          arquivo_url?: string | null
          criado_em?: string
          criado_por?: string | null
          finalizado_em?: string | null
          id?: string
          status?: Database["public"]["Enums"]["importacao_status"]
          tipo_arquivo?: Database["public"]["Enums"]["importacao_tipo"] | null
          total_atualizados?: number | null
          total_erros?: number | null
          total_importados?: number | null
          total_linhas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "importacoes_alunos_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes"
            referencedColumns: ["id"]
          },
        ]
      }
      importacoes_alunos_erros: {
        Row: {
          criado_em: string
          email_acesso: string | null
          erro: string | null
          id: string
          importacao_id: string
          nome_completo: string | null
          numero_linha: number | null
          whatsapp: string | null
        }
        Insert: {
          criado_em?: string
          email_acesso?: string | null
          erro?: string | null
          id?: string
          importacao_id: string
          nome_completo?: string | null
          numero_linha?: number | null
          whatsapp?: string | null
        }
        Update: {
          criado_em?: string
          email_acesso?: string | null
          erro?: string | null
          id?: string
          importacao_id?: string
          nome_completo?: string | null
          numero_linha?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "importacoes_alunos_erros_importacao_id_fkey"
            columns: ["importacao_id"]
            isOneToOne: false
            referencedRelation: "importacoes_alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      logs_auditoria: {
        Row: {
          acao: string
          ambiente_id: string | null
          criado_em: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          entidade: string | null
          entidade_id: string | null
          id: string
          ip: string | null
          usuario_admin_id: string | null
        }
        Insert: {
          acao: string
          ambiente_id?: string | null
          criado_em?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          ip?: string | null
          usuario_admin_id?: string | null
        }
        Update: {
          acao?: string
          ambiente_id?: string | null
          criado_em?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          ip?: string | null
          usuario_admin_id?: string | null
        }
        Relationships: []
      }
      modulos: {
        Row: {
          atualizado_em: string
          criado_em: string
          curso_id: string
          descricao: string | null
          id: string
          ordem: number
          status: Database["public"]["Enums"]["generic_status"]
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          curso_id: string
          descricao?: string | null
          id?: string
          ordem?: number
          status?: Database["public"]["Enums"]["generic_status"]
          titulo: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          curso_id?: string
          descricao?: string | null
          id?: string
          ordem?: number
          status?: Database["public"]["Enums"]["generic_status"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modulos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      novidades: {
        Row: {
          atualizado_em: string
          categoria: string | null
          conteudo: string | null
          criado_em: string
          criado_por: string | null
          fonte_nome: string | null
          fonte_url: string | null
          id: string
          imagem_url: string | null
          publicado_em: string | null
          resumo: string | null
          status: Database["public"]["Enums"]["publicacao_status"]
          tags: string[] | null
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          categoria?: string | null
          conteudo?: string | null
          criado_em?: string
          criado_por?: string | null
          fonte_nome?: string | null
          fonte_url?: string | null
          id?: string
          imagem_url?: string | null
          publicado_em?: string | null
          resumo?: string | null
          status?: Database["public"]["Enums"]["publicacao_status"]
          tags?: string[] | null
          titulo: string
        }
        Update: {
          atualizado_em?: string
          categoria?: string | null
          conteudo?: string | null
          criado_em?: string
          criado_por?: string | null
          fonte_nome?: string | null
          fonte_url?: string | null
          id?: string
          imagem_url?: string | null
          publicado_em?: string | null
          resumo?: string | null
          status?: Database["public"]["Enums"]["publicacao_status"]
          tags?: string[] | null
          titulo?: string
        }
        Relationships: []
      }
      permissoes: {
        Row: {
          chave: string
          criado_em: string
          descricao: string | null
          id: string
          modulo: string
        }
        Insert: {
          chave: string
          criado_em?: string
          descricao?: string | null
          id?: string
          modulo: string
        }
        Update: {
          chave?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          modulo?: string
        }
        Relationships: []
      }
      usuarios_admin: {
        Row: {
          atualizado_em: string
          auth_user_id: string | null
          criado_em: string
          email: string
          id: string
          nome: string
          status: Database["public"]["Enums"]["generic_status"]
          ultimo_acesso_em: string | null
        }
        Insert: {
          atualizado_em?: string
          auth_user_id?: string | null
          criado_em?: string
          email: string
          id?: string
          nome: string
          status?: Database["public"]["Enums"]["generic_status"]
          ultimo_acesso_em?: string | null
        }
        Update: {
          atualizado_em?: string
          auth_user_id?: string | null
          criado_em?: string
          email?: string
          id?: string
          nome?: string
          status?: Database["public"]["Enums"]["generic_status"]
          ultimo_acesso_em?: string | null
        }
        Relationships: []
      }
      usuarios_admin_grupos: {
        Row: {
          acesso_global: boolean | null
          ambiente_id: string | null
          criado_em: string
          grupo_id: string
          id: string
          usuario_admin_id: string
        }
        Insert: {
          acesso_global?: boolean | null
          ambiente_id?: string | null
          criado_em?: string
          grupo_id: string
          id?: string
          usuario_admin_id: string
        }
        Update: {
          acesso_global?: boolean | null
          ambiente_id?: string | null
          criado_em?: string
          grupo_id?: string
          id?: string
          usuario_admin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_admin_grupos_ambiente_id_fkey"
            columns: ["ambiente_id"]
            isOneToOne: false
            referencedRelation: "ambientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_admin_grupos_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_acesso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_admin_grupos_usuario_admin_id_fkey"
            columns: ["usuario_admin_id"]
            isOneToOne: false
            referencedRelation: "usuarios_admin"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aluno_tem_ambiente: { Args: { _ambiente_id: string }; Returns: boolean }
      claim_super_admin: { Args: { _nome: string }; Returns: string }
      current_admin_id: { Args: never; Returns: string }
      current_aluno_id: { Args: never; Returns: string }
      has_admin_permission: { Args: { _permissao: string }; Returns: boolean }
      is_admin_for_ambiente: {
        Args: { _ambiente_id: string }
        Returns: boolean
      }
      is_any_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      aluno_status: "ativo" | "inativo" | "bloqueado"
      ambiente_status: "ativo" | "inativo" | "rascunho" | "arquivado"
      ambiente_tema: "claro" | "escuro" | "personalizado"
      aula_tipo: "video" | "texto" | "pdf" | "link" | "misto"
      card_borda_t:
        | "quadrado"
        | "levemente_arredondado"
        | "arredondado"
        | "pill"
      card_estilo_t: "flat" | "sombra" | "borda" | "imagem"
      card_tamanho_t: "compacto" | "medio" | "grande"
      ferramenta_abertura: "nova_aba" | "mesma_aba" | "modal"
      generic_status: "ativo" | "inativo"
      grupo_escopo: "global" | "ambiente"
      importacao_status:
        | "pendente"
        | "processando"
        | "concluida"
        | "com_erros"
        | "falhou"
      importacao_tipo: "csv" | "xlsx"
      publicacao_status: "rascunho" | "publicada" | "arquivada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      aluno_status: ["ativo", "inativo", "bloqueado"],
      ambiente_status: ["ativo", "inativo", "rascunho", "arquivado"],
      ambiente_tema: ["claro", "escuro", "personalizado"],
      aula_tipo: ["video", "texto", "pdf", "link", "misto"],
      card_borda_t: [
        "quadrado",
        "levemente_arredondado",
        "arredondado",
        "pill",
      ],
      card_estilo_t: ["flat", "sombra", "borda", "imagem"],
      card_tamanho_t: ["compacto", "medio", "grande"],
      ferramenta_abertura: ["nova_aba", "mesma_aba", "modal"],
      generic_status: ["ativo", "inativo"],
      grupo_escopo: ["global", "ambiente"],
      importacao_status: [
        "pendente",
        "processando",
        "concluida",
        "com_erros",
        "falhou",
      ],
      importacao_tipo: ["csv", "xlsx"],
      publicacao_status: ["rascunho", "publicada", "arquivada"],
    },
  },
} as const
