'use client';

import { useState, useTransition } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { asignarPlantillaAction } from './actions';

interface Plantilla {
  id: string;
  titulo: string;
  descripcion: string | null;
  contenido_md: string | null;
  categoria: string;
  duracion_min: number | null;
}

interface Props {
  vinculacionId: string;
  plantillas: Plantilla[];
}

export function AsignarEjercicioDialog({ vinculacionId, plantillas }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Campos editables (se rellenan con la plantilla y el terapeuta los adapta).
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [contenido, setContenido] = useState('');
  // Formato tabla (obligatorio en auto-registros).
  const [esTabla, setEsTabla] = useState(false);
  const [columnas, setColumnas] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const seleccionar = (p: Plantilla) => {
    setSelectedId(p.id);
    setTitulo(p.titulo);
    setDescripcion(p.descripcion ?? '');
    setContenido(p.contenido_md ?? '');
    setError(null);
    // Los auto-registros SIEMPRE se responden en tabla.
    const t = `${p.titulo} ${p.categoria}`.toLowerCase();
    const esAutoRegistro = t.includes('auto-registro') || t.includes('autorregistro') || t.includes('auto registro');
    setEsTabla(esAutoRegistro);
    setColumnas(esAutoRegistro ? ['Situación', 'Emoción', 'Pensamiento'] : ['Columna 1', 'Columna 2']);
  };

  const cerrar = () => {
    setOpen(false);
    setSelectedId(null);
    setTitulo('');
    setDescripcion('');
    setContenido('');
    setEsTabla(false);
    setColumnas([]);
    setError(null);
  };

  const onSubmit = (formData: FormData) => {
    if (!selectedId) {
      setError('Selecciona un ejercicio.');
      return;
    }
    if (!titulo.trim()) {
      setError('El ejercicio necesita un título.');
      return;
    }
    formData.set('plantillaId', selectedId);
    formData.set('titulo', titulo);
    formData.set('descripcion', descripcion);
    formData.set('contenido', contenido);
    if (esTabla) {
      const limpias = columnas.map((c) => c.trim()).filter(Boolean);
      if (limpias.length === 0) {
        setError('La tabla necesita al menos una columna.');
        return;
      }
      formData.set('columnas', JSON.stringify(limpias));
    }
    startTransition(async () => {
      const r = await asignarPlantillaAction(vinculacionId, formData);
      if (!r.ok) {
        setError(r.error ?? 'Algo no funcionó.');
      } else {
        cerrar();
      }
    });
  };

  if (!open) {
    return (
      <Button variant="primary" size="md" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Asignar ejercicio
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-noema-deep/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-ink">Asignar ejercicio</h2>
          <button onClick={cerrar} className="text-foreground-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        <form action={onSubmit} className="space-y-5">
          {/* Selector de plantilla */}
          <div className="space-y-2">
            <label className="caption">Plantilla</label>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-noema-deep/10 rounded-md p-2">
              {plantillas.length === 0 ? (
                <p className="text-sm text-foreground-muted p-4 text-center">
                  No hay plantillas disponibles. Ve a la biblioteca para crear o usar
                  las oficiales NOEMA.
                </p>
              ) : (
                plantillas.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => seleccionar(p)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedId === p.id
                        ? 'bg-noema-sage/15 border border-noema-sage'
                        : 'hover:bg-paper border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm text-ink">{p.titulo}</p>
                      <span className="caption shrink-0">{p.categoria}</span>
                    </div>
                    {p.descripcion && (
                      <p className="text-xs text-foreground-muted mt-1 line-clamp-2">
                        {p.descripcion}
                      </p>
                    )}
                    {p.duracion_min && (
                      <p className="text-xs text-foreground-muted mt-1">
                        {p.duracion_min} min
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Editor: adapta el ejercicio para este paciente en particular */}
          {selectedId && (
            <div className="space-y-4 rounded-md border border-noema-sage/25 bg-noema-sage/[0.04] p-4">
              <p className="caption text-noema-sage">
                Puedes adaptar este ejercicio para este paciente
              </p>
              <Input
                label="Título del ejercicio"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              <Textarea
                label="Descripción"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
              />
              <Textarea
                label="Contenido / indicaciones del ejercicio"
                value={contenido}
                onChange={(e) => setContenido(e.target.value)}
                rows={6}
              />

              {/* Formato tabla: el paciente responde llenando filas */}
              <div className="rounded-md border border-noema-deep/10 bg-white p-3">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={esTabla}
                    onChange={(e) => {
                      setEsTabla(e.target.checked);
                      if (e.target.checked && columnas.length === 0) {
                        setColumnas(['Situación', 'Emoción', 'Pensamiento']);
                      }
                    }}
                    className="mt-0.5 size-4 shrink-0 accent-noema-sage"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">Responder en formato de tabla</span>
                    <span className="block text-xs text-foreground-muted">
                      Define las columnas; el paciente irá llenando filas. Los auto-registros lo usan
                      siempre.
                    </span>
                  </span>
                </label>

                {esTabla && (
                  <div className="mt-3 space-y-2">
                    <p className="caption">Columnas de la tabla</p>
                    {columnas.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-xs text-foreground-muted">{i + 1}.</span>
                        <input
                          value={c}
                          onChange={(e) =>
                            setColumnas((prev) => prev.map((x, k) => (k === i ? e.target.value : x)))
                          }
                          placeholder={`Nombre de la columna ${i + 1}`}
                          className="flex-1 rounded-md border border-noema-deep/15 bg-white px-3 py-1.5 text-sm focus:border-noema-sage focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setColumnas((prev) => prev.filter((_, k) => k !== i))}
                          disabled={columnas.length <= 1}
                          aria-label="Quitar columna"
                          className="shrink-0 text-ink/30 hover:text-red-600 disabled:opacity-30"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setColumnas((prev) => [...prev, `Columna ${prev.length + 1}`])}
                      className="inline-flex items-center gap-1.5 rounded-md border border-noema-deep/15 px-3 py-1.5 text-xs font-medium text-ink hover:border-noema-sage/40"
                    >
                      <Plus className="size-3.5" /> Agregar columna
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <Input
            type="date"
            name="fechaLimite"
            label="Fecha límite (opcional)"
            min={new Date().toISOString().slice(0, 10)}
          />

          <Textarea
            name="mensaje"
            label="Instrucciones o mensaje para el paciente"
            placeholder="Lo que quieres que haga o tenga en cuenta. Le aparecerá como 'Indicaciones de tu terapeuta'."
          />

          {error && <p className="text-sm text-[#B85450]">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="md" onClick={cerrar}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" loading={isPending}>
              Asignar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
