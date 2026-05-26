export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alertas_crisis: {
        Row: {
          contacto_confianza_id: string | null
          contexto: string | null
          creada_at: string
          gravedad: Database["public"]["Enums"]["gravedad_crisis"]
          id: string
          llamo_emergencias: boolean
          nota_resolucion: string | null
          notificado_at: string | null
          notificado_terapeuta: boolean
          origen: string
          paciente_id: string
          recurso_consultado_id: string | null
          registro_emocional_id: string | null
          resuelta: boolean
          resuelta_at: string | null
          vinculacion_id: string | null
        }
        Insert: {
          contacto_confianza_id?: string | null
          contexto?: string | null
          creada_at?: string
          gravedad: Database["public"]["Enums"]["gravedad_crisis"]
          id?: string
          llamo_emergencias?: boolean
          nota_resolucion?: string | null
          notificado_at?: string | null
          notificado_terapeuta?: boolean
          origen: string
          paciente_id: string
          recurso_consultado_id?: string | null
          registro_emocional_id?: string | null
          resuelta?: boolean
          resuelta_at?: string | null
          vinculacion_id?: string | null
        }
        Update: {
          contacto_confianza_id?: string | null
          contexto?: string | null
          creada_at?: string
          gravedad?: Database["public"]["Enums"]["gravedad_crisis"]
          id?: string
          llamo_emergencias?: boolean
          nota_resolucion?: string | null
          notificado_at?: string | null
          notificado_terapeuta?: boolean
          origen?: string
          paciente_id?: string
          recurso_consultado_id?: string | null
          registro_emocional_id?: string | null
          resuelta?: boolean
          resuelta_at?: string | null
          vinculacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alertas_crisis_contacto_confianza_id_fkey"
            columns: ["contacto_confianza_id"]
            isOneToOne: false
            referencedRelation: "contactos_confianza"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_crisis_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "alertas_crisis_recurso_consultado_id_fkey"
            columns: ["recurso_consultado_id"]
            isOneToOne: false
            referencedRelation: "recursos_emergencia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_crisis_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "alertas_crisis_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accion: Database["public"]["Enums"]["accion_auditoria"]
          actor_id: string | null
          actor_rol: Database["public"]["Enums"]["rol_usuario"] | null
          contexto: Json
          creado_at: string
          id: string
          ip: unknown
          registro_id: string | null
          tabla: string
          user_agent: string | null
        }
        Insert: {
          accion: Database["public"]["Enums"]["accion_auditoria"]
          actor_id?: string | null
          actor_rol?: Database["public"]["Enums"]["rol_usuario"] | null
          contexto?: Json
          creado_at?: string
          id?: string
          ip?: unknown
          registro_id?: string | null
          tabla: string
          user_agent?: string | null
        }
        Update: {
          accion?: Database["public"]["Enums"]["accion_auditoria"]
          actor_id?: string | null
          actor_rol?: Database["public"]["Enums"]["rol_usuario"] | null
          contexto?: Json
          creado_at?: string
          id?: string
          ip?: unknown
          registro_id?: string | null
          tabla?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          activa: boolean
          descripcion: string | null
          icono: string | null
          key: string
          nombre: string
          orden: number
        }
        Insert: {
          activa?: boolean
          descripcion?: string | null
          icono?: string | null
          key: string
          nombre: string
          orden?: number
        }
        Update: {
          activa?: boolean
          descripcion?: string | null
          icono?: string | null
          key?: string
          nombre?: string
          orden?: number
        }
        Relationships: []
      }
      consentimientos: {
        Row: {
          aceptado: boolean
          aceptado_at: string
          id: string
          ip: unknown
          profile_id: string
          texto_resumen: string | null
          tipo: Database["public"]["Enums"]["tipo_consentimiento"]
          user_agent: string | null
          version: string
        }
        Insert: {
          aceptado: boolean
          aceptado_at?: string
          id?: string
          ip?: unknown
          profile_id: string
          texto_resumen?: string | null
          tipo: Database["public"]["Enums"]["tipo_consentimiento"]
          user_agent?: string | null
          version: string
        }
        Update: {
          aceptado?: boolean
          aceptado_at?: string
          id?: string
          ip?: unknown
          profile_id?: string
          texto_resumen?: string | null
          tipo?: Database["public"]["Enums"]["tipo_consentimiento"]
          user_agent?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "consentimientos_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos_confianza: {
        Row: {
          activo: boolean
          actualizado_at: string
          creado_at: string
          id: string
          nombre: string
          orden: number
          paciente_id: string
          relacion: string | null
          telefono: string
        }
        Insert: {
          activo?: boolean
          actualizado_at?: string
          creado_at?: string
          id?: string
          nombre: string
          orden?: number
          paciente_id: string
          relacion?: string | null
          telefono: string
        }
        Update: {
          activo?: boolean
          actualizado_at?: string
          creado_at?: string
          id?: string
          nombre?: string
          orden?: number
          paciente_id?: string
          relacion?: string | null
          telefono?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_confianza_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      contenido_educativo: {
        Row: {
          actualizado_at: string
          autor_nombre: string | null
          autor_terapeuta_id: string | null
          categoria_key: string | null
          creado_at: string
          descripcion: string | null
          destacado: boolean
          duracion_min: number | null
          etiquetas: string[]
          favoritos_count: number
          id: string
          idioma: string
          miniatura_url: string | null
          nivel: Database["public"]["Enums"]["nivel_contenido"]
          paginas: number | null
          publicado: boolean
          publicado_at: string | null
          rating_promedio: number | null
          recurso_url: string | null
          subtitulo: string | null
          tipo: Database["public"]["Enums"]["tipo_contenido"]
          titulo: string
          vistas_count: number
        }
        Insert: {
          actualizado_at?: string
          autor_nombre?: string | null
          autor_terapeuta_id?: string | null
          categoria_key?: string | null
          creado_at?: string
          descripcion?: string | null
          destacado?: boolean
          duracion_min?: number | null
          etiquetas?: string[]
          favoritos_count?: number
          id?: string
          idioma?: string
          miniatura_url?: string | null
          nivel?: Database["public"]["Enums"]["nivel_contenido"]
          paginas?: number | null
          publicado?: boolean
          publicado_at?: string | null
          rating_promedio?: number | null
          recurso_url?: string | null
          subtitulo?: string | null
          tipo: Database["public"]["Enums"]["tipo_contenido"]
          titulo: string
          vistas_count?: number
        }
        Update: {
          actualizado_at?: string
          autor_nombre?: string | null
          autor_terapeuta_id?: string | null
          categoria_key?: string | null
          creado_at?: string
          descripcion?: string | null
          destacado?: boolean
          duracion_min?: number | null
          etiquetas?: string[]
          favoritos_count?: number
          id?: string
          idioma?: string
          miniatura_url?: string | null
          nivel?: Database["public"]["Enums"]["nivel_contenido"]
          paginas?: number | null
          publicado?: boolean
          publicado_at?: string | null
          rating_promedio?: number | null
          recurso_url?: string | null
          subtitulo?: string | null
          tipo?: Database["public"]["Enums"]["tipo_contenido"]
          titulo?: string
          vistas_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "contenido_educativo_autor_terapeuta_id_fkey"
            columns: ["autor_terapeuta_id"]
            isOneToOne: false
            referencedRelation: "terapeutas"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contenido_educativo_categoria_key_fkey"
            columns: ["categoria_key"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["key"]
          },
        ]
      }
      contenido_favoritos: {
        Row: {
          contenido_id: string
          creado_at: string
          usuario_id: string
        }
        Insert: {
          contenido_id: string
          creado_at?: string
          usuario_id: string
        }
        Update: {
          contenido_id?: string
          creado_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contenido_favoritos_contenido_id_fkey"
            columns: ["contenido_id"]
            isOneToOne: false
            referencedRelation: "contenido_educativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenido_favoritos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contenido_progreso: {
        Row: {
          completado: boolean
          contenido_id: string
          primera_visualizacion: string
          progreso_porcentaje: number
          ultima_visualizacion: string
          usuario_id: string
        }
        Insert: {
          completado?: boolean
          contenido_id: string
          primera_visualizacion?: string
          progreso_porcentaje?: number
          ultima_visualizacion?: string
          usuario_id: string
        }
        Update: {
          completado?: boolean
          contenido_id?: string
          primera_visualizacion?: string
          progreso_porcentaje?: number
          ultima_visualizacion?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contenido_progreso_contenido_id_fkey"
            columns: ["contenido_id"]
            isOneToOne: false
            referencedRelation: "contenido_educativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contenido_progreso_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      diario_entradas: {
        Row: {
          actualizado_at: string
          contenido: string
          creado_at: string
          fecha: string
          id: string
          paciente_id: string
          privacidad: Database["public"]["Enums"]["nivel_privacidad"]
          resumen_ia: string | null
          resumen_ia_at: string | null
          tags: string[]
          titulo: string | null
        }
        Insert: {
          actualizado_at?: string
          contenido: string
          creado_at?: string
          fecha?: string
          id?: string
          paciente_id: string
          privacidad?: Database["public"]["Enums"]["nivel_privacidad"]
          resumen_ia?: string | null
          resumen_ia_at?: string | null
          tags?: string[]
          titulo?: string | null
        }
        Update: {
          actualizado_at?: string
          contenido?: string
          creado_at?: string
          fecha?: string
          id?: string
          paciente_id?: string
          privacidad?: Database["public"]["Enums"]["nivel_privacidad"]
          resumen_ia?: string | null
          resumen_ia_at?: string | null
          tags?: string[]
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diario_entradas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      emociones_catalogo: {
        Row: {
          activa: boolean
          descripcion: string | null
          familia: Database["public"]["Enums"]["familia_emocional"]
          key: string
          nombre_en: string | null
          nombre_es: string
          orden: number
        }
        Insert: {
          activa?: boolean
          descripcion?: string | null
          familia: Database["public"]["Enums"]["familia_emocional"]
          key: string
          nombre_en?: string | null
          nombre_es: string
          orden?: number
        }
        Update: {
          activa?: boolean
          descripcion?: string | null
          familia?: Database["public"]["Enums"]["familia_emocional"]
          key?: string
          nombre_en?: string | null
          nombre_es?: string
          orden?: number
        }
        Relationships: []
      }
      mensajes: {
        Row: {
          archivos: Json
          autor_id: string
          contenido: string
          creado_at: string
          es_sistema: boolean
          id: string
          leido_at: string | null
          vinculacion_id: string
        }
        Insert: {
          archivos?: Json
          autor_id: string
          contenido: string
          creado_at?: string
          es_sistema?: boolean
          id?: string
          leido_at?: string | null
          vinculacion_id: string
        }
        Update: {
          archivos?: Json
          autor_id?: string
          contenido?: string
          creado_at?: string
          es_sistema?: boolean
          id?: string
          leido_at?: string | null
          vinculacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "mensajes_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          actualizado_at: string
          creado_at: string
          fecha_nacimiento: string | null
          genero: string | null
          motivos_consulta: string[] | null
          notas_personales: string | null
          ocupacion: string | null
          profile_id: string
        }
        Insert: {
          actualizado_at?: string
          creado_at?: string
          fecha_nacimiento?: string | null
          genero?: string | null
          motivos_consulta?: string[] | null
          notas_personales?: string | null
          ocupacion?: string | null
          profile_id: string
        }
        Update: {
          actualizado_at?: string
          creado_at?: string
          fecha_nacimiento?: string | null
          genero?: string | null
          motivos_consulta?: string[] | null
          notas_personales?: string | null
          ocupacion?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plantillas_ejercicios: {
        Row: {
          actualizado_at: string
          campos_respuesta: Json
          categoria: string
          contenido_md: string | null
          creado_at: string
          descripcion: string | null
          duracion_min: number | null
          id: string
          publica: boolean
          recursos: Json
          terapeuta_id: string | null
          tipo: Database["public"]["Enums"]["tipo_contenido"]
          titulo: string
          usos_count: number
        }
        Insert: {
          actualizado_at?: string
          campos_respuesta?: Json
          categoria: string
          contenido_md?: string | null
          creado_at?: string
          descripcion?: string | null
          duracion_min?: number | null
          id?: string
          publica?: boolean
          recursos?: Json
          terapeuta_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_contenido"]
          titulo: string
          usos_count?: number
        }
        Update: {
          actualizado_at?: string
          campos_respuesta?: Json
          categoria?: string
          contenido_md?: string | null
          creado_at?: string
          descripcion?: string | null
          duracion_min?: number | null
          id?: string
          publica?: boolean
          recursos?: Json
          terapeuta_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_contenido"]
          titulo?: string
          usos_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "plantillas_ejercicios_terapeuta_id_fkey"
            columns: ["terapeuta_id"]
            isOneToOne: false
            referencedRelation: "terapeutas"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      preferencias_privacidad: {
        Row: {
          actualizado_at: string
          notificar_crisis_terapeuta: boolean
          paciente_id: string
          permitir_acceso_archivos: boolean
          permitir_analytics_anonimo: boolean
          permitir_emails_no_criticos: boolean
          permitir_recordatorios_push: boolean
          permitir_resumen_ia: boolean
          privacidad_diario_default: Database["public"]["Enums"]["nivel_privacidad"]
          privacidad_registro_default: Database["public"]["Enums"]["nivel_privacidad"]
          recibir_mensajes_terapeuta: boolean
        }
        Insert: {
          actualizado_at?: string
          notificar_crisis_terapeuta?: boolean
          paciente_id: string
          permitir_acceso_archivos?: boolean
          permitir_analytics_anonimo?: boolean
          permitir_emails_no_criticos?: boolean
          permitir_recordatorios_push?: boolean
          permitir_resumen_ia?: boolean
          privacidad_diario_default?: Database["public"]["Enums"]["nivel_privacidad"]
          privacidad_registro_default?: Database["public"]["Enums"]["nivel_privacidad"]
          recibir_mensajes_terapeuta?: boolean
        }
        Update: {
          actualizado_at?: string
          notificar_crisis_terapeuta?: boolean
          paciente_id?: string
          permitir_acceso_archivos?: boolean
          permitir_analytics_anonimo?: boolean
          permitir_emails_no_criticos?: boolean
          permitir_recordatorios_push?: boolean
          permitir_resumen_ia?: boolean
          privacidad_diario_default?: Database["public"]["Enums"]["nivel_privacidad"]
          privacidad_registro_default?: Database["public"]["Enums"]["nivel_privacidad"]
          recibir_mensajes_terapeuta?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "preferencias_privacidad_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: true
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      profiles: {
        Row: {
          actualizado_at: string
          apellidos: string | null
          avatar_url: string | null
          bio: string | null
          ciudad: string | null
          creado_at: string
          email: string
          id: string
          locale: string
          nombre: string
          onboarding_completo: boolean
          pais: string | null
          rol: Database["public"]["Enums"]["rol_usuario"]
          telefono: string | null
          ultimo_acceso: string | null
          zona_horaria: string
        }
        Insert: {
          actualizado_at?: string
          apellidos?: string | null
          avatar_url?: string | null
          bio?: string | null
          ciudad?: string | null
          creado_at?: string
          email: string
          id: string
          locale?: string
          nombre: string
          onboarding_completo?: boolean
          pais?: string | null
          rol: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
          ultimo_acceso?: string | null
          zona_horaria?: string
        }
        Update: {
          actualizado_at?: string
          apellidos?: string | null
          avatar_url?: string | null
          bio?: string | null
          ciudad?: string | null
          creado_at?: string
          email?: string
          id?: string
          locale?: string
          nombre?: string
          onboarding_completo?: boolean
          pais?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario"]
          telefono?: string | null
          ultimo_acceso?: string | null
          zona_horaria?: string
        }
        Relationships: []
      }
      recursos_asignados: {
        Row: {
          asignado_por: string
          contenido_id: string
          creado_at: string
          id: string
          mensaje_terapeuta: string | null
          prioridad: number
          vinculacion_id: string
          visto_at: string | null
        }
        Insert: {
          asignado_por: string
          contenido_id: string
          creado_at?: string
          id?: string
          mensaje_terapeuta?: string | null
          prioridad?: number
          vinculacion_id: string
          visto_at?: string | null
        }
        Update: {
          asignado_por?: string
          contenido_id?: string
          creado_at?: string
          id?: string
          mensaje_terapeuta?: string | null
          prioridad?: number
          vinculacion_id?: string
          visto_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_asignados_asignado_por_fkey"
            columns: ["asignado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursos_asignados_contenido_id_fkey"
            columns: ["contenido_id"]
            isOneToOne: false
            referencedRelation: "contenido_educativo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursos_asignados_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "recursos_asignados_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos_emergencia: {
        Row: {
          activo: boolean
          ciudad: string | null
          creado_at: string
          descripcion: string | null
          horario: string | null
          id: string
          nombre: string
          orden: number
          pais: string
          telefono: string
          tipo: string
          url: string | null
        }
        Insert: {
          activo?: boolean
          ciudad?: string | null
          creado_at?: string
          descripcion?: string | null
          horario?: string | null
          id?: string
          nombre: string
          orden?: number
          pais: string
          telefono: string
          tipo: string
          url?: string | null
        }
        Update: {
          activo?: boolean
          ciudad?: string | null
          creado_at?: string
          descripcion?: string | null
          horario?: string | null
          id?: string
          nombre?: string
          orden?: number
          pais?: string
          telefono?: string
          tipo?: string
          url?: string | null
        }
        Relationships: []
      }
      registros_emocionales: {
        Row: {
          actualizado_at: string
          alerta_crisis_id: string | null
          conducta: string | null
          creado_at: string
          descripcion: string | null
          emocion_principal_key: string
          emociones_secundarias: string[]
          fecha: string
          hora: string
          id: string
          intensidad: number
          necesidad: string | null
          paciente_id: string
          pensamientos: string | null
          privacidad: Database["public"]["Enums"]["nivel_privacidad"]
          registrado_at: string
          sensaciones_fisicas: string | null
          situacion_detonante: string | null
        }
        Insert: {
          actualizado_at?: string
          alerta_crisis_id?: string | null
          conducta?: string | null
          creado_at?: string
          descripcion?: string | null
          emocion_principal_key: string
          emociones_secundarias?: string[]
          fecha?: string
          hora?: string
          id?: string
          intensidad: number
          necesidad?: string | null
          paciente_id: string
          pensamientos?: string | null
          privacidad?: Database["public"]["Enums"]["nivel_privacidad"]
          registrado_at?: string
          sensaciones_fisicas?: string | null
          situacion_detonante?: string | null
        }
        Update: {
          actualizado_at?: string
          alerta_crisis_id?: string | null
          conducta?: string | null
          creado_at?: string
          descripcion?: string | null
          emocion_principal_key?: string
          emociones_secundarias?: string[]
          fecha?: string
          hora?: string
          id?: string
          intensidad?: number
          necesidad?: string | null
          paciente_id?: string
          pensamientos?: string | null
          privacidad?: Database["public"]["Enums"]["nivel_privacidad"]
          registrado_at?: string
          sensaciones_fisicas?: string | null
          situacion_detonante?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_emocionales_emocion_principal_key_fkey"
            columns: ["emocion_principal_key"]
            isOneToOne: false
            referencedRelation: "emociones_catalogo"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "registros_emocionales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      resumenes_ia: {
        Row: {
          creado_at: string
          diario_count: number
          generado_por: string
          id: string
          modelo: string
          periodo_desde: string
          periodo_hasta: string
          registros_count: number
          resumen_json: Json
          resumen_md: string
          tokens_input: number | null
          tokens_output: number | null
          vinculacion_id: string
        }
        Insert: {
          creado_at?: string
          diario_count?: number
          generado_por: string
          id?: string
          modelo?: string
          periodo_desde: string
          periodo_hasta: string
          registros_count?: number
          resumen_json: Json
          resumen_md: string
          tokens_input?: number | null
          tokens_output?: number | null
          vinculacion_id: string
        }
        Update: {
          creado_at?: string
          diario_count?: number
          generado_por?: string
          id?: string
          modelo?: string
          periodo_desde?: string
          periodo_hasta?: string
          registros_count?: number
          resumen_json?: Json
          resumen_md?: string
          tokens_input?: number | null
          tokens_output?: number | null
          vinculacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumenes_ia_generado_por_fkey"
            columns: ["generado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resumenes_ia_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "resumenes_ia_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      sesion_notas: {
        Row: {
          actualizado_at: string
          autor_id: string
          contenido_privado: string | null
          contenido_publico: string | null
          creado_at: string
          id: string
          objetivos_trabajados: string[]
          plan_proxima_sesion: string | null
          sesion_id: string
          visible_paciente: boolean
        }
        Insert: {
          actualizado_at?: string
          autor_id: string
          contenido_privado?: string | null
          contenido_publico?: string | null
          creado_at?: string
          id?: string
          objetivos_trabajados?: string[]
          plan_proxima_sesion?: string | null
          sesion_id: string
          visible_paciente?: boolean
        }
        Update: {
          actualizado_at?: string
          autor_id?: string
          contenido_privado?: string | null
          contenido_publico?: string | null
          creado_at?: string
          id?: string
          objetivos_trabajados?: string[]
          plan_proxima_sesion?: string | null
          sesion_id?: string
          visible_paciente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "sesion_notas_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sesion_notas_sesion_id_fkey"
            columns: ["sesion_id"]
            isOneToOne: false
            referencedRelation: "sesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      sesiones: {
        Row: {
          actualizado_at: string
          creado_at: string
          duracion_min: number
          estado: Database["public"]["Enums"]["estado_sesion"]
          fecha_programada: string
          fecha_realizada: string | null
          id: string
          link_videollamada: string | null
          modalidad: Database["public"]["Enums"]["modalidad_sesion"]
          motivo_cancelacion: string | null
          numero: number | null
          ubicacion: string | null
          vinculacion_id: string
        }
        Insert: {
          actualizado_at?: string
          creado_at?: string
          duracion_min?: number
          estado?: Database["public"]["Enums"]["estado_sesion"]
          fecha_programada: string
          fecha_realizada?: string | null
          id?: string
          link_videollamada?: string | null
          modalidad?: Database["public"]["Enums"]["modalidad_sesion"]
          motivo_cancelacion?: string | null
          numero?: number | null
          ubicacion?: string | null
          vinculacion_id: string
        }
        Update: {
          actualizado_at?: string
          creado_at?: string
          duracion_min?: number
          estado?: Database["public"]["Enums"]["estado_sesion"]
          fecha_programada?: string
          fecha_realizada?: string | null
          id?: string
          link_videollamada?: string | null
          modalidad?: Database["public"]["Enums"]["modalidad_sesion"]
          motivo_cancelacion?: string | null
          numero?: number | null
          ubicacion?: string | null
          vinculacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sesiones_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "sesiones_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_eventos: {
        Row: {
          id: string
          payload: Json
          procesado_at: string | null
          recibido_at: string
          tipo: string
        }
        Insert: {
          id: string
          payload: Json
          procesado_at?: string | null
          recibido_at?: string
          tipo: string
        }
        Update: {
          id?: string
          payload?: Json
          procesado_at?: string | null
          recibido_at?: string
          tipo?: string
        }
        Relationships: []
      }
      stripe_facturas: {
        Row: {
          creada_at: string
          estado: string
          id: string
          moneda: string
          monto_centavos: number
          pacientes_count: number | null
          pagada_at: string | null
          periodo_fin: string | null
          periodo_inicio: string | null
          terapeuta_id: string
          url_factura: string | null
          url_pdf: string | null
        }
        Insert: {
          creada_at?: string
          estado: string
          id: string
          moneda?: string
          monto_centavos: number
          pacientes_count?: number | null
          pagada_at?: string | null
          periodo_fin?: string | null
          periodo_inicio?: string | null
          terapeuta_id: string
          url_factura?: string | null
          url_pdf?: string | null
        }
        Update: {
          creada_at?: string
          estado?: string
          id?: string
          moneda?: string
          monto_centavos?: number
          pacientes_count?: number | null
          pagada_at?: string | null
          periodo_fin?: string | null
          periodo_inicio?: string | null
          terapeuta_id?: string
          url_factura?: string | null
          url_pdf?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_facturas_terapeuta_id_fkey"
            columns: ["terapeuta_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tarea_respuestas: {
        Row: {
          actualizado_at: string
          archivos: Json
          comentarios_paciente: string | null
          compartir_terapeuta: boolean
          creado_at: string
          dificultad_percibida: number | null
          fecha: string
          hora: string
          id: string
          paciente_id: string
          respuestas: Json
          tarea_id: string
          texto_libre: string | null
        }
        Insert: {
          actualizado_at?: string
          archivos?: Json
          comentarios_paciente?: string | null
          compartir_terapeuta?: boolean
          creado_at?: string
          dificultad_percibida?: number | null
          fecha?: string
          hora?: string
          id?: string
          paciente_id: string
          respuestas?: Json
          tarea_id: string
          texto_libre?: string | null
        }
        Update: {
          actualizado_at?: string
          archivos?: Json
          comentarios_paciente?: string | null
          compartir_terapeuta?: boolean
          creado_at?: string
          dificultad_percibida?: number | null
          fecha?: string
          hora?: string
          id?: string
          paciente_id?: string
          respuestas?: Json
          tarea_id?: string
          texto_libre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarea_respuestas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "tarea_respuestas_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas: {
        Row: {
          actualizado_at: string
          asignada_por: string
          campos_respuesta: Json
          comentarios_terapeuta: string | null
          config_frecuencia: Json | null
          contenido_md: string | null
          creado_at: string
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_tarea"]
          fecha_inicio: string
          fecha_limite: string | null
          frecuencia: Database["public"]["Enums"]["frecuencia_tarea"]
          id: string
          plantilla_id: string | null
          recordatorios: Json
          respuestas_visibles_terapeuta: boolean
          titulo: string
          vinculacion_id: string
        }
        Insert: {
          actualizado_at?: string
          asignada_por: string
          campos_respuesta?: Json
          comentarios_terapeuta?: string | null
          config_frecuencia?: Json | null
          contenido_md?: string | null
          creado_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_tarea"]
          fecha_inicio?: string
          fecha_limite?: string | null
          frecuencia?: Database["public"]["Enums"]["frecuencia_tarea"]
          id?: string
          plantilla_id?: string | null
          recordatorios?: Json
          respuestas_visibles_terapeuta?: boolean
          titulo: string
          vinculacion_id: string
        }
        Update: {
          actualizado_at?: string
          asignada_por?: string
          campos_respuesta?: Json
          comentarios_terapeuta?: string | null
          config_frecuencia?: Json | null
          contenido_md?: string | null
          creado_at?: string
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_tarea"]
          fecha_inicio?: string
          fecha_limite?: string | null
          frecuencia?: Database["public"]["Enums"]["frecuencia_tarea"]
          id?: string
          plantilla_id?: string | null
          recordatorios?: Json
          respuestas_visibles_terapeuta?: boolean
          titulo?: string
          vinculacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tareas_asignada_por_fkey"
            columns: ["asignada_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_plantilla_id_fkey"
            columns: ["plantilla_id"]
            isOneToOne: false
            referencedRelation: "plantillas_ejercicios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareas_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "tareas_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      terapeuta_horarios: {
        Row: {
          activo: boolean
          creado_at: string
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id: string
          modalidad: Database["public"]["Enums"]["modalidad_sesion"]
          terapeuta_id: string
        }
        Insert: {
          activo?: boolean
          creado_at?: string
          dia_semana: number
          hora_fin: string
          hora_inicio: string
          id?: string
          modalidad?: Database["public"]["Enums"]["modalidad_sesion"]
          terapeuta_id: string
        }
        Update: {
          activo?: boolean
          creado_at?: string
          dia_semana?: number
          hora_fin?: string
          hora_inicio?: string
          id?: string
          modalidad?: Database["public"]["Enums"]["modalidad_sesion"]
          terapeuta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terapeuta_horarios_terapeuta_id_fkey"
            columns: ["terapeuta_id"]
            isOneToOne: false
            referencedRelation: "terapeutas"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      terapeutas: {
        Row: {
          acepta_nuevos_pacientes: boolean
          actualizado_at: string
          cedula_profesional: string | null
          creado_at: string
          descripcion: string | null
          enfoques: string[]
          especialidades: string[]
          estado_verificacion: Database["public"]["Enums"]["estado_verificacion"]
          experiencia_anios: number | null
          idiomas: string[]
          modalidades: Database["public"]["Enums"]["modalidad_sesion"][]
          pacientes_activos_count: number
          plan: Database["public"]["Enums"]["plan_terapeuta"]
          plan_estado: string
          poblaciones_atendidas: string[]
          precio_sesion_mxn: number | null
          profile_id: string
          prueba_premium_fin: string | null
          prueba_premium_inicio: string | null
          ranking_score: number
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          titulo: string | null
          trial_termina_at: string | null
          ultima_actividad: string | null
          verificado_at: string | null
          verificado_por: string | null
          video_presentacion_url: string | null
        }
        Insert: {
          acepta_nuevos_pacientes?: boolean
          actualizado_at?: string
          cedula_profesional?: string | null
          creado_at?: string
          descripcion?: string | null
          enfoques?: string[]
          especialidades?: string[]
          estado_verificacion?: Database["public"]["Enums"]["estado_verificacion"]
          experiencia_anios?: number | null
          idiomas?: string[]
          modalidades?: Database["public"]["Enums"]["modalidad_sesion"][]
          pacientes_activos_count?: number
          plan?: Database["public"]["Enums"]["plan_terapeuta"]
          plan_estado?: string
          poblaciones_atendidas?: string[]
          precio_sesion_mxn?: number | null
          profile_id: string
          prueba_premium_fin?: string | null
          prueba_premium_inicio?: string | null
          ranking_score?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          titulo?: string | null
          trial_termina_at?: string | null
          ultima_actividad?: string | null
          verificado_at?: string | null
          verificado_por?: string | null
          video_presentacion_url?: string | null
        }
        Update: {
          acepta_nuevos_pacientes?: boolean
          actualizado_at?: string
          cedula_profesional?: string | null
          creado_at?: string
          descripcion?: string | null
          enfoques?: string[]
          especialidades?: string[]
          estado_verificacion?: Database["public"]["Enums"]["estado_verificacion"]
          experiencia_anios?: number | null
          idiomas?: string[]
          modalidades?: Database["public"]["Enums"]["modalidad_sesion"][]
          pacientes_activos_count?: number
          plan?: Database["public"]["Enums"]["plan_terapeuta"]
          plan_estado?: string
          poblaciones_atendidas?: string[]
          precio_sesion_mxn?: number | null
          profile_id?: string
          prueba_premium_fin?: string | null
          prueba_premium_inicio?: string | null
          ranking_score?: number
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          titulo?: string | null
          trial_termina_at?: string | null
          ultima_actividad?: string | null
          verificado_at?: string | null
          verificado_por?: string | null
          video_presentacion_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terapeutas_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terapeutas_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vinculaciones: {
        Row: {
          actualizado_at: string
          codigo_invitacion: string
          consentimiento_aceptado_at: string | null
          creado_at: string
          email_invitado: string | null
          estado: Database["public"]["Enums"]["estado_vinculacion"]
          facturable: boolean
          fecha_fin: string | null
          fecha_inicio: string | null
          fecha_pausa: string | null
          id: string
          motivo_fin: string | null
          nombre_invitado: string | null
          notas_terapeuta_privadas: string | null
          notificar_crisis_terapeuta: boolean
          notificar_inactividad: boolean
          paciente_id: string | null
          terapeuta_id: string
          ultimo_periodo_facturado: string | null
          version_consentimiento: string | null
        }
        Insert: {
          actualizado_at?: string
          codigo_invitacion: string
          consentimiento_aceptado_at?: string | null
          creado_at?: string
          email_invitado?: string | null
          estado?: Database["public"]["Enums"]["estado_vinculacion"]
          facturable?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_pausa?: string | null
          id?: string
          motivo_fin?: string | null
          nombre_invitado?: string | null
          notas_terapeuta_privadas?: string | null
          notificar_crisis_terapeuta?: boolean
          notificar_inactividad?: boolean
          paciente_id?: string | null
          terapeuta_id: string
          ultimo_periodo_facturado?: string | null
          version_consentimiento?: string | null
        }
        Update: {
          actualizado_at?: string
          codigo_invitacion?: string
          consentimiento_aceptado_at?: string | null
          creado_at?: string
          email_invitado?: string | null
          estado?: Database["public"]["Enums"]["estado_vinculacion"]
          facturable?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string | null
          fecha_pausa?: string | null
          id?: string
          motivo_fin?: string | null
          nombre_invitado?: string | null
          notas_terapeuta_privadas?: string | null
          notificar_crisis_terapeuta?: boolean
          notificar_inactividad?: boolean
          paciente_id?: string | null
          terapeuta_id?: string
          ultimo_periodo_facturado?: string | null
          version_consentimiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vinculaciones_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vinculaciones_terapeuta_id_fkey"
            columns: ["terapeuta_id"]
            isOneToOne: false
            referencedRelation: "terapeutas"
            referencedColumns: ["profile_id"]
          },
        ]
      }
    }
    Views: {
      mensajes_hilos_terapeuta: {
        Row: {
          no_leidos: number | null
          paciente_avatar: string | null
          paciente_id: string | null
          paciente_nombre: string | null
          terapeuta_id: string | null
          ultimo_autor_id: string | null
          ultimo_mensaje: string | null
          ultimo_mensaje_at: string | null
          vinculacion_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_autor_id_fkey"
            columns: ["ultimo_autor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculaciones_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "vinculaciones_terapeuta_id_fkey"
            columns: ["terapeuta_id"]
            isOneToOne: false
            referencedRelation: "terapeutas"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      registros_visibles_terapeuta: {
        Row: {
          creado_at: string | null
          descripcion: string | null
          emocion_principal_key: string | null
          emociones_secundarias: string[] | null
          fecha: string | null
          hora: string | null
          id: string | null
          intensidad: number | null
          necesidad: string | null
          paciente_id: string | null
          privacidad: Database["public"]["Enums"]["nivel_privacidad"] | null
          situacion_detonante: string | null
        }
        Insert: {
          creado_at?: string | null
          descripcion?: string | null
          emocion_principal_key?: string | null
          emociones_secundarias?: string[] | null
          fecha?: string | null
          hora?: string | null
          id?: string | null
          intensidad?: number | null
          necesidad?: string | null
          paciente_id?: string | null
          privacidad?: Database["public"]["Enums"]["nivel_privacidad"] | null
          situacion_detonante?: string | null
        }
        Update: {
          creado_at?: string | null
          descripcion?: string | null
          emocion_principal_key?: string | null
          emociones_secundarias?: string[] | null
          fecha?: string | null
          hora?: string | null
          id?: string | null
          intensidad?: number | null
          necesidad?: string | null
          paciente_id?: string | null
          privacidad?: Database["public"]["Enums"]["nivel_privacidad"] | null
          situacion_detonante?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_emocionales_emocion_principal_key_fkey"
            columns: ["emocion_principal_key"]
            isOneToOne: false
            referencedRelation: "emociones_catalogo"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "registros_emocionales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
        ]
      }
    }
    Functions: {
      calcular_ranking_terapeuta: {
        Args: { p_terapeuta_id: string }
        Returns: number
      }
      es_terapeuta_de: { Args: { p_paciente_id: string }; Returns: boolean }
      es_terapeuta_verificado: {
        Args: { p_profile_id: string }
        Returns: boolean
      }
      generar_codigo_invitacion: { Args: never; Returns: string }
      mi_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      paciente_autoriza_alerta_crisis: {
        Args: { p_paciente_id: string }
        Returns: boolean
      }
      profile_id: { Args: never; Returns: string }
      recalcular_ranking_terapeutas: { Args: never; Returns: number }
      recontar_pacientes_activos: {
        Args: { p_terapeuta_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      soy_parte_de_sesion: { Args: { p_sesion_id: string }; Returns: boolean }
    }
    Enums: {
      accion_auditoria:
        | "insert"
        | "update"
        | "delete"
        | "view_sensitive"
        | "export"
        | "crisis_triggered"
        | "ai_generated"
      estado_sesion: "programada" | "realizada" | "cancelada" | "reagendada"
      estado_tarea: "pendiente" | "en_progreso" | "completada" | "omitida"
      estado_verificacion:
        | "sin_verificar"
        | "en_revision"
        | "verificado"
        | "rechazado"
      estado_vinculacion:
        | "pendiente"
        | "activa"
        | "pausada"
        | "finalizada"
        | "archivada"
      familia_emocional:
        | "tranquilo"
        | "ansioso"
        | "triste"
        | "cansado"
        | "feliz"
      frecuencia_tarea:
        | "unica"
        | "diaria"
        | "semanal"
        | "mensual"
        | "personalizada"
      gravedad_crisis: "orientacion" | "moderada" | "alta" | "critica"
      modalidad_sesion: "presencial" | "online" | "hibrida"
      nivel_contenido: "inicial" | "intermedio" | "avanzado"
      nivel_privacidad: "privado" | "compartido" | "marcado_sesion"
      plan_terapeuta: "gratuito" | "prueba_premium" | "activo" | "cancelado"
      rol_usuario: "terapeuta" | "paciente" | "sin_terapeuta" | "admin"
      tipo_consentimiento:
        | "terminos_servicio"
        | "aviso_privacidad"
        | "consentimiento_informado"
        | "compartir_con_terapeuta"
        | "recibir_alertas_crisis"
        | "uso_ia_resumenes"
      tipo_contenido:
        | "video"
        | "audio"
        | "guia"
        | "curso"
        | "ejercicio"
        | "lectura"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      accion_auditoria: [
        "insert",
        "update",
        "delete",
        "view_sensitive",
        "export",
        "crisis_triggered",
        "ai_generated",
      ],
      estado_sesion: ["programada", "realizada", "cancelada", "reagendada"],
      estado_tarea: ["pendiente", "en_progreso", "completada", "omitida"],
      estado_verificacion: [
        "sin_verificar",
        "en_revision",
        "verificado",
        "rechazado",
      ],
      estado_vinculacion: [
        "pendiente",
        "activa",
        "pausada",
        "finalizada",
        "archivada",
      ],
      familia_emocional: ["tranquilo", "ansioso", "triste", "cansado", "feliz"],
      frecuencia_tarea: [
        "unica",
        "diaria",
        "semanal",
        "mensual",
        "personalizada",
      ],
      gravedad_crisis: ["orientacion", "moderada", "alta", "critica"],
      modalidad_sesion: ["presencial", "online", "hibrida"],
      nivel_contenido: ["inicial", "intermedio", "avanzado"],
      nivel_privacidad: ["privado", "compartido", "marcado_sesion"],
      plan_terapeuta: ["gratuito", "prueba_premium", "activo", "cancelado"],
      rol_usuario: ["terapeuta", "paciente", "sin_terapeuta", "admin"],
      tipo_consentimiento: [
        "terminos_servicio",
        "aviso_privacidad",
        "consentimiento_informado",
        "compartir_con_terapeuta",
        "recibir_alertas_crisis",
        "uso_ia_resumenes",
      ],
      tipo_contenido: [
        "video",
        "audio",
        "guia",
        "curso",
        "ejercicio",
        "lectura",
      ],
    },
  },
} as const

