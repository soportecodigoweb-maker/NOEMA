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
      adjuntos: {
        Row: {
          archivado: boolean
          creado_at: string
          descripcion: string | null
          id: string
          nombre: string
          ruta: string
          subido_por: string
          tamano_bytes: number | null
          tipo_mime: string | null
          vinculacion_id: string
        }
        Insert: {
          archivado?: boolean
          creado_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          ruta: string
          subido_por: string
          tamano_bytes?: number | null
          tipo_mime?: string | null
          vinculacion_id: string
        }
        Update: {
          archivado?: boolean
          creado_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          ruta?: string
          subido_por?: string
          tamano_bytes?: number | null
          tipo_mime?: string | null
          vinculacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adjuntos_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adjuntos_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "adjuntos_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
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
      configuracion_terapeuta: {
        Row: {
          actualizado_at: string
          agenda_habilitada: boolean
          chat_habilitado: boolean
          diario_habilitado: boolean
          mensajes_ia_habilitados: boolean
          no_molestar_activo: boolean
          no_molestar_desde: string
          no_molestar_hasta: string
          notif_crisis: boolean
          notif_mensajes: boolean
          notif_paciente: boolean
          notif_registros: boolean
          notif_sonido: string
          notif_tareas: boolean
          progreso_habilitado: boolean
          registros_habilitados: boolean
          sos_habilitado: boolean
          tareas_habilitadas: boolean
          terapeuta_id: string
        }
        Insert: {
          terapeuta_id: string
          actualizado_at?: string
          agenda_habilitada?: boolean
          chat_habilitado?: boolean
          diario_habilitado?: boolean
          mensajes_ia_habilitados?: boolean
          no_molestar_activo?: boolean
          no_molestar_desde?: string
          no_molestar_hasta?: string
          notif_crisis?: boolean
          notif_mensajes?: boolean
          notif_paciente?: boolean
          notif_registros?: boolean
          notif_sonido?: string
          notif_tareas?: boolean
          progreso_habilitado?: boolean
          registros_habilitados?: boolean
          sos_habilitado?: boolean
          tareas_habilitadas?: boolean
        }
        Update: {
          actualizado_at?: string
          agenda_habilitada?: boolean
          chat_habilitado?: boolean
          diario_habilitado?: boolean
          mensajes_ia_habilitados?: boolean
          no_molestar_activo?: boolean
          no_molestar_desde?: string
          no_molestar_hasta?: string
          notif_crisis?: boolean
          notif_mensajes?: boolean
          notif_paciente?: boolean
          notif_registros?: boolean
          notif_sonido?: string
          notif_tareas?: boolean
          progreso_habilitado?: boolean
          registros_habilitados?: boolean
          sos_habilitado?: boolean
          tareas_habilitadas?: boolean
          terapeuta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_terapeuta_terapeuta_id_fkey"
            columns: ["terapeuta_id"]
            isOneToOne: true
            referencedRelation: "terapeutas"
            referencedColumns: ["profile_id"]
          },
        ]
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
      expediente_inicial: {
        Row: {
          actualizado_at: string
          antecedentes_familiares: string | null
          antecedentes_personales: string | null
          elaborado_por: string | null
          examen_mental: string | null
          fecha_elaboracion: string
          impresion_diagnostica: string | null
          motivo_consulta: string | null
          padecimiento_actual: string | null
          plan_terapeutico: string | null
          pronostico: string | null
          vinculacion_id: string
        }
        Insert: {
          actualizado_at?: string
          antecedentes_familiares?: string | null
          antecedentes_personales?: string | null
          elaborado_por?: string | null
          examen_mental?: string | null
          fecha_elaboracion?: string
          impresion_diagnostica?: string | null
          motivo_consulta?: string | null
          padecimiento_actual?: string | null
          plan_terapeutico?: string | null
          pronostico?: string | null
          vinculacion_id: string
        }
        Update: {
          actualizado_at?: string
          antecedentes_familiares?: string | null
          antecedentes_personales?: string | null
          elaborado_por?: string | null
          examen_mental?: string | null
          fecha_elaboracion?: string
          impresion_diagnostica?: string | null
          motivo_consulta?: string | null
          padecimiento_actual?: string | null
          plan_terapeutico?: string | null
          pronostico?: string | null
          vinculacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expediente_inicial_elaborado_por_fkey"
            columns: ["elaborado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expediente_inicial_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: true
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "expediente_inicial_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: true
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      finanzas_activos: {
        Row: {
          categoria: string | null
          creado_at: string
          fecha_adquisicion: string | null
          id: string
          nombre: string
          notas: string | null
          terapeuta_id: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          creado_at?: string
          fecha_adquisicion?: string | null
          id?: string
          nombre: string
          notas?: string | null
          terapeuta_id: string
          valor: number
        }
        Update: {
          categoria?: string | null
          creado_at?: string
          fecha_adquisicion?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          terapeuta_id?: string
          valor?: number
        }
        Relationships: []
      }
      finanzas_config: {
        Row: {
          actualizado_at: string
          notas: string | null
          tasa_impuesto_pct: number
          terapeuta_id: string
        }
        Insert: {
          actualizado_at?: string
          notas?: string | null
          tasa_impuesto_pct?: number
          terapeuta_id: string
        }
        Update: {
          actualizado_at?: string
          notas?: string | null
          tasa_impuesto_pct?: number
          terapeuta_id?: string
        }
        Relationships: []
      }
      finanzas_movimientos: {
        Row: {
          categoria: string | null
          concepto: string
          creado_at: string
          fecha: string
          id: string
          monto: number
          notas: string | null
          recurrente: boolean
          terapeuta_id: string
          tipo: Database["public"]["Enums"]["tipo_movimiento_fin"]
        }
        Insert: {
          categoria?: string | null
          concepto: string
          creado_at?: string
          fecha?: string
          id?: string
          monto: number
          notas?: string | null
          recurrente?: boolean
          terapeuta_id: string
          tipo: Database["public"]["Enums"]["tipo_movimiento_fin"]
        }
        Update: {
          categoria?: string | null
          concepto?: string
          creado_at?: string
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          recurrente?: boolean
          terapeuta_id?: string
          tipo?: Database["public"]["Enums"]["tipo_movimiento_fin"]
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
      mensajes_autoayuda: {
        Row: {
          accion: string | null
          contexto: Database["public"]["Enums"]["contexto_autoayuda"]
          creado_at: string
          enfoque: Database["public"]["Enums"]["enfoque_autoayuda"]
          id: string
          objetivo: Database["public"]["Enums"]["objetivo_autoayuda"]
          publicado: boolean
          riesgo_maximo: Database["public"]["Enums"]["nivel_riesgo"]
          texto: string
        }
        Insert: {
          accion?: string | null
          contexto?: Database["public"]["Enums"]["contexto_autoayuda"]
          creado_at?: string
          enfoque: Database["public"]["Enums"]["enfoque_autoayuda"]
          id?: string
          objetivo: Database["public"]["Enums"]["objetivo_autoayuda"]
          publicado?: boolean
          riesgo_maximo?: Database["public"]["Enums"]["nivel_riesgo"]
          texto: string
        }
        Update: {
          accion?: string | null
          contexto?: Database["public"]["Enums"]["contexto_autoayuda"]
          creado_at?: string
          enfoque?: Database["public"]["Enums"]["enfoque_autoayuda"]
          id?: string
          objetivo?: Database["public"]["Enums"]["objetivo_autoayuda"]
          publicado?: boolean
          riesgo_maximo?: Database["public"]["Enums"]["nivel_riesgo"]
          texto?: string
        }
        Relationships: []
      }
      mensajes_autoayuda_enviados: {
        Row: {
          contexto: Database["public"]["Enums"]["contexto_autoayuda"]
          enviado_at: string
          id: string
          mensaje_id: string
          paciente_id: string
        }
        Insert: {
          contexto?: Database["public"]["Enums"]["contexto_autoayuda"]
          enviado_at?: string
          id?: string
          mensaje_id: string
          paciente_id: string
        }
        Update: {
          contexto?: Database["public"]["Enums"]["contexto_autoayuda"]
          enviado_at?: string
          id?: string
          mensaje_id?: string
          paciente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_autoayuda_enviados_mensaje_id_fkey"
            columns: ["mensaje_id"]
            isOneToOne: false
            referencedRelation: "mensajes_autoayuda"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensajes_autoayuda_enviados_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      mensajes_noema: {
        Row: {
          basado_en: Json
          generado_at: string
          id: string
          modelo: string | null
          origen: string
          paciente_id: string
          texto: string
          visto_at: string | null
        }
        Insert: {
          basado_en?: Json
          generado_at?: string
          id?: string
          modelo?: string | null
          origen?: string
          paciente_id: string
          texto: string
          visto_at?: string | null
        }
        Update: {
          basado_en?: Json
          generado_at?: string
          id?: string
          modelo?: string | null
          origen?: string
          paciente_id?: string
          texto?: string
          visto_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_noema_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      mensajes_rapidos: {
        Row: {
          creado_at: string
          id: string
          orden: number
          terapeuta_id: string
          texto: string
          vinculacion_id: string | null
        }
        Insert: {
          creado_at?: string
          id?: string
          orden?: number
          terapeuta_id: string
          texto: string
          vinculacion_id?: string | null
        }
        Update: {
          creado_at?: string
          id?: string
          orden?: number
          terapeuta_id?: string
          texto?: string
          vinculacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensajes_rapidos_terapeuta_id_fkey"
            columns: ["terapeuta_id"]
            isOneToOne: false
            referencedRelation: "terapeutas"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "mensajes_rapidos_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          creada_at: string
          cuerpo: string | null
          destinatario_id: string
          id: string
          leida_at: string | null
          tipo: string
          titulo: string
          url: string | null
          vinculacion_id: string | null
        }
        Insert: {
          creada_at?: string
          cuerpo?: string | null
          destinatario_id: string
          id?: string
          leida_at?: string | null
          tipo: string
          titulo: string
          url?: string | null
          vinculacion_id?: string | null
        }
        Update: {
          creada_at?: string
          cuerpo?: string | null
          destinatario_id?: string
          id?: string
          leida_at?: string | null
          tipo?: string
          titulo?: string
          url?: string | null
          vinculacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_vinculacion_id_fkey"
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
          tutor_consentimiento_at: string | null
          tutor_nombre: string | null
          tutor_relacion: string | null
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
          tutor_consentimiento_at?: string | null
          tutor_nombre?: string | null
          tutor_relacion?: string | null
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
          tutor_consentimiento_at?: string | null
          tutor_nombre?: string | null
          tutor_relacion?: string | null
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
      pagos_pacientes: {
        Row: {
          concepto: string | null
          creado_at: string
          estado: Database["public"]["Enums"]["estado_pago"]
          fecha: string
          id: string
          metodo: Database["public"]["Enums"]["metodo_pago"]
          moneda: string
          monto: number
          notas: string | null
          terapeuta_id: string
          vinculacion_id: string | null
        }
        Insert: {
          concepto?: string | null
          creado_at?: string
          estado?: Database["public"]["Enums"]["estado_pago"]
          fecha?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pago"]
          moneda?: string
          monto: number
          notas?: string | null
          terapeuta_id: string
          vinculacion_id?: string | null
        }
        Update: {
          concepto?: string | null
          creado_at?: string
          estado?: Database["public"]["Enums"]["estado_pago"]
          fecha?: string
          id?: string
          metodo?: Database["public"]["Enums"]["metodo_pago"]
          moneda?: string
          monto?: number
          notas?: string | null
          terapeuta_id?: string
          vinculacion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pagos_pacientes_terapeuta_id_fkey"
            columns: ["terapeuta_id"]
            isOneToOne: false
            referencedRelation: "terapeutas"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "pagos_pacientes_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "pagos_pacientes_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: false
            referencedRelation: "vinculaciones"
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
          auto_logout_habilitado: boolean
          avatar_url: string | null
          bio: string | null
          ciudad: string | null
          creado_at: string
          eliminada_at: string | null
          email: string
          estado_cuenta: string
          id: string
          modo_aprendiz: boolean
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
          auto_logout_habilitado?: boolean
          avatar_url?: string | null
          bio?: string | null
          ciudad?: string | null
          creado_at?: string
          eliminada_at?: string | null
          email: string
          estado_cuenta?: string
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
          auto_logout_habilitado?: boolean
          avatar_url?: string | null
          bio?: string | null
          ciudad?: string | null
          creado_at?: string
          eliminada_at?: string | null
          email?: string
          estado_cuenta?: string
          id?: string
          modo_aprendiz?: boolean
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
      notas_privadas: {
        Row: {
          actualizado_at: string
          contenido: string
          creado_at: string
          id: string
          terapeuta_id: string
          titulo: string | null
          vinculacion_id: string
        }
        Insert: {
          actualizado_at?: string
          contenido?: string
          creado_at?: string
          id?: string
          terapeuta_id: string
          titulo?: string | null
          vinculacion_id: string
        }
        Update: {
          actualizado_at?: string
          contenido?: string
          creado_at?: string
          id?: string
          terapeuta_id?: string
          titulo?: string | null
          vinculacion_id?: string
        }
        Relationships: []
      }
      plan_apoyo: {
        Row: {
          actualizado_at: string
          contacto_nombre: string | null
          contacto_relacion: string | null
          contacto_telefono: string | null
          notificar_uso: boolean
          plan_editado_por_paciente_at: string | null
          plan_seguridad: string
          vinculacion_id: string
        }
        Insert: {
          actualizado_at?: string
          contacto_nombre?: string | null
          contacto_relacion?: string | null
          contacto_telefono?: string | null
          notificar_uso?: boolean
          plan_editado_por_paciente_at?: string | null
          plan_seguridad?: string
          vinculacion_id: string
        }
        Update: {
          actualizado_at?: string
          contacto_nombre?: string | null
          contacto_relacion?: string | null
          contacto_telefono?: string | null
          notificar_uso?: boolean
          plan_editado_por_paciente_at?: string | null
          plan_seguridad?: string
          vinculacion_id?: string
        }
        Relationships: []
      }
      plan_apoyo_recursos: {
        Row: {
          creado_at: string
          id: string
          nota: string | null
          tipo: string
          titulo: string
          url: string | null
          vinculacion_id: string
        }
        Insert: {
          creado_at?: string
          id?: string
          nota?: string | null
          tipo?: string
          titulo: string
          url?: string | null
          vinculacion_id: string
        }
        Update: {
          creado_at?: string
          id?: string
          nota?: string | null
          tipo?: string
          titulo?: string
          url?: string | null
          vinculacion_id?: string
        }
        Relationships: []
      }
      plan_apoyo_usos: {
        Row: {
          id: string
          paciente_id: string
          retro_at: string | null
          retroalimentacion: string | null
          usado_at: string
          vinculacion_id: string
        }
        Insert: {
          id?: string
          paciente_id: string
          retro_at?: string | null
          retroalimentacion?: string | null
          usado_at?: string
          vinculacion_id: string
        }
        Update: {
          id?: string
          paciente_id?: string
          retro_at?: string | null
          retroalimentacion?: string | null
          usado_at?: string
          vinculacion_id?: string
        }
        Relationships: []
      }
      recordatorios_personales: {
        Row: {
          actualizado_at: string
          completado: boolean
          completado_at: string | null
          creado_at: string
          id: string
          nota: string | null
          paciente_id: string
          recordar_at: string | null
          recurrencia: string
          tipo: 'diario' | 'corto' | 'mediano' | 'largo'
          titulo: string
        }
        Insert: {
          actualizado_at?: string
          completado?: boolean
          completado_at?: string | null
          creado_at?: string
          id?: string
          modo_aprendiz?: boolean
          nota?: string | null
          paciente_id: string
          recordar_at?: string | null
          recurrencia?: string
          tipo?: 'diario' | 'corto' | 'mediano' | 'largo'
          titulo: string
        }
        Update: {
          actualizado_at?: string
          completado?: boolean
          completado_at?: string | null
          creado_at?: string
          id?: string
          modo_aprendiz?: boolean
          nota?: string | null
          paciente_id?: string
          recordar_at?: string | null
          recurrencia?: string
          tipo?: 'diario' | 'corto' | 'mediano' | 'largo'
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordatorios_personales_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["profile_id"]
          },
        ]
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
          modo_aprendiz?: boolean
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
          modo_aprendiz?: boolean
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
      resumenes_sesion: {
        Row: {
          datos: Json
          dias: number
          generado_at: string
          id: string
          narrativa: string | null
          terapeuta_id: string
          vinculacion_id: string
        }
        Insert: {
          datos: Json
          dias?: number
          generado_at?: string
          id?: string
          narrativa?: string | null
          terapeuta_id: string
          vinculacion_id: string
        }
        Update: {
          datos?: Json
          dias?: number
          generado_at?: string
          id?: string
          narrativa?: string | null
          terapeuta_id?: string
          vinculacion_id?: string
        }
        Relationships: []
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
          retroalimentacion: string | null
          retroalimentacion_at: string | null
          retroalimentacion_por: string | null
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
          retroalimentacion?: string | null
          retroalimentacion_at?: string | null
          retroalimentacion_por?: string | null
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
          retroalimentacion?: string | null
          retroalimentacion_at?: string | null
          retroalimentacion_por?: string | null
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
            foreignKeyName: "tarea_respuestas_retroalimentacion_por_fkey"
            columns: ["retroalimentacion_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
          recursos: Json
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
          recursos?: Json
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
          recursos?: Json
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
      vinculacion_notas_privadas: {
        Row: {
          actualizado_at: string
          contenido: string
          vinculacion_id: string
        }
        Insert: {
          actualizado_at?: string
          contenido?: string
          vinculacion_id: string
        }
        Update: {
          actualizado_at?: string
          contenido?: string
          vinculacion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vinculacion_notas_privadas_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: true
            referencedRelation: "mensajes_hilos_terapeuta"
            referencedColumns: ["vinculacion_id"]
          },
          {
            foreignKeyName: "vinculacion_notas_privadas_vinculacion_id_fkey"
            columns: ["vinculacion_id"]
            isOneToOne: true
            referencedRelation: "vinculaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      vinculaciones: {
        Row: {
          actualizado_at: string
          agenda_habilitada: boolean
          chat_habilitado: boolean
          diario_habilitado: boolean
          registros_habilitados: boolean
          tareas_habilitadas: boolean
          progreso_habilitado: boolean
          mensajes_ia_habilitados: boolean
          notif_paciente: boolean
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
          nivel_riesgo: Database["public"]["Enums"]["nivel_riesgo"]
          nivel_riesgo_nota: string | null
          nombre_invitado: string | null
          notificar_crisis_terapeuta: boolean
          notificar_inactividad: boolean
          paciente_id: string | null
          sos_habilitado: boolean
          telefono_terapeuta: string | null
          terapeuta_id: string
          ultimo_periodo_facturado: string | null
          version_consentimiento: string | null
          video_crisis_url: string | null
        }
        Insert: {
          actualizado_at?: string
          agenda_habilitada?: boolean
          chat_habilitado?: boolean
          diario_habilitado?: boolean
          registros_habilitados?: boolean
          tareas_habilitadas?: boolean
          progreso_habilitado?: boolean
          mensajes_ia_habilitados?: boolean
          notif_paciente?: boolean
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
          nivel_riesgo?: Database["public"]["Enums"]["nivel_riesgo"]
          nivel_riesgo_nota?: string | null
          nombre_invitado?: string | null
          notificar_crisis_terapeuta?: boolean
          notificar_inactividad?: boolean
          paciente_id?: string | null
          sos_habilitado?: boolean
          telefono_terapeuta?: string | null
          terapeuta_id: string
          ultimo_periodo_facturado?: string | null
          version_consentimiento?: string | null
          video_crisis_url?: string | null
        }
        Update: {
          actualizado_at?: string
          agenda_habilitada?: boolean
          chat_habilitado?: boolean
          diario_habilitado?: boolean
          registros_habilitados?: boolean
          tareas_habilitadas?: boolean
          progreso_habilitado?: boolean
          mensajes_ia_habilitados?: boolean
          notif_paciente?: boolean
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
          nivel_riesgo?: Database["public"]["Enums"]["nivel_riesgo"]
          nivel_riesgo_nota?: string | null
          nombre_invitado?: string | null
          notificar_crisis_terapeuta?: boolean
          notificar_inactividad?: boolean
          paciente_id?: string | null
          sos_habilitado?: boolean
          telefono_terapeuta?: string | null
          terapeuta_id?: string
          ultimo_periodo_facturado?: string | null
          version_consentimiento?: string | null
          video_crisis_url?: string | null
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
      mensajes_autoayuda_para_paciente: {
        Args: {
          p_contexto?: Database["public"]["Enums"]["contexto_autoayuda"]
          p_limite?: number
          p_paciente_id: string
        }
        Returns: {
          accion: string | null
          contexto: Database["public"]["Enums"]["contexto_autoayuda"]
          creado_at: string
          enfoque: Database["public"]["Enums"]["enfoque_autoayuda"]
          id: string
          objetivo: Database["public"]["Enums"]["objetivo_autoayuda"]
          publicado: boolean
          riesgo_maximo: Database["public"]["Enums"]["nivel_riesgo"]
          texto: string
        }[]
        SetofOptions: {
          from: "*"
          to: "mensajes_autoayuda"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mi_rol: {
        Args: never
        Returns: Database["public"]["Enums"]["rol_usuario"]
      }
      orden_riesgo: {
        Args: { n: Database["public"]["Enums"]["nivel_riesgo"] }
        Returns: number
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
      redimir_codigo: { Args: { p_codigo: string }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      asegurar_plantillas_terapeuta: { Args: never; Returns: number }
      soy_parte_de_sesion: { Args: { p_sesion_id: string }; Returns: boolean }
      transferir_paciente: {
        Args: { p_vinculacion_id: string; p_cedula_destino: string; p_motivo?: string }
        Returns: Json
      }
    }
    Enums: {
      tipo_movimiento_fin: "ingreso_otro" | "gasto_fijo" | "gasto_variable" | "impuesto"
      accion_auditoria:
        | "insert"
        | "update"
        | "delete"
        | "view_sensitive"
        | "export"
        | "crisis_triggered"
        | "ai_generated"
      contexto_autoayuda:
        | "manana"
        | "noche"
        | "post_registro_malestar"
        | "post_inactividad"
        | "previo_sesion"
        | "general"
      enfoque_autoayuda:
        | "tcc"
        | "act"
        | "dbt"
        | "activacion_conductual"
        | "mindfulness"
        | "autocompasion"
      estado_pago: "pagado" | "pendiente"
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
      metodo_pago:
        | "efectivo"
        | "transferencia"
        | "tarjeta"
        | "en_linea"
        | "otro"
      modalidad_sesion: "presencial" | "online" | "hibrida"
      nivel_contenido: "inicial" | "intermedio" | "avanzado"
      nivel_privacidad: "privado" | "compartido" | "marcado_sesion"
      nivel_riesgo: "sin_evaluar" | "bajo" | "medio" | "alto" | "critico"
      objetivo_autoayuda:
        | "ansiedad"
        | "depresion"
        | "autoestima"
        | "relaciones"
        | "estres"
        | "regulacion_emocional"
        | "sueno"
        | "general"
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
      contexto_autoayuda: [
        "manana",
        "noche",
        "post_registro_malestar",
        "post_inactividad",
        "previo_sesion",
        "general",
      ],
      enfoque_autoayuda: [
        "tcc",
        "act",
        "dbt",
        "activacion_conductual",
        "mindfulness",
        "autocompasion",
      ],
      estado_pago: ["pagado", "pendiente"],
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
      metodo_pago: ["efectivo", "transferencia", "tarjeta", "en_linea", "otro"],
      modalidad_sesion: ["presencial", "online", "hibrida"],
      nivel_contenido: ["inicial", "intermedio", "avanzado"],
      nivel_privacidad: ["privado", "compartido", "marcado_sesion"],
      nivel_riesgo: ["sin_evaluar", "bajo", "medio", "alto", "critico"],
      objetivo_autoayuda: [
        "ansiedad",
        "depresion",
        "autoestima",
        "relaciones",
        "estres",
        "regulacion_emocional",
        "sueno",
        "general",
      ],
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
