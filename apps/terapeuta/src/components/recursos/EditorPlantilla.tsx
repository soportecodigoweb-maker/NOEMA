'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, Copy, X, FileText } from 'lucide-react';
import { HojaMembretada } from '@/components/ui/HojaMembretada';
import {
  EditorPreguntas,
  aBorradores,
  aCamposGuardados,
  type CampoGuardado,
  type PreguntaBorrador,
} from './EditorPreguntas';
import { EditorMateriales, type Material } from './EditorMateriales';
import { ListaMateriales } from './ListaMateriales';
import {
  actualizarPlantillaAction,
  duplicarPlantillaAction,
} from '../../../app/(panel)/recursos/actions';

export interface EditorPlantillaProps {
  id: string;
  titulo: string;
  descripcion: string | null;
  contenido: string | null;
  campos: CampoGuardado[];
  materiales: Material[];
  etiqueta: string;
  /** true si la plantilla pertenece al terapeuta (puede editarla directo). */
  esMia: boolean;
  esFormatoTerapeuta: boolean;
  /** id del terapeuta en sesión — carpeta donde se suben los archivos. */
  terapeutaId: string;
}

/**
 * Formulario del terapeuta con edición tipo Google Forms.
 * - Si es suyo → botón "Editar" para modificar título, contenido y preguntas.
 * - Si es oficial de NOEMA → "Duplicar para editar" (hace una copia suya).
 */
export function EditorPlantilla({
  id,
  titulo,
  descripcion,
  contenido,
  campos,
  materiales,
  etiqueta,
  esMia,
  esFormatoTerapeuta,
  terapeutaId,
}: EditorPlantillaProps) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [vTitulo, setVTitulo] = useState(titulo);
  const [vDescripcion, setVDescripcion] = useState(descripcion ?? '');
  const [vContenido, setVContenido] = useState(contenido ?? '');
  const [preguntas, setPreguntas] = useState<PreguntaBorrador[]>(() => aBorradores(campos));
  const [vMateriales, setVMateriales] = useState<Material[]>(materiales);

  const cancelar = () => {
    setVTitulo(titulo);
    setVDescripcion(descripcion ?? '');
    setVContenido(contenido ?? '');
    setPreguntas(aBorradores(campos));
    setVMateriales(materiales);
    setError(null);
    setEditando(false);
  };

  const guardar = () => {
    setError(null);
    startTransition(async () => {
      const res = await actualizarPlantillaAction(id, {
        titulo: vTitulo,
        descripcion: vDescripcion,
        contenido: vContenido,
        campos: aCamposGuardados(preguntas),
        materiales: vMateriales,
      });
      if (res.ok) {
        setEditando(false);
        setGuardado(true);
        setTimeout(() => setGuardado(false), 2500);
        router.refresh();
      } else {
        setError(res.error ?? 'No se pudo guardar.');
      }
    });
  };

  const duplicar = () => {
    setError(null);
    startTransition(async () => {
      const res = await duplicarPlantillaAction(id);
      if (res.ok && res.id) router.push(`/recursos/${res.id}`);
      else setError(res.error ?? 'No se pudo duplicar.');
    });
  };

  // ── Modo edición ──────────────────────────────────────────────────────────
  if (editando) {
    return (
      <div className="space-y-4">
        <HojaMembretada titulo="Editando formulario" etiqueta={etiqueta}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-ink/80">Título</label>
              <input
                value={vTitulo}
                onChange={(e) => setVTitulo(e.target.value)}
                className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink/80">Descripción</label>
              <input
                value={vDescripcion}
                onChange={(e) => setVDescripcion(e.target.value)}
                placeholder="Breve descripción"
                className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-ink/80">
                Contenido / instrucciones
              </label>
              <textarea
                value={vContenido}
                onChange={(e) => setVContenido(e.target.value)}
                rows={10}
                className="w-full rounded-md border border-noema-deep/15 bg-bone px-3 py-2 font-sans text-sm leading-relaxed focus:border-noema-sage focus:outline-none"
              />
            </div>

            {!esFormatoTerapeuta && (
              <EditorPreguntas preguntas={preguntas} onChange={setPreguntas} />
            )}

            <EditorMateriales
              materiales={vMateriales}
              onChange={setVMateriales}
              terapeutaId={terapeutaId}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={guardar}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50"
              >
                <Check className="size-4" strokeWidth={2} />
                {pending ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                onClick={cancelar}
                className="inline-flex items-center gap-2 rounded-md border border-noema-deep/15 px-4 py-2.5 text-sm text-ink/70 hover:border-noema-deep/30"
              >
                <X className="size-4" />
                Cancelar
              </button>
            </div>
          </div>
        </HojaMembretada>
      </div>
    );
  }

  // ── Modo vista ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-2">
        {esMia ? (
          <button
            onClick={() => setEditando(true)}
            className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90"
          >
            <Pencil className="size-4" strokeWidth={1.9} />
            Editar formulario
          </button>
        ) : (
          <button
            onClick={duplicar}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50"
          >
            <Copy className="size-4" strokeWidth={1.9} />
            {pending ? 'Duplicando…' : 'Duplicar para editar'}
          </button>
        )}
        {guardado && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Check className="size-4" /> Guardado
          </span>
        )}
        {!esMia && (
          <span className="text-xs text-foreground-muted">
            Los formatos oficiales de NOEMA son de solo lectura. Duplícalo para tener tu
            versión editable.
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <HojaMembretada titulo={titulo} subtitulo={descripcion} etiqueta={etiqueta}>
        {contenido ? (
          <div className="whitespace-pre-wrap font-sans text-[0.95rem] leading-relaxed text-ink/85">
            {contenido}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-noema-deep/15 bg-bone/40 p-8 text-center">
            <FileText className="mx-auto mb-2 size-6 text-foreground-muted" strokeWidth={1.5} />
            <p className="text-sm text-foreground-muted">
              Este formulario aún no tiene contenido.
            </p>
          </div>
        )}

        <ListaMateriales materiales={materiales} />

        {campos.length > 0 && (
          <div className="mt-7 border-t border-noema-deep/8 pt-5">
            <h3 className="caption mb-3">Preguntas que responderá el paciente</h3>
            <ol className="space-y-2">
              {campos.map((c, i) => (
                <li
                  key={c.key ?? i}
                  className="flex items-start gap-3 rounded-lg border border-noema-deep/10 bg-bone/30 px-4 py-2.5 text-sm"
                >
                  <span className="mt-0.5 font-serif text-noema-sage">{i + 1}.</span>
                  <span className="flex-1">
                    <span className="font-medium text-ink">{c.label}</span>
                    {c.required && <span className="ml-1 text-noema-clay">*</span>}
                    <span className="ml-2 text-xs text-foreground-muted">
                      ({tipoLabel(c.type)}
                      {c.options?.length ? `: ${c.options.join(' / ')}` : ''})
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </HojaMembretada>
    </div>
  );
}

function tipoLabel(type: string): string {
  const map: Record<string, string> = {
    text: 'texto',
    scale: 'escala 1–5',
    choice: 'opción',
  };
  return map[type] ?? type;
}
