import type { Recorrido } from './tipos';
import { PRECIO_NOEMA } from './precio';

/**
 * Recorrido guiado del sandbox de la psicóloga (fase 13).
 *
 * Cada paso sucede sobre la app real con la cuenta demo: navega, resalta,
 * hace clic, escribe y abre la ventana de teléfono con la app de Mariana
 * (la paciente demo) para mostrar el otro lado de la historia. Las rutas
 * con {vinc} se resuelven a la vinculación de la paciente principal.
 */
export const RECORRIDO_PSICOLOGO: Recorrido = {
  rol: 'psicologo',
  pasos: [
    {
      id: 'panel',
      etiqueta: 'Tu panel',
      titulo: '¿Qué pasó entre el martes y el martes?',
      texto:
        'Al entrar ves tu consulta de un vistazo: pacientes activos, sesiones de la semana, registros que llegaron y mensajes sin leer. Nada de esto lo capturaste tú.',
      ruta: '/inicio',
      ms: 24000,
      acciones: [
        { tipo: 'navegar', ruta: '/inicio', esperar: '@kpis' },
        { tipo: 'resaltar', sel: '@kpis' },
        { tipo: 'contadores', sel: '@kpis', ms: 1500 },
        { tipo: 'esperar', ms: 3200 },
        { tipo: 'resaltar', sel: '@carga' },
        { tipo: 'graficas', sel: '@carga' },
        { tipo: 'esperar', ms: 2200 },
        { tipo: 'resaltar', sel: '@riesgo' },
        { tipo: 'graficas', sel: '@riesgo' },
        { tipo: 'esperar', ms: 2600 },
        { tipo: 'resaltar', sel: '@pacientes-recientes' },
        { tipo: 'esperar', ms: 3200 },
        { tipo: 'resaltar', sel: '@proximas' },
        { tipo: 'esperar', ms: 2600 },
      ],
    },
    {
      id: 'pacientes',
      etiqueta: 'Tus pacientes',
      titulo: 'Mi paciente no vino y no sé cómo está.',
      texto:
        'Aquí sí lo sabes. Cada paciente trae su nivel de riesgo, su última actividad y su estado. Abrimos la ficha de Mariana.',
      ruta: '/pacientes',
      ms: 16000,
      acciones: [
        { tipo: 'navegar', ruta: '/pacientes', esperar: '@lista-pacientes' },
        { tipo: 'resaltar', sel: '@lista-pacientes' },
        { tipo: 'scrollLento', ms: 3200, volver: true },
        { tipo: 'esperar', ms: 1200 },
        { tipo: 'clic', sel: '[data-demo-paciente="Mariana Soto"]' },
      ],
    },
    {
      id: 'ficha',
      etiqueta: 'Expediente',
      titulo: 'Un expediente que se llena solo.',
      texto:
        'Registros compartidos, intensidad promedio, emociones frecuentes. Todo viene de lo que Mariana anota en su teléfono, ordenado para tu sesión.',
      ruta: '/pacientes/{vinc}',
      ms: 20000,
      acciones: [
        { tipo: 'navegar', ruta: '/pacientes/{vinc}', esperar: '@panorama' },
        { tipo: 'resaltar', sel: '@cabecera-paciente' },
        { tipo: 'esperar', ms: 2200 },
        { tipo: 'resaltar', sel: '@panorama' },
        { tipo: 'contadores', sel: '@panorama', ms: 1400 },
        { tipo: 'esperar', ms: 2800 },
        { tipo: 'bloques', sels: ['@ultimo-registro', '@emociones-frecuentes'], msPorBloque: 3600 },
      ],
    },
    {
      id: 'privacidad',
      etiqueta: 'Privacidad',
      titulo: 'Ella decide qué compartes.',
      texto:
        'Cada registro nace privado, compartido o marcado para sesión. Tú solo ves lo que ella decidió. Lo marcado para sesión es su forma de decir: de esto quiero hablar contigo.',
      ruta: '/pacientes/{vinc}/registros',
      ms: 18000,
      acciones: [
        { tipo: 'clic', sel: '@tab-registros' },
        { tipo: 'navegar', ruta: '/pacientes/{vinc}/registros', esperar: '@registros-titulo' },
        { tipo: 'resaltar', sel: null },
        { tipo: 'scrollLento', ms: 9000, volver: true },
      ],
    },
    {
      id: 'en-vivo',
      etiqueta: 'En vivo',
      titulo: 'Lo ves cuando pasa, no una semana después.',
      texto:
        'Mariana registra desde su teléfono y a ti te aparece al instante, con aviso. Así se ve de su lado.',
      ruta: '/pacientes/{vinc}/registros',
      ms: 30000,
      tarjeta: 'izquierda',
      acciones: [
        { tipo: 'navegar', ruta: '/pacientes/{vinc}/registros', esperar: '@registros-titulo' },
        {
          tipo: 'telefono',
          ruta: '/paciente/registros',
          rotulo: 'Registra cómo se siente en dos toques, y decide si lo compartes.',
          cerrarAlTerminar: true,
          acciones: [
            { tipo: 'esperar', ms: 800 },
            { tipo: 'clic', sel: '@btn-registrar' },
            { tipo: 'esperar', ms: 600 },
            { tipo: 'clic', sel: '@emocion-ansioso' },
            { tipo: 'esperar', ms: 400 },
            { tipo: 'escribir', sel: '@situacion', texto: 'Trabajo' },
            {
              tipo: 'escribir',
              sel: '@descripcion',
              texto: 'Junta a las 4. Estoy nerviosa, pero creo que lo puedo hacer.',
            },
            { tipo: 'esperar', ms: 600 },
            { tipo: 'clic', sel: '@guardar-registro' },
            { tipo: 'esperar', ms: 2600 },
          ],
        },
        { tipo: 'refrescar' },
        { tipo: 'esperar', ms: 1200 },
        { tipo: 'resaltar', sel: '@registros-titulo' },
        { tipo: 'esperar', ms: 3500 },
      ],
    },
    {
      id: 'diario',
      etiqueta: 'Diario',
      titulo: '"Esto sí lo quiero hablar el jueves."',
      texto:
        'El diario no es un cuaderno: es un puente hacia la sesión. Lo que Mariana marca para sesión te llega con aviso y queda aquí, listo para abrir la conversación.',
      ruta: '/pacientes/{vinc}/diario',
      ms: 16000,
      acciones: [
        { tipo: 'navegar', ruta: '/pacientes/{vinc}/diario', esperar: '@diario-titulo' },
        { tipo: 'scrollLento', ms: 8000, volver: true },
      ],
    },
    {
      id: 'tareas',
      etiqueta: 'Tareas',
      titulo: 'Tareas con formato, no "piénsalo para la próxima".',
      texto:
        'Asignas ejercicios con campos, escalas y fecha límite. Ella responde desde su teléfono y tú comentas cada respuesta. El ciclo se cierra.',
      ruta: '/pacientes/{vinc}/ejercicios',
      ms: 22000,
      acciones: [
        { tipo: 'navegar', ruta: '/pacientes/{vinc}/ejercicios', esperar: '@tareas-titulo' },
        { tipo: 'resaltar', sel: '@asignar' },
        { tipo: 'esperar', ms: 800 },
        { tipo: 'clic', sel: '@asignar button' },
        { tipo: 'esperar', ms: 900 },
        { tipo: 'resaltar', sel: '.fixed.inset-0 form' },
        { tipo: 'esperar', ms: 3600 },
        { tipo: 'clic', sel: '.fixed.inset-0 h2 + button' },
        { tipo: 'resaltar', sel: null },
        { tipo: 'scrollLento', ms: 8000, volver: true },
      ],
    },
    {
      id: 'plan',
      etiqueta: 'Plan de apoyo',
      titulo: 'Me escribió a las 2 de la mañana.',
      texto:
        'No hay botón de pánico: hay un plan de apoyo que armaron juntas. Contacto de confianza, pasos, recursos. Si lo usa, te enteras. Y NOEMA nunca finge contener la crisis: redirige a ayuda real.',
      ruta: '/pacientes/{vinc}/plan-apoyo',
      ms: 30000,
      tarjeta: 'izquierda',
      acciones: [
        { tipo: 'navegar', ruta: '/pacientes/{vinc}/plan-apoyo', esperar: '@plan-titulo' },
        { tipo: 'resaltar', sel: '@plan-apoyo' },
        { tipo: 'scrollLento', ms: 4500, volver: true },
        { tipo: 'resaltar', sel: null },
        {
          tipo: 'telefono',
          ruta: '/paciente/crisis',
          rotulo: 'Su plan de apoyo, siempre a la mano.',
          cerrarAlTerminar: true,
          acciones: [
            { tipo: 'esperar', ms: 600 },
            { tipo: 'resaltar', sel: '@contacto-crisis' },
            { tipo: 'esperar', ms: 2200 },
            { tipo: 'resaltar', sel: '@plan-apoyo' },
            { tipo: 'scrollLento', ms: 3200 },
            { tipo: 'esperar', ms: 800 },
            { tipo: 'resaltar', sel: '@lineas' },
            { tipo: 'esperar', ms: 2000 },
            { tipo: 'resaltar', sel: null },
          ],
        },
      ],
    },
    {
      id: 'mensajes',
      etiqueta: 'Mensajes',
      titulo: '"Hoy no fue un buen día."',
      texto:
        'Un chat con tu paciente, con respuestas rápidas para lo habitual. Le respondemos ahora y vemos cómo le llega.',
      ruta: '/mensajes/{vinc}',
      ms: 34000,
      tarjeta: 'izquierda',
      acciones: [
        { tipo: 'navegar', ruta: '/mensajes/{vinc}', esperar: '@hilo' },
        { tipo: 'resaltar', sel: '@hilo' },
        { tipo: 'scrollLento', sel: '@hilo', ms: 3200, hasta: 'fin' },
        { tipo: 'resaltar', sel: '@composer' },
        {
          tipo: 'escribir',
          sel: '@chat-texto',
          texto:
            'Gracias por contármelo, Mariana. Lo vemos el jueves con calma. Hoy: dos ciclos de respiración y a dormir.',
          msPorLetra: 28,
        },
        { tipo: 'esperar', ms: 500 },
        { tipo: 'clic', sel: '@composer button[type="submit"]' },
        { tipo: 'esperar', ms: 1800 },
        { tipo: 'resaltar', sel: null },
        {
          tipo: 'telefono',
          ruta: '/paciente/mensajes',
          rotulo: 'Tu mensaje le llega al instante, con aviso en su teléfono.',
          cerrarAlTerminar: true,
          acciones: [
            { tipo: 'esperar', ms: 700 },
            { tipo: 'scrollLento', sel: '@hilo', ms: 2600, hasta: 'fin' },
            { tipo: 'resaltar', sel: '@hilo' },
            { tipo: 'esperar', ms: 3000 },
            { tipo: 'resaltar', sel: null },
          ],
        },
      ],
    },
    {
      id: 'ia',
      etiqueta: 'IA con límites',
      titulo: 'Tengo que preparar la sesión de mañana.',
      texto:
        'La IA organiza lo que Mariana compartió: métricas, patrones, lo marcado para sesión. Nunca diagnostica ni sugiere tratamiento: hay filtros en el código que lo impiden. La IA organiza, tú interpretas.',
      ruta: '/pacientes/{vinc}',
      ms: 26000,
      acciones: [
        { tipo: 'navegar', ruta: '/pacientes/{vinc}', esperar: '@resumen-ia' },
        { tipo: 'resaltar', sel: '@resumen-ia' },
        { tipo: 'esperar', ms: 800 },
        { tipo: 'clic', sel: '@resumen-ia button' },
        { tipo: 'esperar', ms: 900 },
        { tipo: 'resaltar', sel: null },
        { tipo: 'clic', sel: '.fixed.inset-0 .border-b .gap-1 > button:first-child' },
        { tipo: 'esperar', ms: 1200 },
        { tipo: 'clic', sel: '.fixed.inset-0 ul li button' },
        { tipo: 'esperar', ms: 1500 },
        { tipo: 'graficas', sel: '.fixed.inset-0 .max-h-\\[80vh\\]' },
        { tipo: 'scrollLento', sel: '.fixed.inset-0 .max-h-\\[80vh\\] h3', ms: 7000, volver: true },
        { tipo: 'esperar', ms: 1200 },
        { tipo: 'clic', sel: '.fixed.inset-0 .border-b .gap-1 > button:last-child' },
      ],
    },
    {
      id: 'expediente',
      etiqueta: 'NOM-004',
      titulo: 'Cumplimiento mexicano, de fábrica.',
      texto:
        'Nota inicial con los rubros de la NOM-004, consentimiento informado firmado, aviso de privacidad. Un expediente clínico en orden sin que armes una sola plantilla.',
      ruta: '/pacientes/{vinc}/historial',
      ms: 16000,
      acciones: [
        { tipo: 'navegar', ruta: '/pacientes/{vinc}/historial' },
        { tipo: 'scrollLento', ms: 9000, volver: true },
      ],
    },
    {
      id: 'analiticas',
      etiqueta: 'Datos duros',
      titulo: 'Patrones, sin interpretar de más.',
      texto:
        'Cuántos registros recibes, qué emociones aparecen más, cuánto se cumplen las tareas. NOEMA muestra los datos; interpretarlos es tuyo.',
      ruta: '/analiticas',
      ms: 18000,
      acciones: [
        { tipo: 'navegar', ruta: '/analiticas', esperar: '@kpis-analiticas' },
        { tipo: 'resaltar', sel: '@kpis-analiticas' },
        { tipo: 'contadores', sel: '@kpis-analiticas', ms: 1500 },
        { tipo: 'esperar', ms: 2800 },
        {
          tipo: 'bloques',
          sels: ['@estado-consulta', '@emociones-registradas'],
          msPorBloque: 4200,
        },
      ],
    },
    {
      id: 'precio',
      etiqueta: 'Precio justo',
      titulo: `$${PRECIO_NOEMA.monto} ${PRECIO_NOEMA.unidad}.`,
      texto: PRECIO_NOEMA.nota,
      ruta: '/inicio',
      ms: 9000,
      acciones: [
        { tipo: 'navegar', ruta: '/inicio', esperar: '@kpis' },
        { tipo: 'resaltar', sel: null },
      ],
    },
    {
      id: 'cierre',
      etiqueta: 'Pruébalo tú',
      titulo: 'Ahora pruébalo tú.',
      texto:
        'Asígnale una tarea a Mariana, escríbele, o revisa su plan de apoyo. Luego toca "Ver como paciente" arriba: todo lo que hiciste le aparece en su teléfono.',
      ruta: '/inicio',
      ms: 6000,
      cierre: true,
      acciones: [
        { tipo: 'navegar', ruta: '/inicio', esperar: '@kpis' },
        { tipo: 'resaltar', sel: null },
      ],
    },
  ],
};
