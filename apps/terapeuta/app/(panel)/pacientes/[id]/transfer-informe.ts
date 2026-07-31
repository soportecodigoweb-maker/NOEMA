// Tipos y ensamblado del informe de canalización v2 (10 secciones).
// Módulo puro (sin 'use server') para poder exportar funciones no-async y tipos
// que usan tanto el server action como el componente cliente.

export interface AnexosCanalizacion {
  notas_clinicas: boolean;
  registros: boolean;
  graficas: boolean;
  plan_apoyo: boolean;
  objetivos: boolean;
  consentimientos: boolean;
}

export interface SeccionesInforme {
  // 1. Datos generales (auto, editables)
  nombre: string;
  edad: string;
  sexo: string;
  fecha_nacimiento: string;
  fecha_elaboracion: string;
  terapeuta_remitente: string;
  // 2. Motivo de canalización (terapeuta)
  motivo_canalizacion: string;
  // 3. Motivo de consulta inicial (auto del historial)
  motivo_consulta_inicial: string;
  // 4. Objetivos terapéuticos trabajados (auto de notas)
  objetivos_trabajados: string;
  // 5. Resumen del proceso terapéutico (IA, editable)
  resumen_proceso: string;
  // 6. Información registrada en NOEMA (auto)
  info_noema: string;
  // 7. Intervenciones realizadas (terapeuta)
  intervenciones: string;
  // 8. Observaciones y recomendaciones (terapeuta)
  observaciones: string;
  // 9. Documentos anexos (checkboxes)
  anexos: AnexosCanalizacion;
  // 10. Firma (auto de datos del terapeuta)
  firma_nombre: string;
  firma_cedula: string;
  firma_fecha: string;
}

export function calcularEdad(fecha: string | null): string {
  if (!fecha) return '';
  const nac = new Date(fecha);
  if (Number.isNaN(nac.getTime())) return '';
  const hoy = new Date();
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad >= 0 && edad < 130 ? `${edad} años` : '';
}

/** Ensambla las 10 secciones en el texto final del informe. */
export function ensamblarInforme(s: SeccionesInforme): string {
  const anexosLista = [
    s.anexos.notas_clinicas && 'Notas clínicas',
    s.anexos.registros && 'Registros NOEMA',
    s.anexos.graficas && 'Gráficas',
    s.anexos.plan_apoyo && 'Plan de apoyo',
    s.anexos.objetivos && 'Objetivos terapéuticos',
    s.anexos.consentimientos && 'Consentimientos',
  ].filter(Boolean);

  return [
    'INFORME PSICOLÓGICO DE CANALIZACIÓN',
    '',
    '1. DATOS GENERALES',
    `Nombre: ${s.nombre || '—'}`,
    s.edad ? `Edad: ${s.edad}` : '',
    s.sexo ? `Sexo: ${s.sexo}` : '',
    s.fecha_nacimiento ? `Fecha de nacimiento: ${s.fecha_nacimiento}` : '',
    `Fecha de elaboración: ${s.fecha_elaboracion}`,
    `Terapeuta remitente: ${s.terapeuta_remitente || '—'}`,
    `Motivo de canalización: ${s.motivo_canalizacion || '—'}`,
    '',
    '2. MOTIVO DE CANALIZACIÓN',
    s.motivo_canalizacion || '—',
    '',
    '3. MOTIVO DE CONSULTA INICIAL',
    s.motivo_consulta_inicial || '—',
    '',
    '4. OBJETIVOS TERAPÉUTICOS TRABAJADOS',
    s.objetivos_trabajados || '—',
    '',
    '5. RESUMEN DEL PROCESO TERAPÉUTICO',
    s.resumen_proceso || '—',
    '',
    '6. INFORMACIÓN REGISTRADA EN NOEMA',
    s.info_noema || '—',
    '',
    '7. INTERVENCIONES REALIZADAS',
    s.intervenciones || '—',
    '',
    '8. OBSERVACIONES Y RECOMENDACIONES PARA EL SIGUIENTE TERAPEUTA',
    s.observaciones || '—',
    '',
    '9. DOCUMENTOS ANEXOS',
    anexosLista.length ? anexosLista.map((a) => `• ${a}`).join('\n') : 'Ninguno',
    '',
    '10. FIRMA',
    `Nombre: ${s.firma_nombre || '—'}`,
    `Cédula: ${s.firma_cedula || '—'}`,
    `Fecha: ${s.firma_fecha}`,
    '',
    'Este informe no constituye diagnóstico. Contiene observaciones para la continuidad del proceso.',
  ]
    .filter((l) => l !== '')
    .join('\n');
}
