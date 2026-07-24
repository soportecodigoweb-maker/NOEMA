'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { GraduationCap, X, ChevronRight, ChevronLeft, Power } from 'lucide-react';
import { toggleModoAprendizAction } from '../../../app/(auth)/aprendiz-actions';

/** Un paso del tour: describe una función concreta y, si puede, la resalta. */
interface Paso {
  /** Valor de data-tour del elemento a resaltar. Sin él, el diálogo va al centro. */
  target?: string;
  titulo: string;
  texto: string;
}

/**
 * Guion del tour por sección. La clave más específica que haga match con la
 * ruta gana. En las páginas de inicio recorremos las funciones principales una
 * por una; en las secciones internas explicamos su botón clave.
 */
const GUIAS: Record<string, Paso[]> = {
  // ─────────────── Terapeuta ───────────────
  '/inicio': [
    {
      titulo: 'Tu panel de inicio',
      texto:
        'Aquí ves de un vistazo el estado de tu consulta: pacientes activos, sesiones de la semana, registros nuevos y mensajes sin leer. Vamos a recorrer el menú.',
    },
    {
      target: 'nav-pacientes',
      titulo: 'Pacientes',
      texto:
        'El corazón de tu trabajo. Entra a cada paciente para ver su expediente, registros, diario, tareas, sesiones y notas clínicas. Desde aquí generas el código para vincular a alguien nuevo.',
    },
    {
      target: 'nav-sesiones',
      titulo: 'Sesiones',
      texto:
        'Tu agenda tipo calendario con todas las citas. Programa nuevas sesiones y cámbialas entre vista de calendario y lista. Los horarios usan la zona de Ciudad de México.',
    },
    {
      target: 'nav-mensajes',
      titulo: 'Mensajes',
      texto:
        'Conversaciones en tiempo real con tus pacientes. Puedes guardar respuestas rápidas para contestar de un toque.',
    },
    {
      target: 'nav-recursos',
      titulo: 'Recursos',
      texto:
        'Tu biblioteca de plantillas y formatos, organizada en carpetas. Todo es editable como un formulario, y desde la ficha del paciente lo asignas como tarea.',
    },
    {
      target: 'nav-finanzas',
      titulo: 'Finanzas',
      texto:
        'Lleva ingresos, gastos fijos y variables, impuestos y activos de tu consultorio para ver tu utilidad del mes.',
    },
    {
      target: 'nav-ajustes',
      titulo: 'Ajustes',
      texto:
        'Tu perfil, foto y plan. Aquí también decides qué funciones puede usar cada paciente y puedes apagar este modo aprendiz cuando ya no lo necesites.',
    },
  ],
  '/pacientes': [
    {
      titulo: 'Tus pacientes',
      texto:
        'Cada tarjeta es un paciente. Ábrela para ver su expediente completo: registros emocionales, diario compartido, tareas, sesiones y notas clínicas con base en la NOM-004.',
    },
    {
      titulo: 'Vincular a un paciente',
      texto:
        'Con el botón de vincular generas un código de un solo uso. El paciente lo escribe en su app y queda conectado contigo al instante.',
    },
  ],
  '/recursos': [
    {
      titulo: 'Biblioteca de recursos',
      texto:
        'Aquí viven tus plantillas y materiales, en carpetas. Los formatos oficiales son editables como un formulario tipo Google Forms, sin duplicarse.',
    },
    {
      titulo: 'Crear y asignar',
      texto:
        'Crea recursos nuevos o sube PDF, audios y enlaces. Luego, desde la ficha del paciente, los asignas como tarea.',
    },
  ],
  '/sesiones': [
    {
      titulo: 'Tu agenda',
      texto:
        'El calendario con todas tus citas. Toca un día para ver sus sesiones o programa una nueva. Cambia entre vista de calendario y lista según prefieras.',
    },
  ],
  '/finanzas': [
    {
      titulo: 'Finanzas de tu consulta',
      texto:
        'Registra los pagos de tus pacientes y tus gastos fijos y variables. NOEMA calcula tu utilidad, tus márgenes y una estimación de impuestos del mes.',
    },
  ],
  '/mensajes': [
    {
      titulo: 'Mensajes',
      texto:
        'Chat en tiempo real con tus pacientes. Guarda mensajes rápidos para responder lo habitual de un toque, sin escribir de nuevo.',
    },
  ],
  '/analiticas': [
    {
      titulo: 'Analíticas',
      texto:
        'Métricas de tu consulta e historial clínico agregado. Te ayudan a ver patrones sin interpretar de más: los datos duros, presentados con claridad.',
    },
  ],
  '/ajustes': [
    {
      titulo: 'Ajustes',
      texto:
        'Tu perfil profesional, foto y plan. Más abajo controlas qué funciones ve cada paciente, los sonidos de la app y este modo aprendiz.',
    },
  ],

  // ─────────────── Paciente ───────────────
  '/paciente/registros': [
    {
      target: 'pac-registrar',
      titulo: 'Registrar cómo te sientes',
      texto:
        'Toca este botón para anotar una emoción. Eliges cuál sientes, su intensidad del 1 al 5 y qué la detonó. Es tu bitácora emocional.',
    },
    {
      titulo: 'Tú decides qué se comparte',
      texto:
        'En cada registro escoges: Privado (solo tú lo ves), Compartido (tu terapeuta lo verá) o Para sesión (para hablarlo en tu próxima cita).',
    },
  ],
  '/paciente/diario': [
    {
      target: 'pac-diario-escribir',
      titulo: 'Escribe en tu diario',
      texto:
        'Toca aquí para abrir una hoja a pantalla completa y escribir libremente, como en un cuaderno. Lo que marques como privado nunca lo ve nadie más.',
    },
  ],
  '/paciente/tareas': [
    {
      titulo: 'Tus tareas',
      texto:
        'Aquí aparecen las tareas que te deja tu terapeuta. Respondes cada pregunta en su espacio y las envías cuando termines; tu terapeuta te dará retroalimentación.',
    },
  ],
  '/paciente/progreso': [
    {
      titulo: 'Tu progreso',
      texto:
        'Aquí ves tu avance real: tu constancia registrando, tu bienestar y tus tareas cumplidas. Celebramos lo que va bien y, si algo puede mejorar, te damos una recomendación amable.',
    },
  ],
  '/paciente/metas': [
    {
      titulo: 'Mis metas',
      texto:
        'Define pequeñas metas personales y ve marcándolas. Son tuyas: te ayudan a mantener el rumbo entre sesión y sesión.',
    },
  ],
  '/paciente/mensajes': [
    {
      titulo: 'Mensajes',
      texto:
        'Escríbete con tu terapeuta. La ventana se abre a pantalla completa, como un chat. Tu terapeuta responde en sus horas de consulta.',
    },
  ],
  '/paciente/sesiones': [
    {
      titulo: 'Tus sesiones',
      texto:
        'Aquí ves tus próximas citas con fecha, hora y si son presenciales o por videollamada. Si tu terapeuta lo habilita, también puedes solicitar una.',
    },
  ],
  '/paciente/cuenta': [
    {
      titulo: 'Mi cuenta',
      texto:
        'Cambia tu foto de perfil, activa o desactiva los sonidos de la app y este modo aprendiz, o cierra tu sesión. Tus datos siempre son tuyos.',
    },
  ],
  '/paciente': [
    {
      titulo: 'Bienvenida a NOEMA',
      texto:
        'Este es tu espacio de acompañamiento entre sesiones. Te muestro las funciones principales, una por una.',
    },
    {
      target: 'nav-registros',
      titulo: 'Mis registros',
      texto:
        'Aquí anotas cómo te sientes durante el día. Es lo más importante: mientras más registres, mejor te acompaña tu terapeuta.',
    },
    {
      target: 'nav-diario',
      titulo: 'Diario',
      texto:
        'Un cuaderno para escribir libre. Tú eliges si una entrada es privada o la compartes con tu terapeuta.',
    },
    {
      target: 'nav-tareas',
      titulo: 'Tareas',
      texto:
        'Las actividades que te deja tu terapeuta. Las respondes aquí y recibes su retroalimentación.',
    },
    {
      target: 'nav-progreso',
      titulo: 'Progreso',
      texto: 'Tu avance y tus logros, con recomendaciones amables para seguir adelante.',
    },
    {
      target: 'nav-mensajes',
      titulo: 'Mensajes',
      texto: 'Habla con tu terapeuta cuando lo necesites.',
    },
    {
      target: 'nav-sos',
      titulo: 'Necesito apoyo ahora',
      texto:
        'Si estás en crisis, este botón te da apoyo inmediato: mensaje, llamada o videollamada. Siempre está a la mano en el borde derecho de la pantalla.',
    },
  ],
};

const VERSION = 'v2';

function guiaParaRuta(pathname: string): { clave: string; pasos: Paso[] } | null {
  const claves = Object.keys(GUIAS).sort((a, b) => b.length - a.length);
  for (const c of claves) {
    if (pathname === c || pathname.startsWith(c + '/')) {
      return { clave: c, pasos: GUIAS[c]! };
    }
  }
  return null;
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/** Rectángulo del elemento resaltado (en coordenadas de viewport). */
interface Marco {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Tour guiado (modo aprendiz) con foco tipo "spotlight".
 *
 * Oscurece toda la pantalla y resalta el botón o sección que explica cada paso,
 * con el diálogo saliendo de ese elemento. Si el elemento no está visible (por
 * ejemplo, el menú lateral en móvil), muestra el diálogo centrado igual de
 * específico. Mientras el modo está activo, siempre hay un botón para apagarlo.
 */
export function GuiaAprendiz({ activo }: { activo: boolean }) {
  const pathname = usePathname();
  const match = guiaParaRuta(pathname);
  const pasos = match?.pasos ?? null;

  const [idx, setIdx] = useState(0);
  const [cerrado, setCerrado] = useState(true);
  const [marco, setMarco] = useState<Marco | null>(null);
  const [pending, startTransition] = useTransition();

  const clave = match?.clave;

  // Al cambiar de ruta: reiniciar y decidir si el tour se muestra o no.
  useEffect(() => {
    if (!activo || !pasos || !clave) {
      setCerrado(true);
      return;
    }
    const visto =
      typeof window !== 'undefined' &&
      window.localStorage.getItem(`guia-aprendiz:${clave}:${VERSION}`);
    setCerrado(!!visto);
    setIdx(0);
  }, [pathname, activo, pasos, clave]);

  // Mide el elemento resaltado del paso actual (o null si no hay/está oculto).
  const medir = useCallback(() => {
    const paso = pasos?.[idx];
    if (!paso?.target) {
      setMarco(null);
      return;
    }
    const el = document.querySelector<HTMLElement>(`[data-tour="${paso.target}"]`);
    if (!el) {
      setMarco(null);
      return;
    }
    const r = el.getBoundingClientRect();
    // Oculto (menú cerrado en móvil) o fuera de medida → diálogo centrado.
    if (r.width < 4 || r.height < 4) {
      setMarco(null);
      return;
    }
    setMarco({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [pasos, idx]);

  // Al entrar a un paso: llevar el elemento a la vista y medir varias veces
  // para atrapar el reflow del scroll.
  useEffect(() => {
    if (cerrado || !pasos) return;
    const paso = pasos[idx];
    if (paso?.target) {
      const el = document.querySelector<HTMLElement>(`[data-tour="${paso.target}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const t = [60, 260, 520].map((ms) => window.setTimeout(medir, ms));
    return () => t.forEach(clearTimeout);
  }, [idx, cerrado, pasos, medir]);

  // Recalcular al hacer scroll o cambiar de tamaño mientras el tour está abierto.
  useEffect(() => {
    if (cerrado) return;
    let raf = 0;
    const onMove = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(medir);
    };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
      cancelAnimationFrame(raf);
    };
  }, [cerrado, medir]);

  const desactivar = () => {
    startTransition(async () => {
      await toggleModoAprendizAction(false);
    });
  };

  const cerrarRuta = () => {
    try {
      if (clave) window.localStorage.setItem(`guia-aprendiz:${clave}:${VERSION}`, '1');
    } catch {
      /* ignore */
    }
    setCerrado(true);
  };

  const abrirTour = () => {
    setIdx(0);
    setMarco(null);
    setCerrado(false);
  };

  if (!activo) return null;

  // Sin guía para esta ruta, o tour cerrado → botón flotante para reabrir/apagar.
  if (!pasos || cerrado) {
    return (
      <PildoraAprendiz
        onAbrir={pasos ? abrirTour : undefined}
        onDesactivar={desactivar}
        pending={pending}
      />
    );
  }

  const paso = pasos[idx]!;
  const esUltimo = idx >= pasos.length - 1;

  return (
    <>
      {/* Capa que atrapa clics (evita toques accidentales detrás del tour). */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: marco ? 'transparent' : 'rgba(24, 31, 24, 0.76)' }}
        aria-hidden
      />

      {/* Spotlight: recorte que ilumina el elemento y oscurece el resto. */}
      {marco && (
        <div
          className="pointer-events-none fixed z-[61] rounded-2xl transition-all duration-300"
          style={{
            top: marco.top - 8,
            left: marco.left - 8,
            width: marco.width + 16,
            height: marco.height + 16,
            boxShadow:
              '0 0 0 9999px rgba(24, 31, 24, 0.76), 0 0 0 3px rgba(157, 180, 138, 0.9), 0 12px 34px -8px rgba(0,0,0,0.45)',
          }}
          aria-hidden
        />
      )}

      {/* Diálogo */}
      <DialogoPaso
        paso={paso}
        idx={idx}
        total={pasos.length}
        esUltimo={esUltimo}
        marco={marco}
        pending={pending}
        onAtras={() => setIdx((p) => Math.max(0, p - 1))}
        onSiguiente={() => setIdx((p) => Math.min(pasos.length - 1, p + 1))}
        onCerrar={cerrarRuta}
        onDesactivar={desactivar}
      />
    </>
  );
}

/** Diálogo del paso, colocado junto al elemento resaltado o al centro. */
function DialogoPaso({
  paso,
  idx,
  total,
  esUltimo,
  marco,
  pending,
  onAtras,
  onSiguiente,
  onCerrar,
  onDesactivar,
}: {
  paso: Paso;
  idx: number;
  total: number;
  esUltimo: boolean;
  marco: Marco | null;
  pending: boolean;
  onAtras: () => void;
  onSiguiente: () => void;
  onCerrar: () => void;
  onDesactivar: () => void;
}) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const anchoDialogo = Math.min(360, vw - 24);

  // Posición: centrado si no hay elemento; si lo hay, arriba o abajo según espacio.
  let estilo: React.CSSProperties;
  let flecha: { lado: 'arriba' | 'abajo'; left: number } | null = null;

  if (!marco) {
    estilo = {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: anchoDialogo,
    };
  } else {
    const espacioAbajo = vh - (marco.top + marco.height);
    const abajo = espacioAbajo > 240 || espacioAbajo > marco.top;
    const left = clamp(marco.left + marco.width / 2 - anchoDialogo / 2, 12, vw - anchoDialogo - 12);
    const centroEl = marco.left + marco.width / 2;
    flecha = { lado: abajo ? 'arriba' : 'abajo', left: clamp(centroEl - left, 20, anchoDialogo - 20) };
    estilo = abajo
      ? { top: marco.top + marco.height + 14, left, width: anchoDialogo }
      : { bottom: vh - marco.top + 14, left, width: anchoDialogo };
  }

  return (
    <div
      className="fixed z-[70] rounded-2xl border border-noema-sage/30 bg-white p-4 shadow-2xl"
      style={estilo}
      role="dialog"
      aria-modal="true"
    >
      {/* Flecha que "sale" del elemento */}
      {flecha && (
        <span
          className="absolute size-3 rotate-45 border-noema-sage/30 bg-white"
          style={{
            left: flecha.left - 6,
            ...(flecha.lado === 'arriba'
              ? { top: -6, borderLeftWidth: 1, borderTopWidth: 1 }
              : { bottom: -6, borderRightWidth: 1, borderBottomWidth: 1 }),
          }}
          aria-hidden
        />
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-noema-sage">
          <GraduationCap className="size-3.5" strokeWidth={2} />
          Modo aprendiz
        </span>
        <button
          onClick={onCerrar}
          aria-label="Cerrar guía de esta sección"
          className="rounded p-0.5 text-foreground-muted hover:bg-bone hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>

      <h3 className="mt-1 font-serif text-lg text-ink">{paso.titulo}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ink/80">{paso.texto}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        {/* Puntos de progreso */}
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`size-1.5 rounded-full ${i === idx ? 'bg-noema-sage' : 'bg-noema-deep/15'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {idx > 0 && (
            <button
              onClick={onAtras}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-ink/70 hover:bg-bone"
            >
              <ChevronLeft className="size-4" /> Atrás
            </button>
          )}
          {esUltimo ? (
            <button
              onClick={onCerrar}
              className="rounded-md bg-noema-deep px-3.5 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
            >
              Entendido
            </button>
          ) : (
            <button
              onClick={onSiguiente}
              className="inline-flex items-center gap-1 rounded-md bg-noema-deep px-3.5 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
            >
              Siguiente <ChevronRight className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Apagar el modo aprendiz por completo */}
      <button
        onClick={onDesactivar}
        disabled={pending}
        className="mt-3 flex w-full items-center justify-center gap-1.5 border-t border-noema-deep/10 pt-2.5 text-xs font-medium text-noema-clay hover:text-noema-clay/80 disabled:opacity-60"
      >
        <Power className="size-3.5" strokeWidth={2} />
        Desactivar modo aprendiz
      </button>
    </div>
  );
}

/** Botón flotante siempre visible mientras el modo aprendiz está activo. */
function PildoraAprendiz({
  onAbrir,
  onDesactivar,
  pending,
}: {
  onAbrir?: () => void;
  onDesactivar: () => void;
  pending: boolean;
}) {
  return (
    <div className="fixed bottom-4 left-4 z-[55] flex items-center overflow-hidden rounded-full border border-noema-sage/30 bg-white shadow-lg">
      <button
        type="button"
        onClick={onAbrir}
        disabled={!onAbrir}
        className="flex items-center gap-1.5 py-2 pl-3 pr-2.5 text-xs font-medium text-noema-deep enabled:hover:bg-noema-sage/10 disabled:cursor-default"
        title={onAbrir ? 'Ver la guía de esta sección' : 'Modo aprendiz activo'}
      >
        <GraduationCap className="size-4 text-noema-sage" strokeWidth={1.9} />
        Aprendiz
      </button>
      <button
        type="button"
        onClick={onDesactivar}
        disabled={pending}
        aria-label="Desactivar modo aprendiz"
        title="Desactivar modo aprendiz"
        className="border-l border-noema-deep/10 p-2 text-noema-clay hover:bg-noema-clay/10 disabled:opacity-60"
      >
        <Power className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
