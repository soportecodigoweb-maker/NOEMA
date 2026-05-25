-- TESTS DE RLS PARA NOEMA
-- Obtener los IDs primero (como postgres, sin RLS)
select id::text as paciente_id from public.profiles where email = 'pac@test.com' \gset
select id::text as terapeuta_id from public.profiles where email = 'tera@test.com' \gset
select id::text as otro_terapeuta_id from public.profiles where email = 'otro@test.com' \gset

\echo ''
\echo '=== TEST 1: TERAPEUTA DUEÑO debe ver 2 registros + 1 diario ==='
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', jsonb_build_object('sub', :'terapeuta_id', 'role', 'authenticated')::text, true);
  select count(*) as terapeuta_ve_registros, 2 as esperado from public.registros_emocionales;
  select count(*) as terapeuta_ve_diarios, 1 as esperado from public.diario_entradas;
commit;

\echo ''
\echo '=== TEST 2: OTRO TERAPEUTA (no vinculado) debe ver 0 + 0 ==='
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', jsonb_build_object('sub', :'otro_terapeuta_id', 'role', 'authenticated')::text, true);
  select count(*) as otro_ve_registros, 0 as esperado from public.registros_emocionales;
  select count(*) as otro_ve_diarios, 0 as esperado from public.diario_entradas;
commit;

\echo ''
\echo '=== TEST 3: PACIENTE debe ver TODOS sus 3 registros + 2 diarios ==='
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', jsonb_build_object('sub', :'paciente_id', 'role', 'authenticated')::text, true);
  select count(*) as paciente_ve_registros, 3 as esperado from public.registros_emocionales;
  select count(*) as paciente_ve_diarios, 2 as esperado from public.diario_entradas;
commit;

\echo ''
\echo '=== TEST 4: el terapeuta NUNCA debe ver descripciones marcadas "privado" ==='
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', jsonb_build_object('sub', :'terapeuta_id', 'role', 'authenticated')::text, true);
  select descripcion, privacidad from public.registros_emocionales order by privacidad;
  select substring(contenido, 1, 30) as contenido, privacidad from public.diario_entradas;
commit;

\echo ''
\echo '=== TEST 5: catálogos públicos siempre visibles ==='
begin;
  set local role authenticated;
  select set_config('request.jwt.claims', jsonb_build_object('sub', :'paciente_id', 'role', 'authenticated')::text, true);
  select count(*) as emociones_visibles, 25 as esperado from public.emociones_catalogo;
  select count(*) as categorias_visibles, 15 as esperado from public.categorias;
  select count(*) as recursos_emergencia_visibles, 15 as esperado from public.recursos_emergencia;
commit;
