import type { Recorrido } from './tipos';
import { PRECIO_NOEMA } from './precio';

/**
 * Recorrido guiado del sandbox del paciente (fase 26): la app como la ve
 * Mariana. Mismo motor, mismos pasos con tarjeta y resaltado; al final invita
 * a moverle y a saltar al lado de la psicóloga.
 */
export const RECORRIDO_PACIENTE: Recorrido = {
  rol: 'paciente',
  pasos: [
    {
      id: 'inicio',
      etiqueta: 'Tu inicio',
      titulo: 'Tu proceso continúa acompañado.',
      texto:
        'Al abrir NOEMA, Mariana encuentra un mensaje escrito a partir de sus propios registros, su próxima sesión y sus accesos. Nada genérico: todo es de ella.',
      ruta: '/paciente',
      ms: 22000,
      acciones: [
        { tipo: 'navegar', ruta: '/paciente', esperar: '@frase' },
        { tipo: 'resaltar', sel: '@frase' },
        { tipo: 'esperar', ms: 3000 },
        { tipo: 'resaltar', sel: '@mensaje-noema' },
        { tipo: 'esperar', ms: 4500 },
        { tipo: 'resaltar', sel: '@banner-emocion' },
        { tipo: 'esperar', ms: 2200 },
        { tipo: 'resaltar', sel: '@accesos' },
        { tipo: 'esperar', ms: 2200 },
        { tipo: 'resaltar', sel: '@resumen' },
        { tipo: 'esperar', ms: 3200 },
      ],
    },
    {
      id: 'registrar',
      etiqueta: 'Registro del día',
      titulo: '¿Cómo te sientes ahora?',
      texto:
        'Registrar toma dos toques: la emoción, la intensidad y, si quiere, qué lo detonó. Lo hacemos ahora mismo.',
      ruta: '/paciente/registros',
      ms: 26000,
      tarjeta: 'derecha',
      acciones: [
        { tipo: 'navegar', ruta: '/paciente/registros', esperar: '@registrar' },
        { tipo: 'clic', sel: '@btn-registrar' },
        { tipo: 'esperar', ms: 600 },
        { tipo: 'resaltar', sel: '@form-registro' },
        { tipo: 'clic', sel: '@emocion-tranquilo' },
        { tipo: 'esperar', ms: 500 },
        { tipo: 'escribir', sel: '@situacion', texto: 'Dormí bien' },
        {
          tipo: 'escribir',
          sel: '@descripcion',
          texto: 'Hoy dormí siete horas. Tengo junta, pero me siento con energía.',
        },
        { tipo: 'esperar', ms: 700 },
        { tipo: 'clic', sel: '@guardar-registro' },
        { tipo: 'esperar', ms: 2600 },
        { tipo: 'resaltar', sel: '@lista-registros' },
        { tipo: 'scrollLento', ms: 5000, volver: true },
      ],
    },
    {
      id: 'privacidad',
      etiqueta: 'Privacidad',
      titulo: 'Esto no quiero que lo lea nadie.',
      texto:
        'Cada registro y cada página del diario tiene tres niveles: privado, compartido o marcado para sesión. Lo privado nunca sale del teléfono de Mariana. Lo marcado para sesión es su forma de decir "de esto quiero hablar".',
      ruta: '/paciente/diario',
      ms: 18000,
      acciones: [
        { tipo: 'navegar', ruta: '/paciente/diario', esperar: '@diario-escribir' },
        { tipo: 'resaltar', sel: '@diario-escribir' },
        { tipo: 'esperar', ms: 2500 },
        { tipo: 'resaltar', sel: null },
        { tipo: 'scrollLento', ms: 8000, volver: true },
      ],
    },
    {
      id: 'tareas',
      etiqueta: 'Tareas',
      titulo: 'Se me olvidó lo que dijimos en sesión.',
      texto:
        'Aquí no se olvida: la tarea trae instrucciones, campos para responder y la retroalimentación de su psicóloga cuando la revisa.',
      ruta: '/paciente/tareas',
      ms: 20000,
      acciones: [
        { tipo: 'navegar', ruta: '/paciente/tareas', esperar: '@tareas' },
        { tipo: 'resaltar', sel: '[data-demo-tarea="pendiente"]' },
        { tipo: 'esperar', ms: 3500 },
        { tipo: 'resaltar', sel: null },
        { tipo: 'scrollLento', ms: 9000, volver: true },
      ],
    },
    {
      id: 'mensajes',
      etiqueta: 'Mensajes',
      titulo: 'Hoy no fue un buen día. ¿A quién le digo?',
      texto:
        'A su psicóloga, aquí. Sin WhatsApp ni número personal. Ella responde cuando puede, y a Mariana le llega con aviso.',
      ruta: '/paciente/mensajes',
      ms: 22000,
      tarjeta: 'derecha',
      acciones: [
        { tipo: 'navegar', ruta: '/paciente/mensajes', esperar: '@hilo' },
        { tipo: 'scrollLento', sel: '@hilo', ms: 3000, hasta: 'fin' },
        { tipo: 'resaltar', sel: '@hilo' },
        { tipo: 'esperar', ms: 1800 },
        { tipo: 'resaltar', sel: null },
        {
          tipo: 'escribir',
          sel: '@chat-texto',
          texto: 'Hoy sí pude entrar a la junta. Gracias por lo de ayer.',
          msPorLetra: 30,
        },
        { tipo: 'esperar', ms: 500 },
        { tipo: 'clic', sel: '@chat-enviar' },
        { tipo: 'esperar', ms: 2500 },
      ],
    },
    {
      id: 'plan',
      etiqueta: 'Plan de apoyo',
      titulo: 'Son las 2 de la mañana y no puedo.',
      texto:
        'Para ese momento existe el plan de apoyo: contactar a su psicóloga, los pasos que acordaron, su contacto de confianza y las líneas de emergencia. Si lo usa, su psicóloga se entera.',
      ruta: '/paciente/crisis',
      ms: 20000,
      acciones: [
        { tipo: 'navegar', ruta: '/paciente/crisis', esperar: '@contacto-crisis' },
        {
          tipo: 'bloques',
          sels: ['@contacto-crisis', '@plan-apoyo', '@lineas'],
          msPorBloque: 4500,
        },
      ],
    },
    {
      id: 'progreso',
      etiqueta: 'Progreso',
      titulo: '¿De verdad estoy mejorando?',
      texto:
        'Su progreso combina constancia, bienestar, tareas y sesiones. Datos de ella, sin etiquetas ni diagnósticos: eso es de su psicóloga.',
      ruta: '/paciente/progreso',
      ms: 20000,
      acciones: [
        { tipo: 'navegar', ruta: '/paciente/progreso', esperar: '@puntaje' },
        { tipo: 'resaltar', sel: '@puntaje' },
        { tipo: 'graficas', sel: '@puntaje' },
        { tipo: 'contadores', sel: '@puntaje', ms: 1400 },
        { tipo: 'esperar', ms: 2200 },
        { tipo: 'resaltar', sel: '@bienestar' },
        { tipo: 'graficas', sel: '@bienestar' },
        { tipo: 'esperar', ms: 2600 },
        { tipo: 'resaltar', sel: '@logros' },
        { tipo: 'esperar', ms: 3000 },
      ],
    },
    {
      id: 'sesiones',
      etiqueta: 'Sesiones',
      titulo: 'El jueves a las 5, sin recordatorios en papel.',
      texto:
        'Sus próximas citas con hora, modalidad y enlace. Y el historial de lo que ya trabajaron.',
      ruta: '/paciente/sesiones',
      ms: 12000,
      acciones: [
        { tipo: 'navegar', ruta: '/paciente/sesiones' },
        { tipo: 'scrollLento', ms: 6000, volver: true },
      ],
    },
    {
      id: 'precio',
      etiqueta: 'Para tu psicóloga',
      titulo: `Para ti no cuesta nada.`,
      texto: `Tu psicóloga paga $${PRECIO_NOEMA.monto} ${PRECIO_NOEMA.unidad} por NOEMA con todos sus pacientes. ${PRECIO_NOEMA.nota}`,
      ruta: '/paciente',
      ms: 8000,
      acciones: [
        { tipo: 'navegar', ruta: '/paciente', esperar: '@frase' },
        { tipo: 'resaltar', sel: null },
      ],
    },
    {
      id: 'cierre',
      etiqueta: 'Pruébalo tú',
      titulo: 'Ahora pruébalo tú.',
      texto:
        'Registra cómo te sientes, responde una tarea o escríbele a Valeria. Luego toca "Ver como psicóloga" arriba: lo que hiciste ya está en su panel.',
      ruta: '/paciente',
      ms: 6000,
      cierre: true,
      acciones: [
        { tipo: 'navegar', ruta: '/paciente', esperar: '@frase' },
        { tipo: 'resaltar', sel: null },
      ],
    },
  ],
};
