import type { VideoDemo } from './tipos';

/**
 * Video demo del paciente (fases 31 a 33): 11 diapositivas contadas desde
 * Mariana. Títulos gancho desde lo que siente la paciente; en cada una su
 * app real corre dentro del teléfono y se opera sola.
 */
export const VIDEO_PACIENTE: VideoDemo = {
  rol: 'paciente',
  diapositivas: [
    {
      id: 'portada',
      etiqueta: 'La app de tu proceso',
      titulo: 'NOEMA, en tu bolsillo.',
      parrafo:
        'Se instala como cualquier app. Tu psicóloga te da un código y en dos minutos quedan conectadas.',
      marco: 'ninguno',
      especial: 'portada',
      ms: 7000,
    },
    {
      id: 'inicio',
      etiqueta: 'Su inicio',
      titulo: 'Hola, Mariana.',
      parrafo:
        'Un mensaje escrito a partir de sus propios registros, su próxima sesión y sus accesos. Nada genérico: todo es de ella.',
      marco: 'telefono',
      ms: 14000,
      chips: ['Mensaje para ti', 'Tu próxima sesión', 'Tus accesos'],
      telefono: {
        ruta: '/paciente',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 900 },
          { tipo: 'resaltar', sel: '@mensaje-noema' },
          { tipo: 'esperar', ms: 2400 },
          { tipo: 'resaltar', sel: null },
          { tipo: 'scrollLento', ms: 4500, volver: true },
          { tipo: 'esperar', ms: 900 },
        ],
      },
    },
    {
      id: 'registro',
      etiqueta: 'Registro del día',
      titulo: '¿Cómo te sientes ahora?',
      parrafo:
        'Registrar toma dos toques: la emoción, la intensidad y, si quiere, qué lo detonó. Sin formularios eternos.',
      marco: 'telefono',
      ms: 16000,
      chips: ['Dos toques', 'Intensidad del 1 al 5', 'Qué lo detonó'],
      telefono: {
        ruta: '/paciente/registros',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'clic', sel: '@btn-registrar' },
          { tipo: 'esperar', ms: 500 },
          { tipo: 'clic', sel: '@emocion-tranquilo' },
          { tipo: 'esperar', ms: 400 },
          { tipo: 'escribir', sel: '@situacion', texto: 'Dormí bien' },
          {
            tipo: 'escribir',
            sel: '@descripcion',
            texto: 'Siete horas seguidas. Tengo junta, pero con energía.',
          },
          { tipo: 'esperar', ms: 700 },
          { tipo: 'clic', sel: '@guardar-registro' },
          { tipo: 'esperar', ms: 2600 },
          { tipo: 'scrollLento', ms: 2500, volver: true },
        ],
      },
    },
    {
      id: 'privacidad',
      etiqueta: 'Privacidad',
      titulo: 'Esto no quiero que lo lea nadie.',
      parrafo:
        'Cada registro y cada página del diario tiene tres niveles: privado, compartido o marcado para sesión. Lo privado nunca sale de su teléfono.',
      marco: 'telefono',
      ms: 15000,
      chips: ['Privado · solo ella', 'Compartido · lo ve su psicóloga', 'Marcado para sesión'],
      telefono: {
        ruta: '/paciente/diario',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'resaltar', sel: '@diario-escribir' },
          { tipo: 'esperar', ms: 1600 },
          { tipo: 'resaltar', sel: null },
          { tipo: 'scrollLento', ms: 6500, volver: true },
          { tipo: 'esperar', ms: 800 },
        ],
      },
    },
    {
      id: 'tareas',
      etiqueta: 'Tareas',
      titulo: 'Se me olvidó lo que dijimos en sesión.',
      parrafo:
        'Aquí no se olvida: la tarea trae instrucciones, campos para responder y la retroalimentación de su psicóloga cuando la revisa.',
      marco: 'telefono',
      ms: 15000,
      chips: ['Indicaciones de tu psicóloga', 'Campos y escalas', 'Retroalimentación'],
      telefono: {
        ruta: '/paciente/tareas',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'scrollLento', ms: 8000, volver: true },
          { tipo: 'esperar', ms: 900 },
        ],
      },
    },
    {
      id: 'mensajes',
      etiqueta: 'Mensajes',
      titulo: 'Hoy no fue un buen día. ¿A quién le digo?',
      parrafo:
        'A su psicóloga, aquí. Sin WhatsApp ni número personal. Ella responde cuando puede, y a Mariana le llega con aviso.',
      marco: 'telefono',
      ms: 16000,
      chips: ['Sin número personal', 'Le llega con aviso'],
      telefono: {
        ruta: '/paciente/mensajes',
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'scrollLento', sel: '@hilo', ms: 2600, hasta: 'fin' },
          { tipo: 'esperar', ms: 600 },
          {
            tipo: 'escribir',
            sel: '@chat-texto',
            texto: 'Hoy sí pude entrar a la junta. Gracias por lo de ayer.',
            msPorLetra: 34,
          },
          { tipo: 'esperar', ms: 500 },
          { tipo: 'clic', sel: '@chat-enviar' },
          { tipo: 'esperar', ms: 2000 },
          { tipo: 'scrollLento', sel: '@hilo', ms: 1000, hasta: 'fin' },
        ],
      },
    },
    {
      id: 'plan',
      etiqueta: 'Plan de apoyo',
      titulo: 'Son las 2 de la mañana y no puedo.',
      parrafo:
        'Para ese momento existe el plan de apoyo: contactar a su psicóloga, los pasos que acordaron, su contacto de confianza y las líneas de emergencia. Si lo usa, su psicóloga se entera.',
      marco: 'telefono',
      ms: 16000,
      chips: ['Contacto de confianza', 'Pasos acordados', 'Líneas de emergencia'],
      telefono: {
        ruta: '/paciente/crisis',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'resaltar', sel: '@contacto-crisis' },
          { tipo: 'esperar', ms: 2000 },
          { tipo: 'resaltar', sel: '@plan-apoyo' },
          { tipo: 'scrollLento', ms: 2600 },
          { tipo: 'esperar', ms: 900 },
          { tipo: 'resaltar', sel: '@lineas' },
          { tipo: 'esperar', ms: 1800 },
          { tipo: 'resaltar', sel: null },
          { tipo: 'scrollLento', ms: 900, hasta: 0 },
        ],
      },
    },
    {
      id: 'progreso',
      etiqueta: 'Progreso',
      titulo: '¿De verdad estoy mejorando?',
      parrafo:
        'Su progreso combina constancia, bienestar, tareas y sesiones. Datos de ella, sin etiquetas ni diagnósticos: eso es de su psicóloga.',
      marco: 'telefono',
      ms: 15000,
      chips: ['Tu puntaje', 'Bienestar por semana', 'Tus logros'],
      telefono: {
        ruta: '/paciente/progreso',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 800 },
          { tipo: 'graficas', sel: '@puntaje' },
          { tipo: 'contadores', sel: '@puntaje', ms: 1300 },
          { tipo: 'esperar', ms: 1200 },
          { tipo: 'graficas', sel: '@bienestar' },
          { tipo: 'esperar', ms: 1500 },
          { tipo: 'scrollLento', ms: 4500, volver: true },
        ],
      },
    },
    {
      id: 'noema-para-ti',
      etiqueta: 'NOEMA para ti',
      titulo: 'Un mensaje que nace de lo que registré.',
      parrafo:
        'Cada día, un mensaje de acompañamiento escrito a partir de sus propios registros, con una acción pequeña y concreta. Su psicóloga no lo ve: es para ella.',
      marco: 'telefono',
      ms: 13000,
      chips: ['De tus propios registros', 'Una acción concreta', 'Sin frases genéricas'],
      telefono: {
        ruta: '/paciente',
        repetir: true,
        guion: [
          { tipo: 'esperar', ms: 900 },
          { tipo: 'resaltar', sel: '@mensaje-noema' },
          { tipo: 'esperar', ms: 5000 },
          { tipo: 'resaltar', sel: null },
          { tipo: 'esperar', ms: 1000 },
        ],
      },
    },
    {
      id: 'dos-lados',
      etiqueta: 'Dos lados',
      titulo: 'Lo que ella registra, su psicóloga lo ve.',
      parrafo:
        'Mariana registra en su teléfono y a su psicóloga le aparece cuando pasa, también desde el teléfono. Un mismo proceso, visto desde los dos lados.',
      marco: 'dos-telefonos',
      ms: 17000,
      chips: ['Ella registra', 'Su psicóloga lo ve', 'Cuando pasa, no una semana después'],
      telefono: {
        ruta: '/paciente/registros',
        guion: [
          { tipo: 'esperar', ms: 900 },
          { tipo: 'clic', sel: '@btn-registrar' },
          { tipo: 'esperar', ms: 500 },
          { tipo: 'clic', sel: '@emocion-orgulloso' },
          {
            tipo: 'escribir',
            sel: '@descripcion',
            texto: 'Le dije que no a un proyecto extra. Temblé, pero lo dije.',
          },
          { tipo: 'esperar', ms: 600 },
          { tipo: 'clic', sel: '@guardar-registro' },
          { tipo: 'esperar', ms: 4000 },
        ],
      },
      telefono2: {
        ruta: '/pacientes/{vinc}/registros',
        guion: [
          { tipo: 'esperar', ms: 7500 },
          { tipo: 'refrescar' },
          { tipo: 'esperar', ms: 1200 },
          { tipo: 'resaltar', sel: '@registros-titulo' },
          { tipo: 'scrollLento', ms: 2200 },
          { tipo: 'esperar', ms: 2000 },
          { tipo: 'resaltar', sel: null },
        ],
      },
    },
    {
      id: 'instalala',
      etiqueta: 'Instálala hoy',
      titulo: 'Se abre como cualquier app.',
      parrafo:
        'Tu psicóloga te da un código; lo escribes en NOEMA y quedan vinculadas en dos minutos. Agrégala a tu pantalla de inicio: tus registros, tus tareas y tu psicóloga, siempre contigo.',
      marco: 'ninguno',
      especial: 'cierre',
      ms: 14000,
    },
  ],
};
