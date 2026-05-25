-- =============================================================================
-- NOEMA · 00002 · Profiles (identidad base de todos los usuarios)
-- =============================================================================
-- Una fila por usuario de Supabase Auth. Esta es la tabla padre de todas las
-- otras (terapeutas, pacientes, sin_terapeuta heredan de aquí).
--
-- La creación del profile se dispara automáticamente cuando auth.users
-- recibe un INSERT (ver trigger más abajo).
-- =============================================================================

create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           citext not null unique,
  rol             rol_usuario not null,
  nombre          text not null,
  apellidos       text,
  avatar_url      text,
  telefono        text,
  ciudad          text,
  pais            text default 'MX',
  locale          text not null default 'es-MX',
  zona_horaria    text not null default 'America/Mexico_City',
  bio             text,
  onboarding_completo boolean not null default false,
  ultimo_acceso   timestamptz,
  creado_at       timestamptz not null default now(),
  actualizado_at  timestamptz not null default now()
);

comment on table public.profiles is 'Identidad base. 1:1 con auth.users. El rol determina qué tabla hija aplica.';
comment on column public.profiles.locale is 'es-MX por defecto. Preparado para multi-idioma sin reescritura.';

create index profiles_rol_idx on public.profiles(rol);
create index profiles_ciudad_idx on public.profiles(ciudad) where ciudad is not null;

-- Auto-actualizar updated_at -------------------------------------------------

create or replace function public.set_actualizado_at()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_at = now();
  return new;
end;
$$;

create trigger profiles_set_actualizado_at
  before update on public.profiles
  for each row execute function public.set_actualizado_at();

-- Crear profile automáticamente al registrarse en auth.users ------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, rol, nombre)
  values (
    new.id,
    new.email,
    -- El rol se manda en raw_user_meta_data al hacer signUp.
    -- Default sin_terapeuta para que pueda usar contenido educativo aunque
    -- no haya completado el onboarding completo.
    coalesce((new.raw_user_meta_data->>'rol')::rol_usuario, 'sin_terapeuta'),
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Helpers de autenticación (usados por RLS) ----------------------------------

-- Devuelve el profile.id del usuario autenticado actual (= auth.uid()).
-- Encapsulado por claridad y para poder cambiar la fuente más adelante.
create or replace function public.profile_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- Devuelve el rol del usuario autenticado actual.
create or replace function public.mi_rol()
returns rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.profiles where id = auth.uid();
$$;

grant execute on function public.profile_id() to authenticated;
grant execute on function public.mi_rol() to authenticated;

-- RLS para profiles (políticas detalladas en 00016_rls_policies.sql) ---------

alter table public.profiles enable row level security;
