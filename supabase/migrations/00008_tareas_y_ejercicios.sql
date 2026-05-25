-- =============================================================================
-- NOEMA · 00008 · Tareas, plantillas y respuestas
-- =============================================================================
-- Plantillas: ejercicios reusables (oficiales NOEMA + propias del terapeuta).
-- Tareas: instancias asignadas a un paciente, con frecuencia y recordatorios.
-- Respuestas: lo que el paciente captura al completar cada ocurrencia.
-- =============================================================================

-- Plantillas (reusables) ------------------------------------------------------

create table public.plantillas_ejercicios (
  id              uuid primary key default gen_random_uuid(),

  -- null = plantilla oficial NOEMA; uuid = propia del terapeuta
  terapeuta_id    uuid references public.terapeutas(profile_id) on delete cascade,

  titulo          text not null,
  descripcion     text,
  categoria       text not null, -- "ansiedad", "respiracion", "habitos", etc
  contenido_md    text, -- markdown con instrucciones
  duracion_min    int,
  tipo            tipo_contenido not null default 'ejercicio',

  -- Campos que el paciente debe completar al responder
  -- ej: [{ "key": "intensidad", "label": "¿Qué tan intensa fue?", "type": "scale", "min": 1, "max": 5 }]
  campos_respuesta jsonb not null default '[]'::jsonb,

  recursos        jsonb not null default '[]'::jsonb, -- audios, videos, archivos

  publica         boolean not null default false, -- si es propia, ¿la comparte con otros terapeutas?
  usos_count      int not null default 0,

  creado_at       timestamptz not null default now(),
  actualizado_at  timestamptz not null default now()
);

comment on table public.plantillas_ejercicios is 'Catálogo de ejercicios. Las oficiales NOEMA tienen terapeuta_id=null.';
comment on column public.plantillas_ejercicios.publica is 'Si true y terapeuta_id<>null, otros terapeutas pueden usarla.';

create index plantillas_terapeuta_idx on public.plantillas_ejercicios(terapeuta_id);
create index plantillas_categoria_idx on public.plantillas_ejercicios(categoria);
create index plantillas_publica_idx on public.plantillas_ejercicios(publica) where publica;

create trigger plantillas_set_actualizado_at
  before update on public.plantillas_ejercicios
  for each row execute function public.set_actualizado_at();

-- =============================================================================
-- Tareas asignadas a una vinculación
-- =============================================================================

create table public.tareas (
  id                  uuid primary key default gen_random_uuid(),
  vinculacion_id      uuid not null references public.vinculaciones(id) on delete cascade,
  plantilla_id        uuid references public.plantillas_ejercicios(id) on delete set null,
  asignada_por        uuid not null references public.profiles(id),

  -- Si no se basa en plantilla, sus propios campos
  titulo              text not null,
  descripcion         text,
  contenido_md        text,
  campos_respuesta    jsonb not null default '[]'::jsonb,

  -- Programación
  fecha_inicio        date not null default current_date,
  fecha_limite        date,
  frecuencia          frecuencia_tarea not null default 'unica',
  config_frecuencia   jsonb, -- para 'personalizada': { dias: [1,3,5], etc }

  -- Recordatorios (Expo notifications)
  recordatorios       jsonb not null default '[]'::jsonb, -- [{hora: "20:00", canal: "push"}]

  -- Visibilidad de las respuestas del paciente
  respuestas_visibles_terapeuta boolean not null default true,

  -- Estado general
  estado              estado_tarea not null default 'pendiente',
  comentarios_terapeuta text, -- al asignar

  creado_at           timestamptz not null default now(),
  actualizado_at      timestamptz not null default now()
);

comment on table public.tareas is 'Tareas asignadas. Una tarea genera N respuestas (una por ocurrencia si es recurrente).';

create index tareas_vinculacion_idx on public.tareas(vinculacion_id, estado);
create index tareas_fecha_limite_idx on public.tareas(fecha_limite) where estado in ('pendiente', 'en_progreso');

create trigger tareas_set_actualizado_at
  before update on public.tareas
  for each row execute function public.set_actualizado_at();

-- =============================================================================
-- Respuestas a tareas (ocurrencias completadas)
-- =============================================================================

create table public.tarea_respuestas (
  id                      uuid primary key default gen_random_uuid(),
  tarea_id                uuid not null references public.tareas(id) on delete cascade,
  paciente_id             uuid not null references public.pacientes(profile_id) on delete cascade,

  fecha                   date not null default current_date,
  hora                    time not null default current_time,

  respuestas              jsonb not null default '{}'::jsonb, -- valores de campos_respuesta
  texto_libre             text,
  archivos                jsonb not null default '[]'::jsonb,
  dificultad_percibida    int check (dificultad_percibida between 1 and 5),
  comentarios_paciente    text,

  -- ¿Comparte esta respuesta específica con el terapeuta?
  compartir_terapeuta     boolean not null default true,

  creado_at               timestamptz not null default now(),
  actualizado_at          timestamptz not null default now()
);

create index tarea_respuestas_tarea_idx on public.tarea_respuestas(tarea_id, fecha desc);
create index tarea_respuestas_paciente_idx on public.tarea_respuestas(paciente_id, fecha desc);

create trigger tarea_respuestas_set_actualizado_at
  before update on public.tarea_respuestas
  for each row execute function public.set_actualizado_at();

alter table public.plantillas_ejercicios enable row level security;
alter table public.tareas enable row level security;
alter table public.tarea_respuestas enable row level security;
