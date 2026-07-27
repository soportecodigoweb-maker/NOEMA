'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, X, CheckCircle2, ChevronLeft } from 'lucide-react';
import {
  generarInformeCanalizacionAction,
  confirmarCanalizacionAction,
  type IncluirCanalizacion,
} from '../../../app/(panel)/pacientes/[id]/transfer-actions';

const INFO_OPCIONES: { key: keyof IncluirCanalizacion; label: string; desc: string }[] = [
  { key: 'metricas', label: 'Métricas y tendencias', desc: 'Resumen de registros e intensidad' },
  { key: 'registros', label: 'Registros marcados', desc: 'Lo que el paciente marcó para sesión' },
  { key: 'diario', label: 'Diario compartido', desc: 'Extractos de entradas compartidas' },
  { key: 'tareas', label: 'Tareas', desc: 'Asignadas y completadas' },
  { key: 'notas', label: 'Proceso y notas clínicas', desc: 'Objetivos, observaciones y plan' },
];

type Fase = 'form' | 'revision' | 'enviado';

/**
 * Canaliza (enlaza) al paciente con otro terapeuta de NOEMA por su cédula.
 * Flujo en dos pasos: se genera un borrador de informe psicológico (con IA si
 * está disponible), el terapeuta lo revisa y edita, y solo al confirmar se
 * canaliza al paciente y se envía el informe al terapeuta que recibe.
 */
export function TransferirPaciente({
  vinculacionId,
  nombrePaciente,
}: {
  vinculacionId: string;
  nombrePaciente: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [fase, setFase] = useState<Fase>('form');

  const [cedula, setCedula] = useState('');
  const [motivo, setMotivo] = useState('');
  const [incluir, setIncluir] = useState<IncluirCanalizacion>({
    metricas: true,
    registros: true,
    diario: false,
    tareas: true,
    notas: true,
  });

  const [borrador, setBorrador] = useState('');
  const [terapeutaDestino, setTerapeutaDestino] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = (k: keyof IncluirCanalizacion) => setIncluir((p) => ({ ...p, [k]: !p[k] }));

  const reset = () => {
    setFase('form');
    setCedula('');
    setMotivo('');
    setIncluir({ metricas: true, registros: true, diario: false, tareas: true, notas: true });
    setBorrador('');
    setTerapeutaDestino(undefined);
    setError(null);
  };

  const generar = () => {
    setError(null);
    startTransition(async () => {
      const r = await generarInformeCanalizacionAction(vinculacionId, cedula, motivo, incluir);
      if (r.ok) {
        setBorrador(r.borrador ?? '');
        setTerapeutaDestino(r.terapeutaDestino);
        setFase('revision');
      } else {
        setError(r.error ?? 'No se pudo generar el informe.');
      }
    });
  };

  const confirmar = () => {
    setError(null);
    startTransition(async () => {
      const r = await confirmarCanalizacionAction(vinculacionId, cedula, motivo, borrador, incluir);
      if (r.ok) {
        setTerapeutaDestino(r.terapeutaDestino);
        setFase('enviado');
      } else {
        setError(r.error ?? 'No se pudo canalizar.');
      }
    });
  };

  const cerrar = () => {
    const eraEnviado = fase === 'enviado';
    setAbierto(false);
    reset();
    if (eraEnviado) {
      router.push('/pacientes');
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={() => { reset(); setAbierto(true); }}
        className="inline-flex items-center gap-2 rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-noema-deep/30"
      >
        <ArrowRightLeft className="size-4" strokeWidth={1.7} />
        Canalizar
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noema-deep/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            {/* ── PASO 3: Enviado ── */}
            {fase === 'enviado' ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-noema-sage" />
                    <h2 className="font-serif text-xl text-ink">Paciente canalizado</h2>
                  </div>
                  <button onClick={cerrar} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
                    <X className="size-5" />
                  </button>
                </div>
                <p className="text-sm text-foreground-muted">
                  {nombrePaciente} fue canalizado{terapeutaDestino ? ` con ${terapeutaDestino}` : ''}. El informe
                  psicológico quedó en su historial para el terapeuta que lo recibe. Ya no tienes acceso a este
                  paciente.
                </p>
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={cerrar}
                    className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90"
                  >
                    Listo
                  </button>
                </div>
              </div>
            ) : fase === 'revision' ? (
              /* ── PASO 2: Revisión / edición del informe ── */
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-ink">Revisa el informe</h2>
                  <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
                    <X className="size-5" />
                  </button>
                </div>
                <p className="mb-3 text-sm text-foreground-muted">
                  Este es el borrador del informe psicológico para
                  {terapeutaDestino ? ` ${terapeutaDestino}` : ' el terapeuta destino'}. Revísalo y edítalo
                  libremente. <span className="font-medium text-ink">El paciente aún no ha sido canalizado.</span>
                </p>
                <textarea
                  value={borrador}
                  onChange={(e) => setBorrador(e.target.value)}
                  rows={16}
                  className="w-full rounded-xl border border-noema-deep/15 bg-bone/40 p-4 text-sm leading-relaxed text-ink/90 focus:border-noema-sage focus:outline-none"
                />
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setFase('form')}
                    className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-ink"
                  >
                    <ChevronLeft className="size-4" /> Volver
                  </button>
                  <button
                    onClick={confirmar}
                    disabled={pending || !borrador.trim()}
                    className="rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                  >
                    {pending ? 'Canalizando…' : 'Aprobar y canalizar'}
                  </button>
                </div>
              </div>
            ) : (
              /* ── PASO 1: Formulario ── */
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-ink">Canalizar paciente</h2>
                  <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
                    <X className="size-5" />
                  </button>
                </div>

                <p className="mb-4 text-sm text-foreground-muted">
                  Enlaza a <span className="font-medium text-ink">{nombrePaciente}</span> con otro
                  terapeuta de NOEMA por su <span className="font-medium">cédula profesional</span>.
                  Elige qué información alimentará el informe psicológico; podrás revisarlo y editarlo
                  antes de enviarlo.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm text-ink/80">Cédula del terapeuta destino</label>
                    <input
                      value={cedula}
                      onChange={(e) => setCedula(e.target.value)}
                      placeholder="Ej. 12345678"
                      className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-ink/80">¿Qué incluir en el informe?</label>
                    <div className="space-y-1.5">
                      {INFO_OPCIONES.map((o) => (
                        <label
                          key={o.key}
                          className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-noema-deep/10 p-2.5 hover:border-noema-sage/40"
                        >
                          <input
                            type="checkbox"
                            checked={incluir[o.key]}
                            onChange={() => toggle(o.key)}
                            className="mt-0.5 size-4 accent-noema-sage"
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-ink">{o.label}</span>
                            <span className="block text-xs text-foreground-muted">{o.desc}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-ink/80">Motivo (opcional)</label>
                    <input
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ej. cambio de ciudad del paciente"
                      className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                    />
                  </div>

                  {error && <p className="text-sm text-red-600">{error}</p>}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={generar}
                      disabled={pending || !cedula.trim()}
                      className="rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                    >
                      {pending ? 'Generando informe…' : 'Generar informe para revisar'}
                    </button>
                    <button onClick={() => setAbierto(false)} className="px-3 py-2.5 text-sm text-foreground-muted hover:text-ink">
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
