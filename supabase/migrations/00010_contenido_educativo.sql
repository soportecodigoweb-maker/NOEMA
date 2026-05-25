-- =============================================================================
-- NOEMA · 00010 · Contenido educativo (modo sin terapeuta + biblioteca)
-- =============================================================================
-- Catálogo tipo "streaming psicológico": videos, audios, guías, cursos.
-- Lo usan tanto usuarios sin terapeuta (explorando) como pacientes (cuando
-- su terapeuta les recomienda algo).
-- =============================================================================

-- Categorías ----------------------------------------------------------------

create table public.categorias (
  key             text primary key,
  nombre          text not null,
  descripcion     text,
  icono           text, -- key del set de iconos NOEMA
  orden           int not null default 0,
  activa          boolean not null default true
);

create index categorias_orden_idx on public.categorias(orden) where activa;

-- Contenido educativo --------------------------------------------------------

create table public.contenido_educativo (
  id                  uuid primary key default gen_random_uuid(),
  titulo              text not null,
  subtitulo           text,
  descripcion         text,
  tipo                tipo_contenido not null,

  -- Recurso
  recurso_url         text, -- audio/video URL (Storage o externo)
  miniatura_url       text,
  duracion_min        int,
  paginas             int, -- para guías/lecturas

  -- Clasificación
  categoria_key       text references public.categorias(key),
  etiquetas           text[] not null default array[]::text[],
  nivel               nivel_contenido not null default 'inicial',
  idioma              text not null default 'es-MX',

  -- Autoría (puede ser oficial NOEMA o de un terapeuta colaborador)
  autor_terapeuta_id  uuid references public.terapeutas(profile_id) on delete set null,
  autor_nombre        text, -- snapshot para mostrar aunque se borre

  -- Estado
  publicado           boolean not null default false,
  destacado           boolean not null default false,

  -- Métricas (cache, actualizado por triggers o jobs)
  vistas_count        int not null default 0,
  favoritos_count     int not null default 0,
  rating_promedio     numeric(3,2),

  publicado_at        timestamptz,
  creado_at           timestamptz not null default now(),
  actualizado_at      timestamptz not null default now()
);

create index contenido_categoria_idx on public.contenido_educativo(categoria_key) where publicado;
create index contenido_destacado_idx on public.contenido_educativo(destacado) where publicado and destacado;
create index contenido_etiquetas_idx on public.contenido_educativo using gin(etiquetas) where publicado;
create index contenido_tipo_idx on public.contenido_educativo(tipo) where publicado;
create index contenido_titulo_trgm on public.contenido_educativo using gin(titulo gin_trgm_ops);

create trigger contenido_set_actualizado_at
  before update on public.contenido_educativo
  for each row execute function public.set_actualizado_at();

-- Progreso de visualización por usuario --------------------------------------

create table public.contenido_progreso (
  usuario_id              uuid not null references public.profiles(id) on delete cascade,
  contenido_id            uuid not null references public.contenido_educativo(id) on delete cascade,
  progreso_porcentaje     int not null default 0 check (progreso_porcentaje between 0 and 100),
  completado              boolean not null default false,
  ultima_visualizacion    timestamptz not null default now(),
  primera_visualizacion   timestamptz not null default now(),
  primary key (usuario_id, contenido_id)
);

create index contenido_progreso_usuario_idx on public.contenido_progreso(usuario_id, ultima_visualizacion desc);

-- Favoritos -------------------------------------------------------------------

create table public.contenido_favoritos (
  usuario_id      uuid not null references public.profiles(id) on delete cascade,
  contenido_id    uuid not null references public.contenido_educativo(id) on delete cascade,
  creado_at       timestamptz not null default now(),
  primary key (usuario_id, contenido_id)
);

create index contenido_favoritos_usuario_idx on public.contenido_favoritos(usuario_id, creado_at desc);

alter table public.categorias enable row level security;
alter table public.contenido_educativo enable row level security;
alter table public.contenido_progreso enable row level security;
alter table public.contenido_favoritos enable row level security;
