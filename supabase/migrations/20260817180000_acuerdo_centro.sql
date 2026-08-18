-- Acuerdo de colaboración centro ↔ terapeuta.
-- El centro define el texto (hay uno por defecto). El terapeuta lo acepta al
-- entrar y luego el CENTRO confirma su incorporación (doble aceptación).

alter table public.centros
  add column if not exists acuerdo_terapeuta text;

update public.centros
set acuerdo_terapeuta = coalesce(acuerdo_terapeuta, $txt$ACUERDO DE COLABORACIÓN PROFESIONAL

1. El terapeuta colabora con este centro conservando su autonomía e independencia clínica y su responsabilidad profesional sobre los procesos que atiende.

2. El terapeuta se compromete a resguardar la confidencialidad de la información de sus pacientes conforme a la LFPDPPP y a la normativa aplicable.

3. El acceso del centro a la información clínica de los pacientes requiere siempre la autorización expresa del terapeuta, y cada acceso queda registrado.

4. La supervisión clínica, cuando exista, tiene fines formativos y de calidad de la atención; no sustituye el criterio profesional del terapeuta.

5. Ambas partes pueden dar por terminada esta colaboración en cualquier momento, procurando la continuidad del proceso de los pacientes.$txt$);

alter table public.centro_terapeutas
  add column if not exists acuerdo_aceptado_at timestamptz;

alter table public.centro_terapeutas
  drop constraint if exists centro_terapeutas_estado_chk;
alter table public.centro_terapeutas
  add constraint centro_terapeutas_estado_chk
  check (estado in ('activa', 'inactiva', 'pendiente', 'por_confirmar'));

comment on column public.centro_terapeutas.estado is
  'pendiente = invitado; por_confirmar = el terapeuta acepto el acuerdo y falta que el centro confirme; activa = miembro; inactiva = suspendido.';
