'use client';

import { useState, useTransition } from 'react';
import { FileText, Check, Pencil } from 'lucide-react';
import { guardarExpedienteInicialAction } from '../../../app/(panel)/pacientes/[id]/historial/actions';

export interface ExpedienteInicial {
  motivo_consulta: string | null;
  padecimiento_actual: string | null;
  antecedentes_familiares: string | null;
  antecedentes_personales: string | null;
  examen_mental: string | null;
  impresion_diagnostica: string | null;
  plan_terapeutico: string | null;
  pronostico: string | null;
  fecha_elaboracion?: string | null;
}

const CAMPOS: { key: keyof ExpedienteInicial; label: string; hint: string }[] = [
  { key: 'motivo_consulta', label: 'Motivo de consulta', hint: 'Lo que trae al paciente, en sus palabras.' },
  { key: 'padecimiento_actual', label: 'Padecimiento actual', hint: 'Evolución del malestar: inicio, curso, factores.' },
  { key: 'antecedentes_familiares', label: 'Antecedentes heredofamiliares', hint: 'Antecedentes de salud mental en la familia.' },
  { key: 'antecedentes_personales', label: 'Antecedentes personales', hint: 'Patológicos y no patológicos relevantes.' },
  { key: 'examen_mental', label: 'Examen mental / observaciones', hint: 'Apariencia, afecto, pensamiento, cognición.' },
  { key: 'impresion_diagnostica', label: 'Impresión diagnóstica', hint: 'Impresión clínica inicial.' },
  { key: 'plan_terapeutico', label: 'Plan terapéutico', hint: 'Objetivos, enfoque, frecuencia.' },
  { key: 'pronostico', label: 'Pronóstico', hint: 'Pronóstico inicial.' },
];

export function NotaInicialNOM004({
  vinculacionId,
  inicial,
}: {
  vinculacionId: string;
  inicial: ExpedienteInicial | null;
}) {
  const yaExiste = inicial != null;
  const [editando, setEditando] = useState(!yaExiste);
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
    for (const c of CAMPOS) v[c.key] = (inicial?.[c.key] as string) ?? '';
    return v;
  });
  const [guardado, setGuardado] = useState(false);
  const [pending, startTransition] = useTransition();

  const setV = (k: string, val: string) => setValores((p) => ({ ...p, [k]: val }));

  const guardar = () => {
    startTransition(async () => {
      const res = await guardarExpedienteInicialAction(vinculacionId, {
        motivo_consulta: valores.motivo_consulta ?? '',
        padecimiento_actual: valores.padecimiento_actual ?? '',
        antecedentes_familiares: valores.antecedentes_familiares ?? '',
        antecedentes_personales: valores.antecedentes_personales ?? '',
        examen_mental: valores.examen_mental ?? '',
        impresion_diagnostica: valores.impresion_diagnostica ?? '',
        plan_terapeutico: valores.plan_terapeutico ?? '',
        pronostico: valores.pronostico ?? '',
      });
      if (res.ok) {
        setGuardado(true);
        setEditando(false);
        setTimeout(() => setGuardado(false), 2500);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-noema-deep/10 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-noema-sage" strokeWidth={1.7} />
          <h3 className="font-serif text-xl text-ink">Nota clínica inicial (NOM-004)</h3>
        </div>
        {!editando && (
          <button
            onClick={() => setEditando(true)}
            className="inline-flex items-center gap-1.5 text-sm text-noema-sage hover:underline"
          >
            <Pencil className="size-3.5" strokeWidth={1.8} />
            Editar
          </button>
        )}
        {guardado && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Check className="size-4" /> Guardado
          </span>
        )}
      </div>

      {editando ? (
        <div className="space-y-4">
          {CAMPOS.map((c) => (
            <div key={c.key}>
              <label className="mb-1 block text-sm font-medium text-ink">{c.label}</label>
              <textarea
                rows={2}
                value={valores[c.key] ?? ''}
                onChange={(e) => setV(c.key, e.target.value)}
                placeholder={c.hint}
                className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={guardar}
              disabled={pending}
              className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50"
            >
              {pending ? 'Guardando…' : 'Guardar nota inicial'}
            </button>
            {yaExiste && (
              <button onClick={() => setEditando(false)} className="text-sm text-foreground-muted">
                Cancelar
              </button>
            )}
          </div>
        </div>
      ) : (
        <dl className="space-y-3">
          {CAMPOS.map((c) => {
            const val = valores[c.key];
            if (!val) return null;
            return (
              <div key={c.key}>
                <dt className="text-[11px] uppercase tracking-wider text-foreground-muted">{c.label}</dt>
                <dd className="whitespace-pre-wrap text-sm text-ink/85">{val}</dd>
              </div>
            );
          })}
          {inicial?.fecha_elaboracion && (
            <p className="border-t border-noema-deep/8 pt-2 text-xs text-foreground-muted">
              Elaborada el {new Date(inicial.fecha_elaboracion).toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })}
            </p>
          )}
        </dl>
      )}
    </div>
  );
}
