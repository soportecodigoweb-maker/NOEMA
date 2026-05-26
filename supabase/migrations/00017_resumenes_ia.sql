-- ============================================================================
-- 00016_resumenes_ia.sql
--
-- Histórico de resúmenes generados por IA (Claude) para pre-sesión.
-- Cada resumen está atado a una vinculación + período + generado_por terapeuta.
--
-- GUARDRAILS CRÍTICOS (BIBLIA §13):
--   - La función generadora SOLO lee registros con privacidad in
--     ('compartido', 'marcado_sesion'). Nunca toca 'privado'.
--   - Los resúmenes son sugerencias operativas, no diagnósticos. El terapeuta
--     siempre conserva acceso a la fuente original.
--   - El paciente puede ver qué resúmenes se generaron sobre su información
--     (auditoría) desde su app.
-- ============================================================================

create table public.resumenes_ia (
  id                  uuid primary key default gen_random_uuid(),
  vinculacion_id      uuid not null references public.vinculaciones(id) on delete cascade,
  generado_por        uuid not null references public.profiles(id),

  -- Período cubierto
  periodo_desde       date not null,
  periodo_hasta       date not null,

  -- Datos de entrada (para auditoría)
  registros_count     int not null default 0,
  diario_count        int not null default 0,

  -- Output estructurado (JSON)
  -- { temas: [{titulo, evidencia[], frecuencia}], intensidad_media, picos[],
  --   alertas[], sugerencias_exploracion[] }
  resumen_json        jsonb not null,
  -- Versión legible del resumen para mostrar directo en UI
  resumen_md          text not null,

  -- Metadatos del modelo
  modelo              text not null default 'claude-sonnet-4-5',
  tokens_input        int,
  tokens_output       int,

  creado_at           timestamptz not null default now()
);

create index resumenes_ia_vinculacion_idx
  on public.resumenes_ia(vinculacion_id, creado_at desc);

comment on table public.resumenes_ia is
  'Resúmenes pre-sesión generados por IA. Nunca lee diario privado ni registros privados.';

-- RLS
alter table public.resumenes_ia enable row level security;

-- El terapeuta dueño de la vinculación puede ver sus resúmenes
create policy "terapeuta_ve_resumenes_propios" on public.resumenes_ia
  for select
  to authenticated
  using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = resumenes_ia.vinculacion_id
        and v.terapeuta_id = auth.uid()
    )
  );

-- El paciente puede ver auditoría (metadatos, no el contenido) de los resúmenes
-- generados sobre él
create policy "paciente_ve_metadatos_resumenes" on public.resumenes_ia
  for select
  to authenticated
  using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = resumenes_ia.vinculacion_id
        and v.paciente_id = auth.uid()
    )
  );

-- Solo Edge Functions (service_role) pueden insertar
create policy "service_role_inserta_resumenes" on public.resumenes_ia
  for insert
  to service_role
  with check (true);
