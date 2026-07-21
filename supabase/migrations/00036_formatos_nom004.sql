-- =============================================================================
-- NOEMA · 00036 · Formatos NOM-004 en la biblioteca (#6)
-- =============================================================================
-- Formatos oficiales (terapeuta_id null) de Consentimiento Informado y
-- Canalización/Derivación de pacientes, con el contenido base según la
-- NOM-004-SSA3-2012. El terapeuta los duplica y completa.
--
-- ⚠️ Borrador — validar con criterio profesional y normativa vigente.
-- Idempotente por título.
-- =============================================================================

do $$
begin
  -- Consentimiento informado
  if not exists (select 1 from public.plantillas_ejercicios
    where terapeuta_id is null and titulo = 'Consentimiento informado (NOM-004)') then
    insert into public.plantillas_ejercicios
      (terapeuta_id, titulo, descripcion, categoria, tipo, contenido_md, publica)
    values (
      null,
      'Consentimiento informado (NOM-004)',
      'Formato de consentimiento informado para atención psicológica, conforme a la NOM-004-SSA3-2012 del expediente clínico.',
      'formato_nom004', 'lectura',
      $md$**CONSENTIMIENTO INFORMADO PARA ATENCIÓN PSICOLÓGICA**

**Datos de identificación**
- Nombre del paciente: ______________________________
- Fecha de nacimiento / edad: _______________________
- Fecha: ____________________________________________
- Terapeuta responsable: ____________________________ (Cédula prof.: __________)

**1. Naturaleza y objetivo de la atención**
Se me ha explicado que recibiré atención psicológica cuyo objetivo es _______________________________. Comprendo que el proceso terapéutico implica sesiones periódicas y actividades entre sesiones.

**2. Procedimientos**
Entiendo que la atención puede incluir entrevistas, aplicación de instrumentos, ejercicios y seguimiento a través de la plataforma NOEMA.

**3. Beneficios esperados y posibles riesgos**
Se me informó que la terapia puede generar bienestar, así como movilizar emociones difíciles durante el proceso. No se garantizan resultados específicos.

**4. Confidencialidad**
Mi información se maneja de forma confidencial conforme a la LFPDPPP. Se me explicó que decido qué información comparto. La confidencialidad tiene como límites las situaciones de riesgo para mí o para terceros, y los casos previstos por la ley.

**5. Voluntariedad**
Mi participación es voluntaria y puedo suspenderla en cualquier momento sin consecuencia.

**6. Manejo de datos en NOEMA**
Comprendo cómo se resguarda mi información en la plataforma y que lo marcado como privado no es visible para mi terapeuta.

**Declaración**
Declaro que se me explicó lo anterior en lenguaje claro, que resolví mis dudas y que acepto recibir la atención.

Nombre y firma del paciente: __________________________
Nombre y firma del terapeuta: _________________________
Fecha: ____________________$md$,
      true
    );
  end if;

  -- Canalización / derivación
  if not exists (select 1 from public.plantillas_ejercicios
    where terapeuta_id is null and titulo = 'Formato de canalización / derivación (NOM-004)') then
    insert into public.plantillas_ejercicios
      (terapeuta_id, titulo, descripcion, categoria, tipo, contenido_md, publica)
    values (
      null,
      'Formato de canalización / derivación (NOM-004)',
      'Formato para derivar/canalizar a un paciente a otro profesional o servicio, conforme a la NOM-004-SSA3-2012.',
      'formato_nom004', 'lectura',
      $md$**FORMATO DE CANALIZACIÓN / DERIVACIÓN**

**Datos de identificación del paciente**
- Nombre: ___________________________________________
- Edad / fecha de nacimiento: _______________________
- Fecha de la canalización: _________________________

**Datos del profesional que deriva**
- Nombre: ___________________________________________
- Cédula profesional: _______________________________
- Contacto: _________________________________________

**Se canaliza a**
- Profesional / institución / servicio: ____________
- Especialidad: _____________________________________

**Motivo de la canalización**
_____________________________________________________
_____________________________________________________

**Resumen clínico relevante**
- Motivo de consulta inicial: _______________________
- Impresión / hallazgos relevantes: _________________
- Intervenciones realizadas: ________________________
- Estado actual: ____________________________________

**Motivo específico de la derivación**
(  ) Requiere valoración médica / psiquiátrica
(  ) Requiere atención especializada
(  ) Situación de riesgo
(  ) Otro: __________________________________________

**Observaciones**
_____________________________________________________

Nombre y firma del profesional que deriva: ___________
Fecha: ____________________$md$,
      true
    );
  end if;
end $$;
