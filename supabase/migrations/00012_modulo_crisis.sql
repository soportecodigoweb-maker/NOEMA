-- =============================================================================
-- NOEMA · 00012 · Módulo de crisis (BIBLIA §11)
-- =============================================================================
-- Contactos de confianza, recursos por país y alertas registradas.
--
-- REGLA: NOEMA NO contiene crisis. Solo orienta al usuario para que busque
-- ayuda real (servicios de emergencia, personas de confianza, su terapeuta).
-- =============================================================================

-- Contactos de confianza del paciente -----------------------------------------

create table public.contactos_confianza (
  id              uuid primary key default gen_random_uuid(),
  paciente_id     uuid not null references public.pacientes(profile_id) on delete cascade,
  nombre          text not null,
  telefono        text not null,
  relacion        text, -- "pareja", "madre", "amigo", etc
  orden           int not null default 0,
  activo          boolean not null default true,
  creado_at       timestamptz not null default now(),
  actualizado_at  timestamptz not null default now()
);

comment on table public.contactos_confianza is 'Contactos del paciente para llamar en crisis. SIEMPRE iniciativa del paciente.';

create index contactos_confianza_paciente_idx on public.contactos_confianza(paciente_id, orden) where activo;

create trigger contactos_confianza_set_actualizado_at
  before update on public.contactos_confianza
  for each row execute function public.set_actualizado_at();

-- Recursos de emergencia por país/ciudad --------------------------------------

create table public.recursos_emergencia (
  id              uuid primary key default gen_random_uuid(),
  pais            text not null, -- 'MX', 'AR', 'CO', 'ES', 'US', etc
  ciudad          text, -- null = aplica a todo el país
  tipo            text not null, -- 'linea_crisis', 'emergencias_generales', 'salud_mental', 'violencia'
  nombre          text not null,
  telefono        text not null,
  descripcion     text,
  horario         text, -- "24/7", "L-V 9-18"
  url             text,
  orden           int not null default 0,
  activo          boolean not null default true,
  creado_at       timestamptz not null default now()
);

comment on table public.recursos_emergencia is 'Catálogo público de líneas de ayuda por país. Lo ve cualquier usuario en modulo de crisis.';

create index recursos_emergencia_pais_idx on public.recursos_emergencia(pais, orden) where activo;
create index recursos_emergencia_ciudad_idx on public.recursos_emergencia(pais, ciudad, orden) where activo;

-- =============================================================================
-- Alertas de crisis (cuando se dispara el flujo)
-- =============================================================================
-- Cada vez que un paciente:
--   - presiona el botón "Necesito ayuda ahora"
--   - escribe palabras de alerta en un registro o diario
--   - el sistema detecta una crisis
-- se crea una fila aquí. Es un audit log clínico, no contenido.
-- =============================================================================

create table public.alertas_crisis (
  id                      uuid primary key default gen_random_uuid(),
  paciente_id             uuid not null references public.pacientes(profile_id) on delete cascade,
  vinculacion_id          uuid references public.vinculaciones(id) on delete set null,

  origen                  text not null, -- 'boton_manual', 'deteccion_registro', 'deteccion_diario', 'deteccion_mensaje'
  gravedad                gravedad_crisis not null,
  contexto                text, -- snippet de lo que disparó la alerta (sanitizado)

  -- Acciones tomadas por el paciente desde la pantalla de crisis
  llamo_emergencias       boolean not null default false,
  contacto_confianza_id   uuid references public.contactos_confianza(id),
  registro_emocional_id   uuid, -- FK a registros_emocionales (se setea después)
  recurso_consultado_id   uuid references public.recursos_emergencia(id),

  -- Notificación al terapeuta (SOLO si paciente lo autorizó previamente)
  notificado_terapeuta    boolean not null default false,
  notificado_at           timestamptz,

  resuelta                boolean not null default false,
  resuelta_at             timestamptz,
  nota_resolucion         text,

  creada_at               timestamptz not null default now()
);

comment on table public.alertas_crisis is 'Audit log de cada activación del módulo de crisis. NO almacena interpretación clínica.';
comment on column public.alertas_crisis.notificado_terapeuta is 'Solo true si el paciente activó previamente esta opción en su vinculación (notificar_crisis_terapeuta).';

create index alertas_crisis_paciente_idx on public.alertas_crisis(paciente_id, creada_at desc);
create index alertas_crisis_vinculacion_idx on public.alertas_crisis(vinculacion_id, creada_at desc)
  where vinculacion_id is not null;
create index alertas_crisis_no_resueltas_idx on public.alertas_crisis(paciente_id, gravedad)
  where not resuelta;

alter table public.contactos_confianza enable row level security;
alter table public.recursos_emergencia enable row level security;
alter table public.alertas_crisis enable row level security;
