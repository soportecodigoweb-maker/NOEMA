'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, X, CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react';
import {
  generarInformeCanalizacionV2Action,
  confirmarCanalizacionAction,
} from '../../../app/(panel)/pacientes/[id]/transfer-actions';
import {
  ensamblarInforme,
  type SeccionesInforme,
  type AnexosCanalizacion,
} from '../../../app/(panel)/pacientes/[id]/transfer-informe';

type Fase = 'form' | 'revision' | 'enviado';

const ANEXOS: { key: keyof AnexosCanalizacion; label: string }[] = [
  { key: 'notas_clinicas', label: 'Notas clínicas' },
  { key: 'registros', label: 'Registros NOEMA' },
  { key: 'graficas', label: 'Gráficas' },
  { key: 'plan_apoyo', label: 'Plan de apoyo' },
  { key: 'objetivos', label: 'Objetivos terapéuticos' },
  { key: 'consentimientos', label: 'Consentimientos' },
];

const input =
  'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

/**
 * Canaliza al paciente con otro terapeuta de NOEMA. Flujo en 3 pasos:
 * (1) cédula destino + motivo → (2) editor del informe de 10 secciones (auto +
 * IA, todo editable) → (3) aprobar y canalizar.
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
  const [sec, setSec] = useState<SeccionesInforme | null>(null);
  const [terapeutaDestino, setTerapeutaDestino] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setFase('form');
    setCedula('');
    setMotivo('');
    setSec(null);
    setTerapeutaDestino(undefined);
    setError(null);
  };

  const set = <K extends keyof SeccionesInforme>(key: K, value: SeccionesInforme[K]) =>
    setSec((p) => (p ? { ...p, [key]: value } : p));
  const setAnexo = (key: keyof AnexosCanalizacion) =>
    setSec((p) => (p ? { ...p, anexos: { ...p.anexos, [key]: !p.anexos[key] } } : p));

  const generar = () => {
    setError(null);
    startTransition(async () => {
      const r = await generarInformeCanalizacionV2Action(vinculacionId, cedula, motivo);
      if (r.ok && r.secciones) {
        setSec(r.secciones);
        setTerapeutaDestino(r.terapeutaDestino);
        setFase('revision');
      } else {
        setError(r.error ?? 'No se pudo generar el informe.');
      }
    });
  };

  const confirmar = () => {
    if (!sec) return;
    setError(null);
    const texto = ensamblarInforme(sec);
    startTransition(async () => {
      const r = await confirmarCanalizacionAction(vinculacionId, cedula, motivo, texto, {
        metricas: true,
        registros: true,
        diario: false,
        tareas: true,
        notas: true,
      });
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
        onClick={() => {
          reset();
          setAbierto(true);
        }}
        className="inline-flex items-center gap-2 rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-noema-deep/30"
      >
        <ArrowRightLeft className="size-4" strokeWidth={1.7} />
        Canalizar
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noema-deep/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            {fase === 'enviado' ? (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-5 text-noema-sage" />
                    <h2 className="font-serif text-xl text-ink">Solicitud enviada</h2>
                  </div>
                  <button onClick={cerrar} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
                    <X className="size-5" />
                  </button>
                </div>
                <p className="text-sm text-foreground-muted">
                  Le enviamos a {nombrePaciente} la solicitud para canalizarlo
                  {terapeutaDestino ? ` con ${terapeutaDestino}` : ''}. La canalización se completará cuando el
                  paciente la <span className="font-medium text-ink">autorice</span> desde su app. Te avisaremos
                  cuando responda.
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
            ) : fase === 'revision' && sec ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-ink">Revisa el informe</h2>
                  <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
                    <X className="size-5" />
                  </button>
                </div>
                <p className="mb-4 text-sm text-foreground-muted">
                  Todo es editable, incluso lo generado por IA. <span className="font-medium text-ink">El
                  paciente aún no ha sido canalizado.</span>
                </p>

                <div className="space-y-5">
                  {/* 1. Datos generales */}
                  <Bloque n="1" titulo="Datos generales">
                    <div className="grid grid-cols-2 gap-2">
                      <Campo label="Nombre" value={sec.nombre} onChange={(v) => set('nombre', v)} />
                      <Campo label="Edad" value={sec.edad} onChange={(v) => set('edad', v)} />
                      <Campo label="Sexo (opcional)" value={sec.sexo} onChange={(v) => set('sexo', v)} />
                      <Campo label="Fecha de nacimiento" value={sec.fecha_nacimiento} onChange={(v) => set('fecha_nacimiento', v)} />
                      <Campo label="Fecha de elaboración" value={sec.fecha_elaboracion} onChange={(v) => set('fecha_elaboracion', v)} />
                      <Campo label="Terapeuta remitente" value={sec.terapeuta_remitente} onChange={(v) => set('terapeuta_remitente', v)} />
                    </div>
                  </Bloque>

                  <Bloque n="2" titulo="Motivo de canalización">
                    <Area value={sec.motivo_canalizacion} onChange={(v) => set('motivo_canalizacion', v)} />
                  </Bloque>

                  <Bloque n="3" titulo="Motivo de consulta inicial">
                    <Area value={sec.motivo_consulta_inicial} onChange={(v) => set('motivo_consulta_inicial', v)} />
                  </Bloque>

                  <Bloque n="4" titulo="Objetivos terapéuticos trabajados">
                    <Area value={sec.objetivos_trabajados} onChange={(v) => set('objetivos_trabajados', v)} />
                  </Bloque>

                  <Bloque n="5" titulo="Resumen del proceso terapéutico" ia>
                    <Area value={sec.resumen_proceso} onChange={(v) => set('resumen_proceso', v)} />
                  </Bloque>

                  <Bloque n="6" titulo="Información registrada en NOEMA">
                    <Area value={sec.info_noema} onChange={(v) => set('info_noema', v)} />
                  </Bloque>

                  <Bloque n="7" titulo="Intervenciones realizadas" nota="Lo llenas tú.">
                    <Area value={sec.intervenciones} onChange={(v) => set('intervenciones', v)} placeholder="Describe las intervenciones realizadas…" />
                  </Bloque>

                  <Bloque n="8" titulo="Observaciones y recomendaciones">
                    <Area value={sec.observaciones} onChange={(v) => set('observaciones', v)} placeholder="Para el siguiente terapeuta…" />
                  </Bloque>

                  <Bloque n="9" titulo="Documentos anexos">
                    <div className="grid grid-cols-2 gap-1.5">
                      {ANEXOS.map((a) => (
                        <label key={a.key} className="flex cursor-pointer items-center gap-2 text-sm text-ink/80">
                          <input
                            type="checkbox"
                            checked={sec.anexos[a.key]}
                            onChange={() => setAnexo(a.key)}
                            className="size-4 accent-noema-sage"
                          />
                          {a.label}
                        </label>
                      ))}
                    </div>
                  </Bloque>

                  <Bloque n="10" titulo="Firma">
                    <div className="grid grid-cols-3 gap-2">
                      <Campo label="Nombre" value={sec.firma_nombre} onChange={(v) => set('firma_nombre', v)} />
                      <Campo label="Cédula" value={sec.firma_cedula} onChange={(v) => set('firma_cedula', v)} />
                      <Campo label="Fecha" value={sec.firma_fecha} onChange={(v) => set('firma_fecha', v)} />
                    </div>
                  </Bloque>
                </div>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                <div className="mt-5 flex items-center justify-between gap-2">
                  <button onClick={() => setFase('form')} className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-ink">
                    <ChevronLeft className="size-4" /> Volver
                  </button>
                  <button
                    onClick={confirmar}
                    disabled={pending}
                    className="rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                  >
                    {pending ? 'Canalizando…' : 'Aprobar y canalizar'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl text-ink">Canalizar paciente</h2>
                  <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
                    <X className="size-5" />
                  </button>
                </div>

                <p className="mb-4 text-sm text-foreground-muted">
                  Enlaza a <span className="font-medium text-ink">{nombrePaciente}</span> con otro terapeuta de
                  NOEMA por su <span className="font-medium">cédula profesional</span>. Se generará un informe de
                  10 secciones que podrás revisar y editar antes de enviarlo.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm text-ink/80">Cédula del terapeuta destino</label>
                    <input value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Ej. 12345678" className={input} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-ink/80">Motivo de canalización</label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      rows={3}
                      placeholder="Ej. cambio de ciudad del paciente, enfoque especializado…"
                      className={input}
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={generar}
                      disabled={pending || !cedula.trim()}
                      className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
                    >
                      <Sparkles className="size-4" />
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

function Bloque({
  n,
  titulo,
  ia,
  nota,
  children,
}: {
  n: string;
  titulo: string;
  ia?: boolean;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-noema-deep/10 bg-bone/20 p-3">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-noema-deep/10 text-[11px]">
          {n}
        </span>
        {titulo}
        {ia && (
          <span className="inline-flex items-center gap-1 rounded bg-noema-sage/10 px-1.5 py-0.5 text-[10px] text-noema-sage">
            <Sparkles className="size-2.5" /> IA
          </span>
        )}
        {nota && <span className="text-[11px] font-normal text-foreground-muted">· {nota}</span>}
      </h3>
      {children}
    </section>
  );
}

function Campo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-0.5 block text-[11px] text-foreground-muted">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={input} />
    </label>
  );
}

function Area({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      placeholder={placeholder}
      className={`${input} leading-relaxed`}
    />
  );
}
