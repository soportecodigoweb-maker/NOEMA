-- =============================================================================
-- NOEMA · 00006 · Diario personal del paciente
-- =============================================================================
-- A diferencia del registro emocional (estructurado), el diario es escritura
-- libre. Tiene los mismos 3 niveles de privacidad — y el nivel "privado" es
-- INVIOLABLE: ni el terapeuta ni el sistema lo leen (BIBLIA §12).
-- =============================================================================

create table public.diario_entradas (
  id              uuid primary key default gen_random_uuid(),
  paciente_id     uuid not null references public.pacientes(profile_id) on delete cascade,
  fecha           date not null default current_date,
  titulo          text,
  contenido       text not null,
  privacidad      nivel_privacidad not null default 'privado',
  tags            text[] not null default array[]::text[],

  -- Campos para análisis solo si privacidad <> 'privado'
  -- (las funciones de IA NUNCA tocan entradas privadas)
  resumen_ia      text, -- generado solo si privacidad in ('compartido','marcado_sesion')
  resumen_ia_at   timestamptz,

  creado_at       timestamptz not null default now(),
  actualizado_at  timestamptz not null default now()
);

comment on table public.diario_entradas is 'Diario personal. El nivel "privado" es inviolable: ni el terapeuta ni la IA lo leen.';
comment on column public.diario_entradas.resumen_ia is 'Solo se llena si privacidad <> privado. La generación tiene guardrails (ver packages/ai).';

create index diario_paciente_fecha_idx on public.diario_entradas(paciente_id, fecha desc);
create index diario_marcado_idx on public.diario_entradas(paciente_id)
  where privacidad = 'marcado_sesion';
create index diario_tags_idx on public.diario_entradas using gin(tags);

create trigger diario_set_actualizado_at
  before update on public.diario_entradas
  for each row execute function public.set_actualizado_at();

-- Función trigger: si el paciente baja la privacidad a "privado", borrar el resumen IA
create or replace function public.borrar_resumen_si_privado()
returns trigger
language plpgsql
as $$
begin
  if new.privacidad = 'privado' then
    new.resumen_ia := null;
    new.resumen_ia_at := null;
  end if;
  return new;
end;
$$;

create trigger diario_borrar_resumen_si_privado
  before update on public.diario_entradas
  for each row
  when (new.privacidad = 'privado' and old.privacidad <> 'privado')
  execute function public.borrar_resumen_si_privado();

alter table public.diario_entradas enable row level security;
