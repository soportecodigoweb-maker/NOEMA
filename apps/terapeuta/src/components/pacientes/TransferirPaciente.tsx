'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, X, CheckCircle2, Copy } from 'lucide-react';
import {
  canalizarPacienteAction,
  type IncluirCanalizacion,
} from '../../../app/(panel)/pacientes/[id]/transfer-actions';

const INFO_OPCIONES: { key: keyof IncluirCanalizacion; label: string; desc: string }[] = [
  { key: 'metricas', label: 'Métricas y tendencias', desc: 'Resumen de registros e intensidad' },
  { key: 'registros', label: 'Registros marcados', desc: 'Lo que el paciente marcó para sesión' },
  { key: 'diario', label: 'Diario compartido', desc: 'Extractos de entradas compartidas' },
  { key: 'tareas', label: 'Tareas', desc: 'Asignadas y completadas' },
  { key: 'notas', label: 'Plan clínico', desc: 'Plan de la última nota' },
];

/**
 * Canaliza (enlaza) al paciente con otro terapeuta de NOEMA por su cédula.
 * El terapeuta elige qué información se incluye en un informe (con IA si está
 * disponible) que le llega al terapeuta que recibe. Al canalizar, el paciente
 * pasa a ese terapeuta.
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
  const [cedula, setCedula] = useState('');
  const [motivo, setMotivo] = useState('');
  const [incluir, setIncluir] = useState<IncluirCanalizacion>({
    metricas: true,
    registros: true,
    diario: false,
    tareas: true,
    notas: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ reporte?: string; terapeuta?: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggle = (k: keyof IncluirCanalizacion) =>
    setIncluir((p) => ({ ...p, [k]: !p[k] }));

  const canalizar = () => {
    setError(null);
    startTransition(async () => {
      const r = await canalizarPacienteAction(vinculacionId, cedula, motivo, incluir);
      if (r.ok) {
        setResultado({ reporte: r.reporte, terapeuta: r.terapeutaDestino });
      } else {
        setError(r.error ?? 'No se pudo canalizar.');
      }
    });
  };

  const cerrar = () => {
    setAbierto(false);
    if (resultado) {
      router.push('/pacientes');
      router.refresh();
    }
  };

  const copiar = async () => {
    if (!resultado?.reporte) return;
    try {
      await navigator.clipboard.writeText(resultado.reporte);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-2 rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-noema-deep/30"
      >
        <ArrowRightLeft className="size-4" strokeWidth={1.7} />
        Canalizar
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noema-deep/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            {resultado ? (
              // ── Éxito: informe generado ──
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
                <p className="mb-3 text-sm text-foreground-muted">
                  {nombrePaciente} fue canalizado{resultado.terapeuta ? ` con ${resultado.terapeuta}` : ''}. Este
                  es el informe que le llegó (también quedó en su historial).
                </p>
                <div className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-noema-deep/10 bg-bone p-4 text-sm leading-relaxed text-ink/85">
                  {resultado.reporte}
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={copiar}
                    className="inline-flex items-center gap-2 rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm text-ink hover:border-noema-deep/30"
                  >
                    <Copy className="size-4" /> {copiado ? 'Copiado' : 'Copiar informe'}
                  </button>
                  <button
                    onClick={cerrar}
                    className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90"
                  >
                    Listo
                  </button>
                </div>
              </div>
            ) : (
              // ── Formulario ──
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
                  Elige qué información incluir en el informe que recibirá. Al canalizar, tú dejarás
                  de tener acceso.
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
                      onClick={canalizar}
                      disabled={pending || !cedula.trim()}
                      className="rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                    >
                      {pending ? 'Generando informe…' : 'Canalizar y generar informe'}
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
