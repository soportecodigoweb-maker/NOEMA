-- Consentimiento de tutor para pacientes menores de edad.
-- La fecha de nacimiento ya existe en pacientes; agregamos los datos del tutor
-- legal y el momento de su consentimiento (para pacientes < 18 años).

alter table public.pacientes
  add column if not exists tutor_nombre text,
  add column if not exists tutor_relacion text,
  add column if not exists tutor_consentimiento_at timestamptz;

comment on column public.pacientes.tutor_nombre is
  'Nombre del padre/madre o tutor legal, obligatorio si el paciente es menor de edad.';
comment on column public.pacientes.tutor_relacion is
  'Parentesco/relación del tutor con el paciente menor de edad.';
comment on column public.pacientes.tutor_consentimiento_at is
  'Momento en que el tutor legal otorgó su consentimiento para el uso de NOEMA por el menor.';
