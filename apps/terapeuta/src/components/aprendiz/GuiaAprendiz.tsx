'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { GraduationCap, X, ChevronRight, ChevronLeft } from 'lucide-react';

interface Guia {
  titulo: string;
  pasos: string[];
}

// Guía por sección. La clave más específica que haga match con la ruta gana.
const GUIAS: Record<string, Guia> = {
  // ── Terapeuta ──
  '/inicio': {
    titulo: 'Tu panel de inicio',
    pasos: [
      'Aquí ves un resumen de tu consulta: pacientes activos, sesiones de la semana, registros y mensajes sin leer.',
      'Cada tarjeta te lleva a su sección. Toca los números para ir directo.',
      'Las gráficas muestran tu carga semanal y la distribución de riesgo de tus pacientes.',
    ],
  },
  '/pacientes': {
    titulo: 'Tus pacientes',
    pasos: [
      'Aquí gestionas a tus pacientes. Entra a cada uno para ver su expediente, registros, diario, sesiones, tareas y notas.',
      'Con el botón de vincular generas un código para invitar a un paciente nuevo.',
    ],
  },
  '/recursos': {
    titulo: 'Biblioteca',
    pasos: [
      'Aquí están tus plantillas y formatos, en carpetas. Todo es editable como un formulario tipo Google Forms.',
      'Puedes crear recursos nuevos, subir materiales (PDF, audios, enlaces) y luego asignarlos como tarea desde la ficha del paciente.',
    ],
  },
  '/sesiones': {
    titulo: 'Agenda',
    pasos: [
      'Tu calendario con todas las citas. Cambia entre vista de Calendario y Lista.',
      'Toca un día para ver sus sesiones, o programa una nueva con el botón de arriba.',
    ],
  },
  '/finanzas': {
    titulo: 'Finanzas de tu negocio',
    pasos: [
      'Aquí llevas ingresos, gastos fijos y variables, impuestos y activos de tu consultorio.',
      'Registra pagos de pacientes y agrega tus gastos para ver tu utilidad y márgenes del mes.',
    ],
  },
  '/mensajes': {
    titulo: 'Mensajes',
    pasos: ['Conversaciones en tiempo real con tus pacientes. Puedes guardar mensajes rápidos para responder de un toque.'],
  },
  '/ajustes': {
    titulo: 'Ajustes',
    pasos: [
      'Aquí configuras tu perfil, foto, plan y las funciones que cada paciente puede usar.',
      'También puedes activar o desactivar este modo aprendiz cuando quieras.',
    ],
  },
  // ── Paciente ──
  '/paciente/registros': {
    titulo: 'Mis registros',
    pasos: [
      'Anota cómo te sientes con el botón grande. Elige una emoción, su intensidad y qué la detonó.',
      'Tú decides si cada registro es privado, lo compartes con tu terapeuta o lo marcas para sesión.',
    ],
  },
  '/paciente/diario': {
    titulo: 'Tu diario',
    pasos: [
      'Un espacio para escribir libremente, como un cuaderno. Lo privado nunca lo ve nadie más.',
      'Toca "Escribir en mi diario" para abrir una hoja a pantalla completa.',
    ],
  },
  '/paciente/tareas': {
    titulo: 'Tareas',
    pasos: ['Aquí respondes las tareas que te deja tu terapeuta, cada pregunta en su espacio, y las envías cuando termines.'],
  },
  '/paciente/progreso': {
    titulo: 'Tu progreso',
    pasos: [
      'Aquí ves tus logros y tu avance: tu constancia, tu bienestar y tus tareas.',
      'Si algo puede mejorar, te damos una recomendación amable para seguir avanzando.',
    ],
  },
  '/paciente/mensajes': {
    titulo: 'Mensajes',
    pasos: ['Habla con tu terapeuta. Responde en horas de consulta.'],
  },
  '/paciente': {
    titulo: 'Bienvenido a NOEMA',
    pasos: [
      'Este es tu espacio de acompañamiento entre sesiones.',
      'Desde el menú puedes registrar emociones, escribir en tu diario, ver tus tareas y tu progreso.',
      'El botón de apoyo está siempre a la mano, en la pestaña del borde derecho.',
    ],
  },
};

function guiaParaRuta(pathname: string): { clave: string; guia: Guia } | null {
  const claves = Object.keys(GUIAS).sort((a, b) => b.length - a.length); // más específica primero
  for (const c of claves) {
    if (pathname === c || pathname.startsWith(c + '/')) {
      return { clave: c, guia: GUIAS[c]! };
    }
  }
  return null;
}

/**
 * Tour guiado (modo aprendiz). Muestra una tarjeta con pasos que explican la
 * sección actual. Se descarta por sección (localStorage) y respeta la
 * preferencia global del usuario (activo).
 */
export function GuiaAprendiz({ activo }: { activo: boolean }) {
  const pathname = usePathname();
  const [paso, setPaso] = useState(0);
  const [cerrado, setCerrado] = useState(true);
  const match = guiaParaRuta(pathname);

  useEffect(() => {
    if (!activo || !match) {
      setCerrado(true);
      return;
    }
    // ¿ya se vio esta sección?
    const key = `guia-aprendiz:${match.clave}:v1`;
    const visto = typeof window !== 'undefined' && window.localStorage.getItem(key);
    setCerrado(!!visto);
    setPaso(0);
  }, [pathname, activo, match?.clave]);

  if (!activo || !match || cerrado) return null;

  const { guia, clave } = match;
  const esUltimo = paso >= guia.pasos.length - 1;

  const cerrar = () => {
    try {
      window.localStorage.setItem(`guia-aprendiz:${clave}:v1`, '1');
    } catch {
      /* ignore */
    }
    setCerrado(true);
  };

  return (
    <div className="fixed inset-x-3 bottom-4 z-[60] mx-auto max-w-md rounded-2xl border border-noema-sage/30 bg-white p-4 shadow-xl sm:left-auto sm:right-6 sm:mx-0">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-noema-sage/15 text-noema-sage">
          <GraduationCap className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-noema-sage">
              Modo aprendiz
            </p>
            <button onClick={cerrar} aria-label="Cerrar guía" className="text-foreground-muted hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
          <h3 className="font-serif text-lg text-ink">{guia.titulo}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink/80">{guia.pasos[paso]}</p>

          <div className="mt-3 flex items-center justify-between">
            {/* Puntos de progreso */}
            <div className="flex gap-1">
              {guia.pasos.map((_, i) => (
                <span
                  key={i}
                  className={`size-1.5 rounded-full ${i === paso ? 'bg-noema-sage' : 'bg-noema-deep/15'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              {paso > 0 && (
                <button
                  onClick={() => setPaso((p) => p - 1)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-ink/70 hover:bg-bone"
                >
                  <ChevronLeft className="size-4" /> Atrás
                </button>
              )}
              {esUltimo ? (
                <button
                  onClick={cerrar}
                  className="rounded-md bg-noema-deep px-3.5 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
                >
                  Entendido
                </button>
              ) : (
                <button
                  onClick={() => setPaso((p) => p + 1)}
                  className="inline-flex items-center gap-1 rounded-md bg-noema-deep px-3.5 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
                >
                  Siguiente <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
