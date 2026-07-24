'use client';

import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, X } from 'lucide-react';

export type TipoCampo = 'text' | 'scale' | 'choice';

export interface PreguntaBorrador {
  label: string;
  type: TipoCampo;
  /** Opciones (solo type='choice'). Una por entrada. */
  options: string[];
  required: boolean;
}

/** Campo tal como se guarda en `campos_respuesta` (jsonb). */
export interface CampoGuardado {
  key: string;
  label: string;
  type: TipoCampo;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
}

export function nuevaPregunta(): PreguntaBorrador {
  return { label: '', type: 'text', options: ['', ''], required: false };
}

/** Convierte los campos guardados en borradores editables. */
export function aBorradores(campos: CampoGuardado[]): PreguntaBorrador[] {
  return campos.map((c) => ({
    label: c.label ?? '',
    type: (['text', 'scale', 'choice'] as const).includes(c.type) ? c.type : 'text',
    options: Array.isArray(c.options) && c.options.length ? c.options : ['', ''],
    required: c.required === true,
  }));
}

/** Serializa los borradores al formato que espera la BD. */
export function aCamposGuardados(preguntas: PreguntaBorrador[]): CampoGuardado[] {
  return preguntas
    .filter((q) => q.label.trim())
    .map((q, i) => ({
      key: `p${i + 1}`,
      label: q.label.trim(),
      type: q.type,
      required: q.required,
      ...(q.type === 'choice'
        ? { options: q.options.map((o) => o.trim()).filter(Boolean) }
        : {}),
      ...(q.type === 'scale' ? { min: 1, max: 5 } : {}),
    }));
}

/**
 * Constructor de preguntas tipo Google Forms: añadir, reordenar, borrar,
 * elegir tipo (texto / escala / opción múltiple) y marcar obligatoria.
 * Las opciones de "opción múltiple" son un campo por opción (como Google Forms).
 * Se usa tanto al crear un recurso como al editarlo.
 */
export function EditorPreguntas({
  preguntas,
  onChange,
}: {
  preguntas: PreguntaBorrador[];
  onChange: (p: PreguntaBorrador[]) => void;
}) {
  const set = (i: number, patch: Partial<PreguntaBorrador>) =>
    onChange(preguntas.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const quitar = (i: number) => onChange(preguntas.filter((_, idx) => idx !== i));

  const mover = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    const a = preguntas[i];
    const b = preguntas[j];
    if (!a || !b) return;
    const copia = [...preguntas];
    copia[i] = b;
    copia[j] = a;
    onChange(copia);
  };

  // Opciones de una pregunta de opción múltiple
  const setOpcion = (qi: number, oi: number, valor: string) => {
    const q = preguntas[qi];
    if (!q) return;
    const options = q.options.map((o, idx) => (idx === oi ? valor : o));
    set(qi, { options });
  };
  const addOpcion = (qi: number) => {
    const q = preguntas[qi];
    if (!q) return;
    set(qi, { options: [...q.options, ''] });
  };
  const quitarOpcion = (qi: number, oi: number) => {
    const q = preguntas[qi];
    if (!q || q.options.length <= 1) return;
    set(qi, { options: q.options.filter((_, idx) => idx !== oi) });
  };

  // Evita que Enter dentro de un input envíe el formulario del modal.
  const sinSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') e.preventDefault();
  };

  return (
    <div className="rounded-xl border border-noema-deep/10 bg-bone/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Preguntas del formulario</p>
        <button
          type="button"
          onClick={() => onChange([...preguntas, nuevaPregunta()])}
          className="inline-flex items-center gap-1 text-xs font-medium text-noema-sage hover:underline"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Añadir pregunta
        </button>
      </div>

      {preguntas.length === 0 ? (
        <p className="text-xs text-foreground-muted">
          Sin preguntas, el paciente solo verá un espacio libre. Añade preguntas para
          que responda cada una dentro del formulario.
        </p>
      ) : (
        <div className="space-y-2.5">
          {preguntas.map((q, i) => (
            <div key={i} className="rounded-lg border border-noema-deep/10 bg-white p-2.5">
              <div className="flex items-start gap-2">
                <GripVertical className="mt-2 size-4 shrink-0 text-noema-deep/25" />
                <span className="mt-2 font-serif text-sm text-noema-sage">{i + 1}.</span>
                <input
                  value={q.label}
                  onChange={(e) => set(i, { label: e.target.value })}
                  onKeyDown={sinSubmit}
                  placeholder="Escribe la pregunta o indicación"
                  className="mt-1 flex-1 rounded-md border border-noema-deep/15 bg-bone px-2.5 py-1.5 text-sm focus:border-noema-sage focus:outline-none"
                />
                <div className="mt-1 flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => mover(i, -1)}
                    disabled={i === 0}
                    aria-label="Subir"
                    className="text-foreground-muted hover:text-ink disabled:opacity-25"
                  >
                    <ChevronUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(i, 1)}
                    disabled={i === preguntas.length - 1}
                    aria-label="Bajar"
                    className="text-foreground-muted hover:text-ink disabled:opacity-25"
                  >
                    <ChevronDown className="size-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  aria-label="Quitar pregunta"
                  className="mt-1.5 shrink-0 text-foreground-muted hover:text-noema-clay"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {/* Tipo + obligatoria */}
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-10">
                <select
                  value={q.type}
                  onChange={(e) => set(i, { type: e.target.value as TipoCampo })}
                  className="rounded-md border border-noema-deep/15 bg-white px-2 py-1 text-xs text-ink/80 focus:border-noema-sage focus:outline-none"
                >
                  <option value="text">Texto libre</option>
                  <option value="scale">Escala 1–5</option>
                  <option value="choice">Opción múltiple</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs text-ink/70">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => set(i, { required: e.target.checked })}
                    className="accent-noema-sage"
                  />
                  Obligatoria
                </label>
              </div>

              {/* Opciones (una por campo, tipo Google Forms) */}
              {q.type === 'choice' && (
                <div className="mt-2.5 space-y-1.5 pl-10">
                  <p className="text-[11px] uppercase tracking-wider text-foreground-muted">
                    Opciones de respuesta
                  </p>
                  {q.options.map((op, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span className="size-3 shrink-0 rounded-full border-2 border-noema-deep/25" />
                      <input
                        value={op}
                        onChange={(e) => setOpcion(i, oi, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addOpcion(i); // Enter añade otra opción, como Google Forms
                          }
                        }}
                        placeholder={`Opción ${oi + 1}`}
                        className="flex-1 rounded-md border border-noema-deep/15 bg-bone px-2.5 py-1.5 text-sm focus:border-noema-sage focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => quitarOpcion(i, oi)}
                        disabled={q.options.length <= 1}
                        aria-label="Quitar opción"
                        className="shrink-0 text-foreground-muted hover:text-noema-clay disabled:opacity-25"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOpcion(i)}
                    className="inline-flex items-center gap-1 pl-5 text-xs font-medium text-noema-sage hover:underline"
                  >
                    <Plus className="size-3.5" strokeWidth={2} />
                    Añadir opción
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
