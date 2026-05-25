-- =============================================================================
-- NOEMA · 00009 · Mensajes paciente ↔ terapeuta
-- =============================================================================
-- Comunicación asíncrona dentro de una vinculación. Esto NO es chat 24/7 ni
-- pretende ser canal de crisis (esos van por el módulo de emergencia).
-- =============================================================================

create table public.mensajes (
  id              uuid primary key default gen_random_uuid(),
  vinculacion_id  uuid not null references public.vinculaciones(id) on delete cascade,
  autor_id        uuid not null references public.profiles(id),

  contenido       text not null,
  archivos        jsonb not null default '[]'::jsonb,

  -- Mensaje del sistema (ej. "Tarea X completada") — no escrito por humano
  es_sistema      boolean not null default false,

  leido_at        timestamptz, -- cuándo lo leyó el destinatario
  creado_at       timestamptz not null default now()
);

comment on table public.mensajes is 'Mensajería asíncrona terapeuta-paciente. No es chat ni canal de emergencia.';

create index mensajes_vinculacion_idx on public.mensajes(vinculacion_id, creado_at desc);
create index mensajes_no_leidos_idx on public.mensajes(vinculacion_id, autor_id) where leido_at is null;

-- Vista de hilos de conversación por terapeuta -------------------------------

create or replace view public.mensajes_hilos_terapeuta as
select
  v.id as vinculacion_id,
  v.terapeuta_id,
  v.paciente_id,
  p.nombre as paciente_nombre,
  p.avatar_url as paciente_avatar,
  m.contenido as ultimo_mensaje,
  m.creado_at as ultimo_mensaje_at,
  m.autor_id as ultimo_autor_id,
  (
    select count(*) from public.mensajes m2
    where m2.vinculacion_id = v.id
      and m2.autor_id <> v.terapeuta_id
      and m2.leido_at is null
  ) as no_leidos
from public.vinculaciones v
left join public.profiles p on p.id = v.paciente_id
left join lateral (
  select contenido, creado_at, autor_id
  from public.mensajes
  where vinculacion_id = v.id
  order by creado_at desc
  limit 1
) m on true
where v.estado in ('activa', 'pausada');

comment on view public.mensajes_hilos_terapeuta is 'Resumen de conversaciones por terapeuta (último mensaje + no leídos).';

alter table public.mensajes enable row level security;
