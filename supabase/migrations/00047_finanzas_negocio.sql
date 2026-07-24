-- =============================================================================
-- NOEMA · 00047 · Finanzas de negocio para el terapeuta (R4-2)
-- =============================================================================
-- Amplía el panel financiero (que hoy solo tiene pagos de pacientes) con:
--  · movimientos: otros ingresos, gastos fijos, gastos variables e impuestos.
--  · activos: equipo, mobiliario, tecnología (con su valor).
--  · config: tasa de impuestos estimada para proyectar la carga fiscal.
-- Todo por terapeuta, con RLS. Idempotente.
-- =============================================================================

do $$ begin
  create type tipo_movimiento_fin as enum (
    'ingreso_otro', 'gasto_fijo', 'gasto_variable', 'impuesto'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.finanzas_movimientos (
  id           uuid primary key default gen_random_uuid(),
  terapeuta_id uuid not null references public.terapeutas(profile_id) on delete cascade,
  tipo         tipo_movimiento_fin not null,
  categoria    text,                         -- 'renta','servicios','marketing','ISR'…
  concepto     text not null,
  monto        numeric(12,2) not null check (monto >= 0),
  fecha        date not null default current_date,
  recurrente   boolean not null default false, -- gasto fijo mensual
  notas        text,
  creado_at    timestamptz not null default now()
);

create index if not exists finanzas_mov_terapeuta_idx
  on public.finanzas_movimientos (terapeuta_id, fecha desc);

alter table public.finanzas_movimientos enable row level security;
drop policy if exists finanzas_mov_propio on public.finanzas_movimientos;
create policy finanzas_mov_propio on public.finanzas_movimientos
  for all using (terapeuta_id = auth.uid()) with check (terapeuta_id = auth.uid());

create table if not exists public.finanzas_activos (
  id                 uuid primary key default gen_random_uuid(),
  terapeuta_id       uuid not null references public.terapeutas(profile_id) on delete cascade,
  nombre             text not null,
  categoria          text,          -- 'equipo','mobiliario','tecnologia','otro'
  valor              numeric(12,2) not null check (valor >= 0),
  fecha_adquisicion  date,
  notas              text,
  creado_at          timestamptz not null default now()
);

create index if not exists finanzas_activos_terapeuta_idx
  on public.finanzas_activos (terapeuta_id);

alter table public.finanzas_activos enable row level security;
drop policy if exists finanzas_activos_propio on public.finanzas_activos;
create policy finanzas_activos_propio on public.finanzas_activos
  for all using (terapeuta_id = auth.uid()) with check (terapeuta_id = auth.uid());

create table if not exists public.finanzas_config (
  terapeuta_id       uuid primary key references public.terapeutas(profile_id) on delete cascade,
  tasa_impuesto_pct  numeric(5,2) not null default 0,  -- % estimado sobre ingresos
  notas              text,
  actualizado_at     timestamptz not null default now()
);

alter table public.finanzas_config enable row level security;
drop policy if exists finanzas_config_propio on public.finanzas_config;
create policy finanzas_config_propio on public.finanzas_config
  for all using (terapeuta_id = auth.uid()) with check (terapeuta_id = auth.uid());
