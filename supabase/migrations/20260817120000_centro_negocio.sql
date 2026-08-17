-- Panel de negocio de la clínica: finanzas, acuerdos, recursos y comunicación.
-- Todo el acceso pasa por acciones de servidor (service role) con verificación
-- de que el terapeuta pertenece al centro.

-- 1. Configuración económica del centro.
alter table public.centros
  add column if not exists tarifa_sesion numeric(10,2) not null default 0,
  add column if not exists comision_pct numeric(5,2) not null default 0,
  add column if not exists moneda text not null default 'MXN';

-- 2. Tarifa/comisión específica por terapeuta (si difiere de la del centro).
alter table public.centro_terapeutas
  add column if not exists tarifa_sesion numeric(10,2),
  add column if not exists comision_pct numeric(5,2);

-- 3. Cobros registrados por recepción (manual) — se concilian con la actividad.
create table if not exists public.centro_cobros (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.profiles(id) on delete cascade,
  terapeuta_id uuid references public.profiles(id) on delete set null,
  vinculacion_id uuid references public.vinculaciones(id) on delete set null,
  sesion_id uuid references public.sesiones(id) on delete set null,
  monto numeric(10,2) not null,
  metodo text not null default 'efectivo',
  concepto text,
  fecha date not null default current_date,
  registrado_por uuid references public.profiles(id) on delete set null,
  creado_at timestamptz not null default now(),
  constraint cobro_metodo_chk check (metodo in ('efectivo','tarjeta','transferencia','otro'))
);

-- 4. Acuerdos legales personalizados del centro con cada terapeuta.
create table if not exists public.centro_acuerdos (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.profiles(id) on delete cascade,
  terapeuta_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  contenido text not null,
  enviado_at timestamptz not null default now(),
  firmado_at timestamptz,
  firma_nombre text
);

-- 5. Recursos que el centro comparte con sus terapeutas.
create table if not exists public.centro_recursos (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  tipo text not null default 'documento',
  url text,
  nota text,
  creado_at timestamptz not null default now()
);

-- 6. Anuncios del centro para todos sus terapeutas.
create table if not exists public.centro_anuncios (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  cuerpo text not null,
  creado_at timestamptz not null default now()
);

-- 7. Mensajería 1 a 1 entre el centro y cada terapeuta.
create table if not exists public.centro_mensajes (
  id uuid primary key default gen_random_uuid(),
  centro_id uuid not null references public.profiles(id) on delete cascade,
  terapeuta_id uuid not null references public.profiles(id) on delete cascade,
  autor_id uuid references public.profiles(id) on delete set null,
  de_centro boolean not null,
  cuerpo text not null,
  leido_at timestamptz,
  creado_at timestamptz not null default now()
);

alter table public.centro_cobros enable row level security;
alter table public.centro_acuerdos enable row level security;
alter table public.centro_recursos enable row level security;
alter table public.centro_anuncios enable row level security;
alter table public.centro_mensajes enable row level security;

-- El terapeuta puede ver lo que le corresponde (recursos, anuncios, acuerdos y
-- su conversación). El centro gestiona todo vía service role verificado.
drop policy if exists acuerdos_terapeuta_sel on public.centro_acuerdos;
create policy acuerdos_terapeuta_sel on public.centro_acuerdos
  for select using (terapeuta_id = auth.uid());

drop policy if exists recursos_terapeuta_sel on public.centro_recursos;
create policy recursos_terapeuta_sel on public.centro_recursos
  for select using (
    exists (select 1 from public.centro_terapeutas ct
            where ct.centro_id = centro_recursos.centro_id and ct.terapeuta_id = auth.uid())
  );

drop policy if exists anuncios_terapeuta_sel on public.centro_anuncios;
create policy anuncios_terapeuta_sel on public.centro_anuncios
  for select using (
    exists (select 1 from public.centro_terapeutas ct
            where ct.centro_id = centro_anuncios.centro_id and ct.terapeuta_id = auth.uid())
  );

drop policy if exists mensajes_terapeuta on public.centro_mensajes;
create policy mensajes_terapeuta on public.centro_mensajes
  for all using (terapeuta_id = auth.uid()) with check (terapeuta_id = auth.uid());

create index if not exists idx_cobros_centro on public.centro_cobros(centro_id, fecha desc);
create index if not exists idx_acuerdos_terapeuta on public.centro_acuerdos(terapeuta_id);
create index if not exists idx_recursos_centro on public.centro_recursos(centro_id, creado_at desc);
create index if not exists idx_anuncios_centro on public.centro_anuncios(centro_id, creado_at desc);
create index if not exists idx_cmensajes_par on public.centro_mensajes(centro_id, terapeuta_id, creado_at);
