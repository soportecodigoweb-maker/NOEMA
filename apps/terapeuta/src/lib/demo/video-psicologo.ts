import type { VideoDemo } from './tipos';
import { PRECIO_NOEMA } from './precio';

/**
 * Video demo del psicólogo (fases 3 y 34): 12 diapositivas con títulos
 * gancho escritos desde lo que siente la psicóloga. En cada una, el panel
 * real corre dentro de la laptop y se opera solo; cuando la función tiene dos
 * lados, aparece el teléfono de Mariana.
 */
export const VIDEO_PSICOLOGO: VideoDemo = {
  rol: 'psicologo',
  diapositivas: [
    {
      id: 'portada',
      etiqueta: 'Seguimiento terapéutico entre sesiones',
      titulo: 'Tu proceso continúa acompañado.',
      parrafo:
        'Lo que pasa entre el martes y el martes también es terapia. NOEMA lo recoge, lo ordena y te lo pone enfrente.',
      marco: 'ninguno',
      especial: 'portada',
      ms: 7000,
    },
    {
      id: 'panel',
      etiqueta: 'Tu panel',
      titulo: '¿Qué pasó entre el martes y el martes?',
      parrafo:
        'Pacientes activos, sesiones de la semana, registros que llegaron y mensajes sin leer. Nada de esto lo capturaste tú.',
      marco: 'laptop',
      ms: 15000,
      laptop: {
        ruta: '/inicio',
        guion: [
          { tipo: 'esperar', ms: 400 },
          { tipo: 'cursor', sel: '@kpis', ms: 300 },
          { tipo: 'contadores', sel: '@kpis', ms: 1500 },
          { tipo: 'chip', texto: 'Registros de la semana' },
          { tipo: 'esperar', ms: 1200 },
          { tipo: 'cursor', sel: '@carga', ms: 400 },
          { tipo: 'graficas', sel: '@carga' },
          { tipo: 'chip', texto: 'Carga de la semana' },
          { tipo: 'cursor', sel: '@riesgo', ms: 400 },
          { tipo: 'graficas', sel: '@riesgo' },
          { tipo: 'chip', texto: 'Riesgo de tu cartera' },
          { tipo: 'scrollLento', ms: 3500, volver: true },
        ],
      },
    },
    {
      id: 'privacidad',
      etiqueta: 'Privacidad',
      titulo: 'Ella decide qué compartes.',
      parrafo:
        'Cada registro nace privado, compartido o marcado para sesión. Tú solo ves lo que tu paciente decidió. Lo marcado es su forma de decir: de esto quiero hablar.',
      marco: 'laptop-telefono',
      ms: 17000,
      laptop: {
        ruta: '/pacientes/{vinc}/registros',
        guion: [
          { tipo: 'esperar', ms: 1200 },
          { tipo: 'chip', texto: 'Privado · solo ella' },
          { tipo: 'scrollLento', ms: 6000, volver: true },
          { tipo: 'chip', texto: 'Compartido · lo ves tú' },
          { tipo: 'esperar', ms: 800 },
          { tipo: 'chip', texto: 'Marcado para sesión' },
        ],
      },
      telefono: {
        ruta: '/paciente/registros',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 900 },
          { tipo: 'clic', sel: '@btn-registrar' },
          { tipo: 'esperar', ms: 500 },
          { tipo: 'clic', sel: '@emocion-tranquilo' },
          { tipo: 'escribir', sel: '@descripcion', texto: 'Hoy dormí bien. Lista para la junta.' },
          { tipo: 'esperar', ms: 900 },
          { tipo: 'scrollLento', ms: 1500, volver: true },
          { tipo: 'esperar', ms: 1200 },
        ],
      },
    },
    {
      id: 'en-vivo',
      etiqueta: 'En vivo',
      titulo: 'Mi paciente no vino y no sé cómo está.',
      parrafo:
        'Aquí sí lo sabes. Lo que registra desde su teléfono te aparece cuando pasa, con aviso. Y su ficha se llena sola: riesgo, última actividad, emociones frecuentes.',
      marco: 'laptop-telefono',
      ms: 16000,
      laptop: {
        ruta: '/pacientes',
        guion: [
          { tipo: 'esperar', ms: 700 },
          { tipo: 'cursor', sel: '@lista-pacientes', ms: 400 },
          { tipo: 'chip', texto: 'Nivel de riesgo' },
          { tipo: 'esperar', ms: 900 },
          { tipo: 'clic', sel: '[data-demo-paciente="Mariana Soto"]' },
          { tipo: 'navegar', ruta: '/pacientes/{vinc}', esperar: '@panorama' },
          { tipo: 'chip', texto: 'Ficha que se llena sola' },
          { tipo: 'cursor', sel: '@panorama', ms: 300 },
          { tipo: 'contadores', sel: '@panorama', ms: 1300 },
          { tipo: 'scrollLento', ms: 3200, volver: true },
          { tipo: 'chip', texto: 'Aviso en tu teléfono' },
        ],
      },
      telefono: {
        ruta: '/paciente',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'scrollLento', ms: 4500, volver: true },
          { tipo: 'esperar', ms: 1000 },
        ],
      },
    },
    {
      id: 'ia',
      etiqueta: 'IA con límites',
      titulo: 'Tengo que preparar la sesión de mañana.',
      parrafo:
        'La IA organiza lo que tu paciente compartió: métricas, patrones, lo marcado para sesión. Nunca diagnostica ni sugiere tratamiento: hay filtros en el código que lo impiden.',
      marco: 'laptop',
      ms: 17000,
      laptop: {
        ruta: '/pacientes/{vinc}',
        guion: [
          { tipo: 'esperar', ms: 600 },
          { tipo: 'clic', sel: '@resumen-ia button' },
          { tipo: 'esperar', ms: 700 },
          { tipo: 'chip', texto: 'Resumen pre-sesión' },
          { tipo: 'clic', sel: '.fixed.inset-0 .border-b .gap-1 > button:first-child' },
          { tipo: 'esperar', ms: 900 },
          { tipo: 'clic', sel: '.fixed.inset-0 ul li button' },
          { tipo: 'esperar', ms: 1200 },
          { tipo: 'chip', texto: 'Sin diagnósticos' },
          { tipo: 'graficas', sel: '.fixed.inset-0 .max-h-\\[80vh\\]' },
          {
            tipo: 'scrollLento',
            sel: '.fixed.inset-0 .max-h-\\[80vh\\] h3',
            ms: 5500,
            volver: true,
          },
          { tipo: 'chip', texto: 'La IA organiza, tú interpretas' },
          { tipo: 'esperar', ms: 1500 },
        ],
      },
    },
    {
      id: 'plan',
      etiqueta: 'Plan de apoyo',
      titulo: 'Me escribió a las 2 de la mañana.',
      parrafo:
        'No hay botón de pánico: hay un plan que armaron juntas. Contacto de confianza, pasos, recursos. Si lo usa, te enteras. NOEMA nunca finge contener la crisis: lleva a ayuda real.',
      marco: 'laptop-telefono',
      ms: 16000,
      laptop: {
        ruta: '/pacientes/{vinc}/plan-apoyo',
        guion: [
          { tipo: 'esperar', ms: 900 },
          { tipo: 'chip', texto: 'Contacto de confianza' },
          { tipo: 'scrollLento', ms: 5000, volver: true },
          { tipo: 'chip', texto: 'Pasos acordados' },
          { tipo: 'esperar', ms: 1500 },
          { tipo: 'chip', texto: 'Ayuda real, no una app' },
        ],
      },
      telefono: {
        ruta: '/paciente/crisis',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'resaltar', sel: '@contacto-crisis' },
          { tipo: 'esperar', ms: 1800 },
          { tipo: 'resaltar', sel: '@plan-apoyo' },
          { tipo: 'scrollLento', ms: 2500 },
          { tipo: 'esperar', ms: 800 },
          { tipo: 'resaltar', sel: '@lineas' },
          { tipo: 'esperar', ms: 1500 },
          { tipo: 'resaltar', sel: null },
          { tipo: 'scrollLento', ms: 800, hasta: 0 },
        ],
      },
    },
    {
      id: 'tareas',
      etiqueta: 'Tareas',
      titulo: 'Se me olvidó lo que dijimos en sesión.',
      parrafo:
        'A ella no: la tarea trae campos, escalas y fecha límite. La responde desde su teléfono y tú comentas cada respuesta. El ciclo se cierra.',
      marco: 'laptop-telefono',
      ms: 16000,
      laptop: {
        ruta: '/pacientes/{vinc}/ejercicios',
        guion: [
          { tipo: 'esperar', ms: 700 },
          { tipo: 'clic', sel: '@asignar button' },
          { tipo: 'esperar', ms: 800 },
          { tipo: 'chip', texto: 'Plantillas con formato' },
          { tipo: 'scrollLento', sel: '.fixed.inset-0 form', ms: 2200, volver: true },
          { tipo: 'esperar', ms: 600 },
          { tipo: 'clic', sel: '.fixed.inset-0 h2 + button' },
          { tipo: 'chip', texto: 'Respuestas del paciente' },
          { tipo: 'scrollLento', ms: 5500, volver: true },
          { tipo: 'chip', texto: 'Tu retroalimentación' },
        ],
      },
      telefono: {
        ruta: '/paciente/tareas',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 900 },
          { tipo: 'scrollLento', ms: 6000, volver: true },
          { tipo: 'esperar', ms: 800 },
        ],
      },
    },
    {
      id: 'mensajes',
      etiqueta: 'Mensajes',
      titulo: '"Hoy no fue un buen día."',
      parrafo:
        'Un chat con tu paciente, sin dar tu número personal. Respuestas rápidas para lo habitual. Le llega con aviso a su teléfono.',
      marco: 'laptop-telefono',
      ms: 17000,
      laptop: {
        ruta: '/mensajes/{vinc}',
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'scrollLento', sel: '@hilo', ms: 2200, hasta: 'fin' },
          { tipo: 'chip', texto: 'Respuestas rápidas' },
          {
            tipo: 'escribir',
            sel: '@chat-texto',
            texto: 'Gracias por contármelo. Lo vemos el jueves con calma.',
            msPorLetra: 32,
          },
          { tipo: 'esperar', ms: 400 },
          { tipo: 'clic', sel: '@composer button[type="submit"]' },
          { tipo: 'chip', texto: 'Aviso en su teléfono' },
          { tipo: 'esperar', ms: 2500 },
        ],
      },
      telefono: {
        ruta: '/paciente/mensajes',
        guion: [
          { tipo: 'esperar', ms: 1200 },
          { tipo: 'scrollLento', sel: '@hilo', ms: 2500, hasta: 'fin' },
          { tipo: 'esperar', ms: 6000 },
          { tipo: 'scrollLento', sel: '@hilo', ms: 1200, hasta: 'fin' },
        ],
      },
    },
    {
      id: 'nom',
      etiqueta: 'NOM-004',
      titulo: 'Cumplimiento mexicano, de fábrica.',
      parrafo:
        'Nota inicial con los rubros de la NOM-004, consentimiento informado firmado, aviso de privacidad. Un expediente clínico en orden sin armar una sola plantilla.',
      marco: 'laptop',
      ms: 13000,
      chips: ['Nota inicial NOM-004', 'Consentimiento firmado', 'Aviso de privacidad'],
      laptop: {
        ruta: '/pacientes/{vinc}/historial',
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'scrollLento', ms: 8000, volver: true },
        ],
      },
    },
    {
      id: 'datos',
      etiqueta: 'Datos duros',
      titulo: 'Patrones, sin interpretar de más.',
      parrafo:
        'Cuántos registros recibes, qué emociones aparecen más, cuánto se cumplen las tareas. NOEMA muestra los datos; interpretarlos es tuyo.',
      marco: 'laptop',
      ms: 13000,
      chips: ['Registros recibidos', 'Adherencia a tareas', 'Emociones más registradas'],
      laptop: {
        ruta: '/analiticas',
        guion: [
          { tipo: 'esperar', ms: 600 },
          { tipo: 'contadores', sel: '@kpis-analiticas', ms: 1500 },
          { tipo: 'esperar', ms: 1200 },
          { tipo: 'scrollLento', ms: 5500, volver: true },
        ],
      },
    },
    {
      id: 'decides',
      etiqueta: 'Tú decides',
      titulo: 'Cada paciente, con lo que necesita.',
      parrafo:
        'Tú decides qué funciones ve cada paciente, cuándo no molestarte y si tu sesión se cierra sola. Y cuando tu consulta crece, NOEMA escala al centro terapéutico con supervisión clínica.',
      marco: 'laptop',
      ms: 13000,
      chips: ['Funciones por paciente', 'No molestar por horario', 'Del consultorio a la clínica'],
      laptop: {
        ruta: '/ajustes',
        guion: [
          { tipo: 'esperar', ms: 700 },
          { tipo: 'scrollLento', sel: '@config-paciente', ms: 1800, hasta: 'fin' },
          { tipo: 'esperar', ms: 600 },
          { tipo: 'scrollLento', ms: 5000, volver: true },
        ],
      },
    },
    {
      id: 'precio',
      etiqueta: 'Precio justo',
      titulo: 'Un precio que no te distrae de tu consulta.',
      parrafo: PRECIO_NOEMA.nota,
      marco: 'ninguno',
      especial: 'precio',
      precio: PRECIO_NOEMA,
      ms: 14000,
    },
  ],
};
