-- =============================================================================
-- NOEMA · 00014 · Auditoría
-- =============================================================================
-- Registra accesos a datos sensibles, exportaciones, generaciones de IA y
-- activaciones del módulo de crisis. Trazabilidad para cumplir LFPDPPP y
-- principio de privacidad.
-- =============================================================================

create table public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  tabla           text not null,
  registro_id     text, -- text para soportar PKs no-uuid
  accion          accion_auditoria not null,
  actor_id        uuid references public.profiles(id),
  actor_rol       rol_usuario,
  contexto        jsonb not null default '{}'::jsonb,
  ip              inet,
  user_agent      text,
  creado_at       timestamptz not null default now()
);

comment on table public.audit_log is 'Auditoría de accesos a datos sensibles. Append-only por RLS.';

create index audit_log_tabla_idx on public.audit_log(tabla, creado_at desc);
create index audit_log_actor_idx on public.audit_log(actor_id, creado_at desc);
create index audit_log_accion_idx on public.audit_log(accion, creado_at desc);

-- Función helper para escribir al log desde otros triggers / RPC -------------

create or replace function private.audit(
  p_tabla text,
  p_registro_id text,
  p_accion accion_auditoria,
  p_contexto jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (tabla, registro_id, accion, actor_id, actor_rol, contexto)
  values (
    p_tabla,
    p_registro_id,
    p_accion,
    auth.uid(),
    (select rol from public.profiles where id = auth.uid()),
    p_contexto
  );
end;
$$;

-- Trigger genérico para auditar UPDATE/DELETE en tablas sensibles ------------

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
begin
  v_id := coalesce((to_jsonb(coalesce(new, old))->>'id'), 'unknown');
  perform private.audit(
    tg_table_name,
    v_id,
    case
      when tg_op = 'INSERT' then 'insert'::accion_auditoria
      when tg_op = 'UPDATE' then 'update'::accion_auditoria
      when tg_op = 'DELETE' then 'delete'::accion_auditoria
    end,
    jsonb_build_object('op', tg_op)
  );
  return coalesce(new, old);
end;
$$;

-- Aplicamos auditoría a las tablas más sensibles
create trigger audit_alertas_crisis
  after insert or update or delete on public.alertas_crisis
  for each row execute function private.audit_row_change();

create trigger audit_sesion_notas
  after insert or update or delete on public.sesion_notas
  for each row execute function private.audit_row_change();

create trigger audit_consentimientos
  after insert on public.consentimientos
  for each row execute function private.audit_row_change();

alter table public.audit_log enable row level security;
