-- El terapeuta decide qué secciones del Plan de apoyo ve el paciente.
-- Flags por vinculación (todas visibles por defecto).

alter table public.plan_apoyo
  add column if not exists ver_lineas_emergencia boolean not null default true,
  add column if not exists ver_contacto_terapeuta boolean not null default true,
  add column if not exists ver_contacto_confianza boolean not null default true,
  add column if not exists ver_recursos boolean not null default true;

comment on column public.plan_apoyo.ver_lineas_emergencia is 'Mostrar al paciente las líneas de emergencia de México.';
comment on column public.plan_apoyo.ver_contacto_terapeuta is 'Mostrar al paciente el contacto directo con su terapeuta.';
comment on column public.plan_apoyo.ver_contacto_confianza is 'Mostrar al paciente el contacto de confianza y su plan de seguridad.';
comment on column public.plan_apoyo.ver_recursos is 'Mostrar al paciente los recursos definidos por el terapeuta.';
