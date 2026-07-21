-- =============================================================================
-- NOEMA · 00035 · Pagos de pacientes al terapeuta (#9, #10, #11)
-- =============================================================================
-- El terapeuta registra los pagos que recibe de sus pacientes. Soporta pagos
-- en efectivo/transferencia (registro MANUAL) y en línea (futuro Stripe).
-- =============================================================================

do $$ begin
  create type metodo_pago as enum ('efectivo', 'transferencia', 'tarjeta', 'en_linea', 'otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_pago as enum ('pagado', 'pendiente');
exception when duplicate_object then null; end $$;

create table if not exists public.pagos_pacientes (
  id            uuid primary key default gen_random_uuid(),
  terapeuta_id  uuid not null references public.terapeutas(profile_id) on delete cascade,
  vinculacion_id uuid references public.vinculaciones(id) on delete set null,
  monto         numeric(10,2) not null check (monto >= 0),
  moneda        text not null default 'MXN',
  concepto      text,                       -- "Sesión 12", "Mensualidad julio"
  metodo        metodo_pago not null default 'efectivo',
  estado        estado_pago not null default 'pagado',
  fecha         date not null default current_date,
  notas         text,
  creado_at     timestamptz not null default now()
);

comment on table public.pagos_pacientes is
  'Pagos que el terapeuta recibe de sus pacientes. Registro manual (efectivo) o en línea.';

create index if not exists pagos_terapeuta_idx on public.pagos_pacientes(terapeuta_id, fecha desc);
create index if not exists pagos_vinculacion_idx on public.pagos_pacientes(vinculacion_id);

alter table public.pagos_pacientes enable row level security;

-- Solo el terapeuta dueño gestiona sus pagos.
create policy pagos_terapeuta_all on public.pagos_pacientes
  for all using (terapeuta_id = auth.uid()) with check (terapeuta_id = auth.uid());

-- Demo: algunos pagos de María para Andrea.
do $$
declare
  v_terapeuta uuid;
  v_vinc uuid;
begin
  select id into v_vinc from public.vinculaciones where codigo_invitacion = 'NOEMA-D23Y';
  if v_vinc is not null then
    select terapeuta_id into v_terapeuta from public.vinculaciones where id = v_vinc;
    if not exists (select 1 from public.pagos_pacientes where vinculacion_id = v_vinc) then
      insert into public.pagos_pacientes (terapeuta_id, vinculacion_id, monto, concepto, metodo, fecha) values
        (v_terapeuta, v_vinc, 800.00, 'Sesión inicial', 'efectivo', current_date - 40),
        (v_terapeuta, v_vinc, 800.00, 'Sesión de seguimiento', 'transferencia', current_date - 12),
        (v_terapeuta, v_vinc, 800.00, 'Sesión de seguimiento', 'efectivo', current_date - 5);
      insert into public.pagos_pacientes (terapeuta_id, vinculacion_id, monto, concepto, metodo, estado, fecha) values
        (v_terapeuta, v_vinc, 800.00, 'Próxima sesión', 'efectivo', 'pendiente', current_date + 2);
    end if;
  end if;
end $$;
