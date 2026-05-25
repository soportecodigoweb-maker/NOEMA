-- =============================================================================
-- NOEMA · 00004 · Pacientes y vinculaciones
-- =============================================================================
-- Un paciente es un profile con rol='paciente' + esta fila opcional con datos
-- personales. La vinculación es la relación N:M entre terapeuta y paciente,
-- pero en la práctica un paciente activo tiene 1 vinculación activa a la vez.
--
-- Las vinculaciones se crean con un CÓDIGO único que el terapeuta comparte
-- con el paciente. El paciente lo introduce en su onboarding.
-- =============================================================================

create table public.pacientes (
  profile_id          uuid primary key references public.profiles(id) on delete cascade,
  fecha_nacimiento    date,
  genero              text, -- texto libre, no enum (respeto identidad)
  ocupacion           text,
  motivos_consulta    text[], -- libres, no clínicos
  notas_personales    text, -- privadas del paciente
  creado_at           timestamptz not null default now(),
  actualizado_at      timestamptz not null default now()
);

comment on table public.pacientes is 'Perfil personal del paciente. 1:1 con profile (rol=paciente). Datos privados, NUNCA visibles para terapeuta excepto si el paciente lo comparte explícitamente.';
comment on column public.pacientes.notas_personales is 'Notas privadísimas del paciente. Cifrado a nivel app recomendado.';

create trigger pacientes_set_actualizado_at
  before update on public.pacientes
  for each row execute function public.set_actualizado_at();

-- =============================================================================
-- Vinculaciones terapeuta ↔ paciente
-- =============================================================================

create table public.vinculaciones (
  id                          uuid primary key default gen_random_uuid(),
  terapeuta_id                uuid not null references public.terapeutas(profile_id) on delete cascade,
  paciente_id                 uuid references public.pacientes(profile_id) on delete cascade, -- null hasta que paciente acepta
  codigo_invitacion           text not null unique,
  email_invitado              citext, -- opcional, pre-llena el onboarding del paciente
  nombre_invitado             text,

  estado                      estado_vinculacion not null default 'pendiente',
  fecha_inicio                timestamptz,
  fecha_pausa                 timestamptz,
  fecha_fin                   timestamptz,
  motivo_fin                  text,

  -- Consentimiento informado (obligatorio para activar)
  consentimiento_aceptado_at  timestamptz,
  version_consentimiento      text,

  -- Configuración por paciente (qué le permite recibir el terapeuta)
  notificar_crisis_terapeuta  boolean not null default false, -- el paciente decide
  notificar_inactividad       boolean not null default true,
  notas_terapeuta_privadas    text, -- visible solo para el terapeuta dueño

  -- Facturación (Fase 7)
  facturable                  boolean not null default true,
  ultimo_periodo_facturado    date,

  creado_at                   timestamptz not null default now(),
  actualizado_at              timestamptz not null default now(),

  -- Un paciente solo puede tener una vinculación activa a la vez
  constraint unique_paciente_activo exclude (paciente_id with =) where (estado in ('activa', 'pausada') and paciente_id is not null)
);

comment on table public.vinculaciones is 'Relación terapeuta-paciente. Se crea cuando el terapeuta genera el código; se activa cuando el paciente lo introduce y acepta el consentimiento.';
comment on column public.vinculaciones.codigo_invitacion is 'Código corto único (ej. NOEMA-A3F9). Generado por trigger.';
comment on column public.vinculaciones.notificar_crisis_terapeuta is 'El paciente decide si quiere que su terapeuta reciba alertas de crisis. NO se activa por defecto.';

create index vinculaciones_terapeuta_idx on public.vinculaciones(terapeuta_id, estado);
create index vinculaciones_paciente_idx on public.vinculaciones(paciente_id, estado);
create index vinculaciones_codigo_idx on public.vinculaciones(codigo_invitacion);

create trigger vinculaciones_set_actualizado_at
  before update on public.vinculaciones
  for each row execute function public.set_actualizado_at();

-- Generación de código de invitación -----------------------------------------

-- Genera código tipo "NOEMA-A3F9" (4 caracteres alfanuméricos sin ambigüedades)
create or replace function public.generar_codigo_invitacion()
returns text
language plpgsql
as $$
declare
  -- Alfabeto sin caracteres ambiguos (0/O, 1/I, etc)
  alfabeto text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  codigo text;
  intento int := 0;
begin
  loop
    codigo := 'NOEMA-' ||
      substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1) ||
      substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1) ||
      substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1) ||
      substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    exit when not exists (select 1 from public.vinculaciones where codigo_invitacion = codigo);
    intento := intento + 1;
    if intento > 10 then
      raise exception 'No se pudo generar código único después de 10 intentos';
    end if;
  end loop;
  return codigo;
end;
$$;

-- Auto-asignar código al insertar si viene vacío
create or replace function public.asignar_codigo_vinculacion()
returns trigger
language plpgsql
as $$
begin
  if new.codigo_invitacion is null or new.codigo_invitacion = '' then
    new.codigo_invitacion := public.generar_codigo_invitacion();
  end if;
  return new;
end;
$$;

create trigger vinculaciones_asignar_codigo
  before insert on public.vinculaciones
  for each row execute function public.asignar_codigo_vinculacion();

-- Helper: ¿soy terapeuta de este paciente? ------------------------------------

create or replace function public.es_terapeuta_de(p_paciente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.vinculaciones
    where terapeuta_id = auth.uid()
      and paciente_id = p_paciente_id
      and estado in ('activa', 'pausada')
  );
$$;

-- Helper: ¿el paciente autorizó compartir crisis con su terapeuta?
create or replace function public.paciente_autoriza_alerta_crisis(p_paciente_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select notificar_crisis_terapeuta from public.vinculaciones
     where paciente_id = p_paciente_id and estado = 'activa' limit 1),
    false
  );
$$;

grant execute on function public.es_terapeuta_de(uuid) to authenticated;
grant execute on function public.paciente_autoriza_alerta_crisis(uuid) to authenticated;

alter table public.pacientes enable row level security;
alter table public.vinculaciones enable row level security;
