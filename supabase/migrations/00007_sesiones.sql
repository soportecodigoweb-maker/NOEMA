-- =============================================================================
-- NOEMA · 00007 · Sesiones y notas de sesión
-- =============================================================================
-- Cada sesión es un evento en la línea de tiempo de la vinculación. El terapeuta
-- escribe notas (algunas privadas) y define un plan/tareas para la próxima.
-- =============================================================================

create table public.sesiones (
  id                  uuid primary key default gen_random_uuid(),
  vinculacion_id      uuid not null references public.vinculaciones(id) on delete cascade,

  -- Programación
  fecha_programada    timestamptz not null,
  duracion_min        int not null default 60 check (duracion_min > 0),
  modalidad           modalidad_sesion not null default 'online',
  link_videollamada   text,
  ubicacion           text,

  -- Realización
  fecha_realizada     timestamptz,
  estado              estado_sesion not null default 'programada',
  motivo_cancelacion  text,

  -- Numeración consecutiva por vinculación (la asigna trigger)
  numero              int,

  creado_at           timestamptz not null default now(),
  actualizado_at      timestamptz not null default now()
);

comment on table public.sesiones is 'Sesiones programadas/realizadas dentro de una vinculación.';

create index sesiones_vinculacion_idx on public.sesiones(vinculacion_id, fecha_programada desc);
create index sesiones_proximas_idx on public.sesiones(vinculacion_id, fecha_programada)
  where estado = 'programada';

create trigger sesiones_set_actualizado_at
  before update on public.sesiones
  for each row execute function public.set_actualizado_at();

-- Trigger para asignar número consecutivo por vinculación
create or replace function public.asignar_numero_sesion()
returns trigger
language plpgsql
as $$
begin
  if new.numero is null then
    select coalesce(max(numero), 0) + 1 into new.numero
    from public.sesiones
    where vinculacion_id = new.vinculacion_id;
  end if;
  return new;
end;
$$;

create trigger sesiones_asignar_numero
  before insert on public.sesiones
  for each row execute function public.asignar_numero_sesion();

-- =============================================================================
-- Notas de sesión (escritas por el terapeuta)
-- =============================================================================

create table public.sesion_notas (
  id                      uuid primary key default gen_random_uuid(),
  sesion_id               uuid not null references public.sesiones(id) on delete cascade,
  autor_id                uuid not null references public.profiles(id),

  -- Contenido visible para el paciente (si autor decide compartir)
  contenido_publico       text,
  -- Notas privadas del terapeuta (NUNCA visibles para el paciente)
  contenido_privado       text,

  objetivos_trabajados    text[] not null default array[]::text[],
  plan_proxima_sesion     text,

  -- ¿El paciente puede ver el contenido_publico?
  visible_paciente        boolean not null default true,

  creado_at               timestamptz not null default now(),
  actualizado_at          timestamptz not null default now()
);

comment on table public.sesion_notas is 'Notas de sesión. contenido_privado es inviolable para el paciente.';
comment on column public.sesion_notas.contenido_privado is 'Notas clínicas del terapeuta. RLS impide acceso del paciente. Cifrado adicional recomendado.';

create index sesion_notas_sesion_idx on public.sesion_notas(sesion_id);

create trigger sesion_notas_set_actualizado_at
  before update on public.sesion_notas
  for each row execute function public.set_actualizado_at();

-- Helper: ¿esta sesión pertenece a una vinculación donde yo soy parte? --------

create or replace function public.soy_parte_de_sesion(p_sesion_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sesiones s
    join public.vinculaciones v on v.id = s.vinculacion_id
    where s.id = p_sesion_id
      and (v.terapeuta_id = auth.uid() or v.paciente_id = auth.uid())
  );
$$;

grant execute on function public.soy_parte_de_sesion(uuid) to authenticated;

alter table public.sesiones enable row level security;
alter table public.sesion_notas enable row level security;
