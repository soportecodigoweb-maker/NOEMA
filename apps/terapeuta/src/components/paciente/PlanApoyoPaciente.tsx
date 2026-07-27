'use client';

import { useState, useTransition } from 'react';
import {
  Phone,
  ShieldCheck,
  Sparkles,
  Check,
  Pencil,
  HeartHandshake,
  BellRing,
} from 'lucide-react';
import {
  guardarContactoEmergenciaAction,
  guardarPlanSeguridadPacienteAction,
  guardarNotificarUsoAction,
  registrarUsoPlanApoyoAction,
} from '../../../app/paciente/crisis/plan-actions';

interface Recurso {
  id: string;
  tipo: string;
  titulo: string;
  url: string | null;
  nota: string | null;
}

interface Props {
  contacto: { nombre: string | null; relacion: string | null; telefono: string | null };
  planSeguridad: string;
  notificarUso: boolean;
  recursos: Recurso[];
}

const ICONO_TIPO: Record<string, string> = {
  respiracion: '🫁',
  audio: '🎧',
  video: '🎬',
  documento: '📄',
  imagen: '🖼️',
  recordatorio: '⏰',
  enlace: '🔗',
  otro: '•',
};

export function PlanApoyoPaciente({ contacto, planSeguridad, notificarUso, recursos }: Props) {
  const [, startTransition] = useTransition();

  // Contacto de emergencia
  const [editandoContacto, setEditandoContacto] = useState(false);
  const [c, setC] = useState(contacto);

  // Plan de seguridad
  const [editandoPlan, setEditandoPlan] = useState(false);
  const [plan, setPlan] = useState(planSeguridad);
  const [planGuardado, setPlanGuardado] = useState(false);

  // Preferencia + uso
  const [notif, setNotif] = useState(notificarUso);
  const [usado, setUsado] = useState(false);

  const guardarContacto = () => {
    setEditandoContacto(false);
    startTransition(() => {
      guardarContactoEmergenciaAction(c.nombre ?? '', c.relacion ?? '', c.telefono ?? '');
    });
  };

  const guardarPlan = () => {
    setEditandoPlan(false);
    startTransition(async () => {
      await guardarPlanSeguridadPacienteAction(plan);
      setPlanGuardado(true);
      setTimeout(() => setPlanGuardado(false), 2500);
    });
  };

  const cambiarNotif = (v: boolean) => {
    setNotif(v);
    startTransition(() => {
      guardarNotificarUsoAction(v);
    });
  };

  const registrarUso = () => {
    setUsado(true);
    startTransition(() => {
      registrarUsoPlanApoyoAction();
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Contacto de emergencia de confianza ── */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-ink/50">
          <HeartHandshake className="size-4 text-noema-sage" /> Contacto de emergencia de confianza
        </h2>
        {!editandoContacto ? (
          <div className="rounded-2xl border border-ink/10 bg-white p-5">
            {c.nombre || c.telefono ? (
              <div className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg text-ink">{c.nombre || 'Sin nombre'}</p>
                  {c.relacion && <p className="text-xs text-ink/60">{c.relacion}</p>}
                  {c.telefono && <p className="mt-0.5 font-mono text-sm text-ink/70">{c.telefono}</p>}
                </div>
                {c.telefono && (
                  <a
                    href={`tel:${c.telefono.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-noema-clay px-3 py-2 text-sm font-medium text-white hover:bg-noema-clay/90"
                  >
                    <Phone className="size-4" /> Llamar
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-ink/50">Aún no has agregado un contacto de confianza.</p>
            )}
            <button
              onClick={() => setEditandoContacto(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-noema-sage hover:underline"
            >
              <Pencil className="size-3.5" /> {c.nombre ? 'Editar' : 'Agregar contacto'}
            </button>
          </div>
        ) : (
          <div className="space-y-2 rounded-2xl border border-ink/10 bg-white p-5">
            <input
              value={c.nombre ?? ''}
              onChange={(e) => setC({ ...c, nombre: e.target.value })}
              placeholder="Nombre"
              className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
            />
            <input
              value={c.relacion ?? ''}
              onChange={(e) => setC({ ...c, relacion: e.target.value })}
              placeholder="Relación (ej. hermana, amigo)"
              className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
            />
            <input
              type="tel"
              value={c.telefono ?? ''}
              onChange={(e) => setC({ ...c, telefono: e.target.value })}
              placeholder="Teléfono"
              className="w-full rounded-md border border-ink/15 px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              <button onClick={guardarContacto} className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90">
                Guardar
              </button>
              <button onClick={() => { setC(contacto); setEditandoContacto(false); }} className="px-3 py-2 text-sm text-ink/60 hover:text-ink">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Plan de seguridad ── */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-ink/50">
          <ShieldCheck className="size-4 text-noema-sage" /> Mi plan de seguridad
        </h2>
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          {!editandoPlan ? (
            <>
              {plan.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{plan}</p>
              ) : (
                <p className="text-sm text-ink/50">
                  Tu terapeuta puede escribir aquí tu plan de seguridad. Tú también puedes editarlo.
                </p>
              )}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => setEditandoPlan(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-noema-sage hover:underline"
                >
                  <Pencil className="size-3.5" /> Editar mi plan
                </button>
                {planGuardado && (
                  <span className="inline-flex items-center gap-1 text-xs text-noema-sage">
                    <Check className="size-3" /> Guardado · tu terapeuta fue avisado
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={6}
                placeholder="Estrategias, recordatorios, pasos a seguir, señales de alarma…"
                className="w-full rounded-lg border border-ink/15 bg-bone/20 px-3 py-2 text-sm leading-relaxed focus:border-noema-sage focus:outline-none"
              />
              <p className="text-xs text-ink/45">Al guardar, tu terapeuta recibirá un aviso de que lo editaste.</p>
              <div className="flex gap-2">
                <button onClick={guardarPlan} className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90">
                  Guardar cambios
                </button>
                <button onClick={() => { setPlan(planSeguridad); setEditandoPlan(false); }} className="px-3 py-2 text-sm text-ink/60 hover:text-ink">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Recursos del terapeuta ── */}
      {recursos.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-ink/50">
            <Sparkles className="size-4 text-noema-sage" /> Recursos para ti
          </h2>
          <ul className="space-y-2">
            {recursos.map((r) => {
              const contenido = (
                <div className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white p-4">
                  <span className="text-lg leading-none">{ICONO_TIPO[r.tipo] ?? '•'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{r.titulo}</p>
                    {r.nota && <p className="mt-0.5 text-xs text-ink/60">{r.nota}</p>}
                    {r.url && <p className="mt-0.5 truncate text-xs text-noema-sage">{r.url}</p>}
                  </div>
                </div>
              );
              return (
                <li key={r.id}>
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer" className="block transition-opacity hover:opacity-80">
                      {contenido}
                    </a>
                  ) : (
                    contenido
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ── Usar el plan + preferencia de aviso ── */}
      <section className="rounded-2xl bg-noema-sage/[0.07] p-5">
        <label className="flex items-start gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={notif}
            onChange={(e) => cambiarNotif(e.target.checked)}
            className="mt-0.5 size-4 accent-noema-sage"
          />
          Notificar a mi terapeuta que utilicé mi Plan de apoyo.
        </label>
        <button
          onClick={registrarUso}
          disabled={usado}
          className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors ${
            usado ? 'bg-noema-sage/15 text-noema-sage' : 'bg-noema-deep text-bone hover:bg-noema-deep/90'
          }`}
        >
          {usado ? (
            <>
              <Check className="size-5" /> Registrado{notif ? ' · tu terapeuta fue avisado' : ''}
            </>
          ) : (
            <>
              <BellRing className="size-5" /> Usé mi Plan de apoyo
            </>
          )}
        </button>
      </section>
    </div>
  );
}
