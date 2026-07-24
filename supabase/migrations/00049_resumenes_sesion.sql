-- =============================================================================
-- NOEMA · 00049 · Historial de resúmenes pre-sesión (R5-8)
-- =============================================================================
-- Guarda cada resumen generado para poder consultarlo después y tener un
-- historial. El snapshot completo (métricas, series, narrativa) va en jsonb.
-- =============================================================================

create table if not exists public.resumenes_sesion (
  id             uuid primary key default gen_random_uuid(),
  vinculacion_id uuid not null references public.vinculaciones(id) on delete cascade,
  terapeuta_id   uuid not null references public.profiles(id) on delete cascade,
  datos          jsonb not null,          -- snapshot de ResumenData
  narrativa      text,                     -- copia de la síntesis para búsqueda/preview
  dias           int not null default 14,
  generado_at    timestamptz not null default now()
);

create index if not exists resumenes_sesion_vinc_idx
  on public.resumenes_sesion (vinculacion_id, generado_at desc);

alter table public.resumenes_sesion enable row level security;

-- Solo el terapeuta dueño de la vinculación ve y crea sus resúmenes.
drop policy if exists resumenes_sesion_terapeuta on public.resumenes_sesion;
create policy resumenes_sesion_terapeuta on public.resumenes_sesion
  for all
  using (terapeuta_id = auth.uid())
  with check (terapeuta_id = auth.uid());
