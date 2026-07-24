'use client';

import { useState, useTransition } from 'react';
import {
  LifeBuoy,
  MessageCircle,
  CalendarDays,
  BookOpen,
  HeartPulse,
  ClipboardList,
  BarChart3,
  Sparkles,
  BellRing,
  Volume2,
  MoonStar,
  Check,
} from 'lucide-react';
import {
  guardarConfigAction,
  aplicarATodosAction,
  type ConfigTerapeuta,
} from '../../../app/(panel)/ajustes/config-actions';
import { reproducirSonido, type SonidoNotificacion } from '@/lib/sonido-notificacion';

interface Fila {
  campo: keyof ConfigTerapeuta;
  icono: React.ReactNode;
  titulo: string;
  detalle: string;
}

const FUNCIONES_PACIENTE: Fila[] = [
  {
    campo: 'sos_habilitado',
    icono: <LifeBuoy className="size-4 text-noema-clay" strokeWidth={1.8} />,
    titulo: 'Botón de pánico (apoyo)',
    detalle: 'El paciente puede pedirte apoyo inmediato y avisarte de una crisis.',
  },
  {
    campo: 'chat_habilitado',
    icono: <MessageCircle className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Chat con el terapeuta',
    detalle: 'Mensajería entre sesiones. Si lo apagas, no verá la sección Mensajes.',
  },
  {
    campo: 'agenda_habilitada',
    icono: <CalendarDays className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Puede agendar citas',
    detalle: 'Permite que el paciente proponga o reserve horarios.',
  },
  {
    campo: 'registros_habilitados',
    icono: <HeartPulse className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Registros emocionales',
    detalle: 'El corazón de NOEMA: registrar cómo se siente entre sesiones.',
  },
  {
    campo: 'diario_habilitado',
    icono: <BookOpen className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Diario personal',
    detalle: 'Espacio de escritura libre. Lo privado nunca te llega.',
  },
  {
    campo: 'tareas_habilitadas',
    icono: <ClipboardList className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Tareas y ejercicios',
    detalle: 'Recibir y responder las tareas que le asignas.',
  },
  {
    campo: 'progreso_habilitado',
    icono: <BarChart3 className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Ver su progreso',
    detalle: 'Métricas de sus propios registros. Datos duros, sin interpretación.',
  },
  {
    campo: 'mensajes_ia_habilitados',
    icono: <Sparkles className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Mensajes de NOEMA (IA)',
    detalle: 'Acompañamiento escrito a partir de sus propios registros.',
  },
  {
    campo: 'notif_paciente',
    icono: <BellRing className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Notificaciones al paciente',
    detalle: 'Avisos de mensajes, tareas y recordatorios dentro de la app.',
  },
];

const MIS_NOTIFICACIONES: Fila[] = [
  {
    campo: 'notif_crisis',
    icono: <LifeBuoy className="size-4 text-noema-clay" strokeWidth={1.8} />,
    titulo: 'Alertas de crisis',
    detalle: 'Cuando un paciente pide apoyo. Recomendado dejarlo encendido.',
  },
  {
    campo: 'notif_mensajes',
    icono: <MessageCircle className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Mensajes nuevos',
    detalle: 'Cuando un paciente te escribe.',
  },
  {
    campo: 'notif_registros',
    icono: <HeartPulse className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Registros compartidos',
    detalle: 'Cuando un paciente comparte contigo un registro emocional.',
  },
  {
    campo: 'notif_tareas',
    icono: <ClipboardList className="size-4 text-noema-sage" strokeWidth={1.8} />,
    titulo: 'Tareas completadas',
    detalle: 'Cuando un paciente termina una tarea que le asignaste.',
  },
];

const SONIDOS: { valor: SonidoNotificacion; etiqueta: string }[] = [
  { valor: 'suave', etiqueta: 'Suave' },
  { valor: 'campana', etiqueta: 'Campana' },
  { valor: 'silencioso', etiqueta: 'Silencioso' },
];

export function PanelConfiguracion({ inicial }: { inicial: ConfigTerapeuta }) {
  const [cfg, setCfg] = useState<ConfigTerapeuta>(inicial);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [aplicado, setAplicado] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cambiar = (campo: keyof ConfigTerapeuta, valor: boolean | string) => {
    setCfg((p) => ({ ...p, [campo]: valor }));
    setGuardado(null);
    startTransition(async () => {
      const r = await guardarConfigAction(campo, valor);
      if (r.ok) {
        setGuardado(campo);
        setTimeout(() => setGuardado(null), 1800);
      } else {
        // Revertimos si el servidor lo rechazó.
        setCfg((p) => ({ ...p, [campo]: inicial[campo] }));
      }
    });
  };

  const aplicarATodos = () => {
    setAplicado(null);
    startTransition(async () => {
      const r = await aplicarATodosAction();
      setAplicado(
        r.ok
          ? `Aplicado a ${r.total} paciente${r.total === 1 ? '' : 's'}.`
          : 'No se pudo aplicar.',
      );
      setTimeout(() => setAplicado(null), 4000);
    });
  };

  return (
    <div className="space-y-4">
      {/* Funciones del paciente */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-6">
        <h2 className="font-serif text-xl text-ink">Funciones del paciente</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Lo que tus pacientes pueden usar. Esto define el valor por defecto de los
          pacientes nuevos; cada paciente puede ajustarse aparte desde su ficha.
        </p>

        <div className="mt-5 divide-y divide-noema-deep/[0.06]">
          {FUNCIONES_PACIENTE.map((f) => (
            <FilaToggle
              key={f.campo}
              fila={f}
              activo={cfg[f.campo] as boolean}
              guardado={guardado === f.campo}
              onToggle={(v) => cambiar(f.campo, v)}
              deshabilitado={pending}
            />
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-noema-deep/[0.06] pt-4">
          <button
            onClick={aplicarATodos}
            disabled={pending}
            className="rounded-md border border-noema-deep/15 px-3.5 py-2 text-sm text-ink/80 hover:border-noema-deep/30 disabled:opacity-50"
          >
            Aplicar a todos mis pacientes actuales
          </button>
          {aplicado && <span className="text-sm text-noema-sage">{aplicado}</span>}
        </div>
      </section>

      {/* Mis notificaciones */}
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-6">
        <h2 className="font-serif text-xl text-ink">Mis notificaciones</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Qué te avisa NOEMA a ti. Lo que apagues se sigue registrando en la campana;
          solo deja de saltar el aviso.
        </p>

        <div className="mt-5 divide-y divide-noema-deep/[0.06]">
          {MIS_NOTIFICACIONES.map((f) => (
            <FilaToggle
              key={f.campo}
              fila={f}
              activo={cfg[f.campo] as boolean}
              guardado={guardado === f.campo}
              onToggle={(v) => cambiar(f.campo, v)}
              deshabilitado={pending}
            />
          ))}
        </div>

        {/* Sonido */}
        <div className="mt-5 border-t border-noema-deep/[0.06] pt-4">
          <div className="flex items-center gap-2">
            <Volume2 className="size-4 text-noema-sage" strokeWidth={1.8} />
            <p className="text-sm font-medium text-ink">Sonido de notificación</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SONIDOS.map((s) => (
              <button
                key={s.valor}
                onClick={() => {
                  cambiar('notif_sonido', s.valor);
                  reproducirSonido(s.valor); // se escucha al elegirlo
                }}
                className={`rounded-md border px-3.5 py-2 text-sm transition-colors ${
                  cfg.notif_sonido === s.valor
                    ? 'border-noema-sage bg-noema-sage/10 text-ink'
                    : 'border-noema-deep/15 text-ink/70 hover:border-noema-sage'
                }`}
              >
                {s.etiqueta}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-foreground-muted">
            Toca una opción para escucharla.
          </p>
        </div>

        {/* No molestar */}
        <div className="mt-5 border-t border-noema-deep/[0.06] pt-4">
          <FilaToggle
            fila={{
              campo: 'no_molestar_activo',
              icono: <MoonStar className="size-4 text-noema-sage" strokeWidth={1.8} />,
              titulo: 'No molestar',
              detalle:
                'En este horario no suena ni salta el aviso. Las alertas de crisis siempre pasan.',
            }}
            activo={cfg.no_molestar_activo}
            guardado={guardado === 'no_molestar_activo'}
            onToggle={(v) => cambiar('no_molestar_activo', v)}
            deshabilitado={pending}
          />
          {cfg.no_molestar_activo && (
            <div className="mt-3 flex flex-wrap items-center gap-3 pl-6">
              <label className="flex items-center gap-2 text-sm text-ink/80">
                Desde
                <input
                  type="time"
                  value={cfg.no_molestar_desde?.slice(0, 5) ?? '21:00'}
                  onChange={(e) => cambiar('no_molestar_desde', e.target.value)}
                  className="rounded-md border border-noema-deep/15 bg-bone px-2.5 py-1.5 text-sm focus:border-noema-sage focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-ink/80">
                hasta
                <input
                  type="time"
                  value={cfg.no_molestar_hasta?.slice(0, 5) ?? '08:00'}
                  onChange={(e) => cambiar('no_molestar_hasta', e.target.value)}
                  className="rounded-md border border-noema-deep/15 bg-bone px-2.5 py-1.5 text-sm focus:border-noema-sage focus:outline-none"
                />
              </label>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilaToggle({
  fila,
  activo,
  guardado,
  onToggle,
  deshabilitado,
}: {
  fila: Fila;
  activo: boolean;
  guardado: boolean;
  onToggle: (v: boolean) => void;
  deshabilitado: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <span className="mt-0.5 shrink-0">{fila.icono}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{fila.titulo}</p>
        <p className="mt-0.5 text-xs text-foreground-muted">{fila.detalle}</p>
      </div>
      {guardado && (
        <Check className="mt-1 size-4 shrink-0 text-emerald-600" strokeWidth={2.2} />
      )}
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={fila.titulo}
        disabled={deshabilitado}
        onClick={() => onToggle(!activo)}
        className={`mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          activo ? 'bg-noema-sage' : 'bg-noema-deep/20'
        }`}
      >
        <span
          className={`block size-5 rounded-full bg-white shadow transition-transform ${
            activo ? '[transform:translateX(1.375rem)]' : '[transform:translateX(0.125rem)]'
          }`}
        />
      </button>
    </div>
  );
}
