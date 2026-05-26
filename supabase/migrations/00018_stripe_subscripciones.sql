-- ============================================================================
-- 00018_stripe_subscripciones.sql
--
-- Suscripciones de Stripe para terapeutas.
-- Modelo: $100 MXN por paciente activo por mes.
-- Maneja: customer, suscripción, eventos webhook.
-- ============================================================================

-- Customer de Stripe asociado al terapeuta
alter table public.terapeutas
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists trial_termina_at timestamptz,
  add column if not exists plan_estado text not null default 'sin_pago'
    check (plan_estado in ('sin_pago', 'trial', 'activa', 'pago_fallido', 'cancelada'));

comment on column public.terapeutas.plan_estado is
  'Estado del pago del terapeuta. Mapea a los estados de Stripe.';

-- Eventos crudos de Stripe (para idempotencia de webhooks)
create table public.stripe_eventos (
  id              text primary key,             -- stripe event id
  tipo            text not null,                -- ej: invoice.paid
  payload         jsonb not null,
  procesado_at    timestamptz,
  recibido_at     timestamptz not null default now()
);

create index stripe_eventos_tipo_idx on public.stripe_eventos(tipo, recibido_at desc);

-- Historial de facturas (para que el terapeuta vea su histórico)
create table public.stripe_facturas (
  id                  text primary key,         -- stripe invoice id
  terapeuta_id        uuid not null references public.profiles(id) on delete cascade,
  monto_centavos      int not null,
  moneda              text not null default 'mxn',
  estado              text not null,            -- paid, open, void, uncollectible
  pacientes_count     int,                      -- snapshot de pacientes activos cobrados
  periodo_inicio      timestamptz,
  periodo_fin         timestamptz,
  url_factura         text,
  url_pdf             text,
  pagada_at           timestamptz,
  creada_at           timestamptz not null default now()
);

create index stripe_facturas_terapeuta_idx
  on public.stripe_facturas(terapeuta_id, creada_at desc);

-- RLS
alter table public.stripe_eventos enable row level security;
alter table public.stripe_facturas enable row level security;

-- Solo service_role escribe en stripe_eventos
create policy "service_role_stripe_eventos" on public.stripe_eventos
  for all to service_role using (true) with check (true);

-- Terapeuta ve sus propias facturas
create policy "terapeuta_ve_facturas_propias" on public.stripe_facturas
  for select
  to authenticated
  using (terapeuta_id = auth.uid());

-- Solo service_role escribe facturas
create policy "service_role_inserta_facturas" on public.stripe_facturas
  for insert
  to service_role
  with check (true);
