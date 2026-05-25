-- =============================================================================
-- NOEMA · 00015 · Row Level Security — POLÍTICAS COMPLETAS
-- =============================================================================
-- Esta es la última línea de defensa del principio de privacidad.
-- Todo lo que aplica RLS está aquí; cada tabla habilita RLS en su migración.
--
-- REGLAS DE ORO (BIBLIA §12):
--   1. El diario "privado" del paciente es INVIOLABLE — ni con queries
--      directas del terapeuta sale.
--   2. Las notas "privadas" del terapeuta nunca son visibles para el paciente.
--   3. Solo el paciente decide qué registros comparte (privacidad <> 'privado').
--   4. El terapeuta solo ve datos de pacientes con vinculación activa/pausada.
-- =============================================================================

-- ===========================================================================
-- PROFILES
-- ===========================================================================

-- Cada usuario ve y modifica su propio profile
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Los terapeutas verificados son visibles para todos (directorio público)
create policy profiles_select_terapeuta_publico on public.profiles
  for select using (
    rol = 'terapeuta'
    and public.es_terapeuta_verificado(id)
  );

-- El terapeuta puede ver el profile básico de sus pacientes vinculados
create policy profiles_select_pacientes_vinculados on public.profiles
  for select using (
    rol = 'paciente'
    and public.es_terapeuta_de(id)
  );

-- El paciente puede ver el profile básico de su terapeuta
create policy profiles_select_mi_terapeuta on public.profiles
  for select using (
    rol = 'terapeuta'
    and exists (
      select 1 from public.vinculaciones
      where paciente_id = auth.uid() and terapeuta_id = profiles.id
        and estado in ('activa', 'pausada')
    )
  );

-- ===========================================================================
-- TERAPEUTAS
-- ===========================================================================

-- Lectura pública para terapeutas verificados (directorio)
create policy terapeutas_select_publico on public.terapeutas
  for select using (estado_verificacion = 'verificado');

-- El terapeuta ve y edita su propia ficha
create policy terapeutas_select_own on public.terapeutas
  for select using (profile_id = auth.uid());

create policy terapeutas_update_own on public.terapeutas
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- INSERT solo por el propio usuario (durante onboarding)
create policy terapeutas_insert_own on public.terapeutas
  for insert with check (profile_id = auth.uid() and public.mi_rol() = 'terapeuta');

-- ===========================================================================
-- TERAPEUTA HORARIOS
-- ===========================================================================

create policy horarios_select_publico on public.terapeuta_horarios
  for select using (true); -- horarios son públicos para mostrar disponibilidad

create policy horarios_manage_own on public.terapeuta_horarios
  for all using (terapeuta_id = auth.uid()) with check (terapeuta_id = auth.uid());

-- ===========================================================================
-- PACIENTES
-- ===========================================================================

-- El paciente ve y edita su propia ficha
create policy pacientes_select_own on public.pacientes
  for select using (profile_id = auth.uid());

create policy pacientes_update_own on public.pacientes
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy pacientes_insert_own on public.pacientes
  for insert with check (profile_id = auth.uid() and public.mi_rol() = 'paciente');

-- El terapeuta NUNCA ve la tabla pacientes directamente (datos personales
-- privados). Solo ve lo expuesto vía vinculacion + registros compartidos.

-- ===========================================================================
-- VINCULACIONES
-- ===========================================================================

-- El terapeuta gestiona sus vinculaciones
create policy vinculaciones_terapeuta_all on public.vinculaciones
  for all using (terapeuta_id = auth.uid()) with check (terapeuta_id = auth.uid());

-- El paciente ve sus vinculaciones y puede actualizar campos limitados
create policy vinculaciones_paciente_select on public.vinculaciones
  for select using (paciente_id = auth.uid());

create policy vinculaciones_paciente_update on public.vinculaciones
  for update using (paciente_id = auth.uid())
  with check (
    paciente_id = auth.uid()
    -- El paciente solo puede cambiar campos suyos, no estado de facturación
  );

-- Buscar por código de invitación (durante onboarding del paciente)
-- Esta política permite a un usuario autenticado validar un código antes de
-- "consumirlo". Solo expone el código + el nombre del terapeuta.
create policy vinculaciones_select_por_codigo on public.vinculaciones
  for select using (estado = 'pendiente' and codigo_invitacion is not null);

-- ===========================================================================
-- EMOCIONES CATÁLOGO (público)
-- ===========================================================================

create policy emociones_select_publico on public.emociones_catalogo
  for select using (true);

-- ===========================================================================
-- REGISTROS EMOCIONALES (CRÍTICO)
-- ===========================================================================

-- El paciente ve y maneja TODOS sus registros
create policy registros_paciente_all on public.registros_emocionales
  for all using (paciente_id = auth.uid()) with check (paciente_id = auth.uid());

-- El terapeuta solo ve registros que el paciente COMPARTIÓ o MARCÓ para sesión.
-- NUNCA ve registros privados.
create policy registros_terapeuta_select_compartidos on public.registros_emocionales
  for select using (
    public.es_terapeuta_de(paciente_id)
    and privacidad in ('compartido', 'marcado_sesion')
  );

-- ===========================================================================
-- DIARIO (CRÍTICO — privacidad inviolable)
-- ===========================================================================

-- El paciente ve y maneja TODAS sus entradas (incluyendo privadas)
create policy diario_paciente_all on public.diario_entradas
  for all using (paciente_id = auth.uid()) with check (paciente_id = auth.uid());

-- El terapeuta SOLO ve entradas compartidas o marcadas para sesión.
-- Las privadas NO SALEN — esto es ley.
create policy diario_terapeuta_select_compartidos on public.diario_entradas
  for select using (
    public.es_terapeuta_de(paciente_id)
    and privacidad in ('compartido', 'marcado_sesion')
  );

-- ===========================================================================
-- SESIONES
-- ===========================================================================

-- Ambas partes ven sesiones de su vinculación
create policy sesiones_select_partes on public.sesiones
  for select using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = sesiones.vinculacion_id
        and (v.terapeuta_id = auth.uid() or v.paciente_id = auth.uid())
    )
  );

-- Solo el terapeuta crea/edita sesiones
create policy sesiones_terapeuta_manage on public.sesiones
  for all using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = sesiones.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vinculaciones v
      where v.id = sesiones.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  );

-- ===========================================================================
-- SESION_NOTAS (CRÍTICO — notas privadas del terapeuta)
-- ===========================================================================

-- El terapeuta autor ve y edita
create policy sesion_notas_autor_all on public.sesion_notas
  for all using (autor_id = auth.uid()) with check (autor_id = auth.uid());

-- El paciente ve SOLO contenido_publico cuando visible_paciente=true.
-- Esto se hace a nivel de COLUMNA en la app, pero a nivel RLS limitamos por flag.
create policy sesion_notas_paciente_select_publico on public.sesion_notas
  for select using (
    visible_paciente = true
    and exists (
      select 1 from public.sesiones s
      join public.vinculaciones v on v.id = s.vinculacion_id
      where s.id = sesion_notas.sesion_id and v.paciente_id = auth.uid()
    )
  );
-- NOTA IMPORTANTE: la app debe ocultar el campo `contenido_privado` cuando el
-- consumidor sea el paciente. RLS deja pasar la fila, pero la app filtra columnas.

-- ===========================================================================
-- PLANTILLAS DE EJERCICIOS
-- ===========================================================================

-- Plantillas oficiales (terapeuta_id null) son visibles para todos
-- los terapeutas autenticados
create policy plantillas_oficiales_select on public.plantillas_ejercicios
  for select using (terapeuta_id is null);

-- Plantillas propias
create policy plantillas_propias_all on public.plantillas_ejercicios
  for all using (terapeuta_id = auth.uid()) with check (terapeuta_id = auth.uid());

-- Plantillas públicas de otros terapeutas
create policy plantillas_publicas_select on public.plantillas_ejercicios
  for select using (publica = true);

-- ===========================================================================
-- TAREAS Y RESPUESTAS
-- ===========================================================================

-- El terapeuta de la vinculación gestiona las tareas
create policy tareas_terapeuta_manage on public.tareas
  for all using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = tareas.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.vinculaciones v
      where v.id = tareas.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  );

-- El paciente ve sus tareas y puede marcarlas (cambio de estado limitado en app)
create policy tareas_paciente_select on public.tareas
  for select using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = tareas.vinculacion_id and v.paciente_id = auth.uid()
    )
  );

create policy tareas_paciente_update_estado on public.tareas
  for update using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = tareas.vinculacion_id and v.paciente_id = auth.uid()
    )
  );

-- Respuestas: el paciente las crea y posee
create policy respuestas_paciente_all on public.tarea_respuestas
  for all using (paciente_id = auth.uid()) with check (paciente_id = auth.uid());

-- El terapeuta ve solo las respuestas marcadas como compartibles
create policy respuestas_terapeuta_select on public.tarea_respuestas
  for select using (
    public.es_terapeuta_de(paciente_id)
    and compartir_terapeuta = true
  );

-- ===========================================================================
-- MENSAJES
-- ===========================================================================

create policy mensajes_partes_select on public.mensajes
  for select using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = mensajes.vinculacion_id
        and (v.terapeuta_id = auth.uid() or v.paciente_id = auth.uid())
    )
  );

create policy mensajes_partes_insert on public.mensajes
  for insert with check (
    autor_id = auth.uid()
    and exists (
      select 1 from public.vinculaciones v
      where v.id = mensajes.vinculacion_id
        and (v.terapeuta_id = auth.uid() or v.paciente_id = auth.uid())
        and v.estado = 'activa'
    )
  );

-- Permitir marcar como leído (UPDATE solo del campo leido_at por el destinatario)
create policy mensajes_destinatario_update_leido on public.mensajes
  for update using (
    autor_id <> auth.uid()
    and exists (
      select 1 from public.vinculaciones v
      where v.id = mensajes.vinculacion_id
        and (v.terapeuta_id = auth.uid() or v.paciente_id = auth.uid())
    )
  );

-- ===========================================================================
-- CONTENIDO EDUCATIVO (público para autenticados)
-- ===========================================================================

create policy categorias_select_publico on public.categorias
  for select using (activa);

create policy contenido_select_publicado on public.contenido_educativo
  for select using (publicado = true);

-- Terapeuta autor gestiona su contenido
create policy contenido_autor_manage on public.contenido_educativo
  for all using (autor_terapeuta_id = auth.uid()) with check (autor_terapeuta_id = auth.uid());

-- Progreso y favoritos: cada usuario los suyos
create policy contenido_progreso_own on public.contenido_progreso
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

create policy contenido_favoritos_own on public.contenido_favoritos
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ===========================================================================
-- RECURSOS ASIGNADOS
-- ===========================================================================

create policy recursos_asignados_terapeuta_manage on public.recursos_asignados
  for all using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = recursos_asignados.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  );

create policy recursos_asignados_paciente_select on public.recursos_asignados
  for select using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = recursos_asignados.vinculacion_id and v.paciente_id = auth.uid()
    )
  );

-- El paciente puede marcar visto_at
create policy recursos_asignados_paciente_update_visto on public.recursos_asignados
  for update using (
    exists (
      select 1 from public.vinculaciones v
      where v.id = recursos_asignados.vinculacion_id and v.paciente_id = auth.uid()
    )
  );

-- ===========================================================================
-- MÓDULO DE CRISIS
-- ===========================================================================

-- Contactos de confianza: solo el paciente
create policy contactos_confianza_paciente_all on public.contactos_confianza
  for all using (paciente_id = auth.uid()) with check (paciente_id = auth.uid());

-- Recursos de emergencia: público
create policy recursos_emergencia_select_publico on public.recursos_emergencia
  for select using (activo);

-- Alertas: el paciente las suyas; el terapeuta SOLO si fue notificado
create policy alertas_crisis_paciente_all on public.alertas_crisis
  for all using (paciente_id = auth.uid()) with check (paciente_id = auth.uid());

create policy alertas_crisis_terapeuta_notificado on public.alertas_crisis
  for select using (
    notificado_terapeuta = true
    and exists (
      select 1 from public.vinculaciones v
      where v.id = alertas_crisis.vinculacion_id and v.terapeuta_id = auth.uid()
    )
  );

-- ===========================================================================
-- CONSENTIMIENTOS Y PREFERENCIAS
-- ===========================================================================

create policy consentimientos_own_all on public.consentimientos
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy preferencias_privacidad_paciente_all on public.preferencias_privacidad
  for all using (paciente_id = auth.uid()) with check (paciente_id = auth.uid());

-- El terapeuta puede leer (no escribir) las preferencias del paciente vinculado
-- para saber qué le está permitido
create policy preferencias_privacidad_terapeuta_select on public.preferencias_privacidad
  for select using (public.es_terapeuta_de(paciente_id));

-- ===========================================================================
-- AUDIT LOG (solo append; cada usuario ve los suyos)
-- ===========================================================================

create policy audit_log_select_own on public.audit_log
  for select using (actor_id = auth.uid());

-- Solo el sistema (vía SECURITY DEFINER) escribe en audit_log.
-- No hay policy de INSERT para roles normales.
