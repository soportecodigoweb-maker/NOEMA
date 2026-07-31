'use client';

import { useState, useTransition } from 'react';
import { Sparkles, Share2, Trash2, Check, FileText } from 'lucide-react';
import {
  generarInformePacienteAction,
  compartirInformePacienteAction,
  eliminarInformePacienteAction,
  type IncluirInforme,
} from './informe-actions';

interface Informe {
  id: string;
  titulo: string;
  compartido: string;
  visto: boolean;
}

interface Props {
  vinculacionId: string;
  informes: Informe[];
}

const input =
  'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

export function InformesPaciente({ vinculacionId, informes: inicial }: Props) {
  const [informes, setInformes] = useState<Informe[]>(inicial);
  const [titulo, setTitulo] = useState('Tu proceso en NOEMA');
  const [contenido, setContenido] = useState('');
  const [incluir, setIncluir] = useState<IncluirInforme>({ tendencias: true, tareas: true });
  const [generando, setGenerando] = useState(false);
  const [compartido, setCompartido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const generar = () => {
    setError(null);
    setGenerando(true);
    startTransition(async () => {
      const r = await generarInformePacienteAction(vinculacionId, incluir);
      setGenerando(false);
      if (r.ok) setContenido(r.borrador ?? '');
      else setError(r.error ?? 'No se pudo generar.');
    });
  };

  const compartir = () => {
    setError(null);
    startTransition(async () => {
      const r = await compartirInformePacienteAction(vinculacionId, titulo, contenido);
      if (r.ok) {
        setCompartido(true);
        setContenido('');
        setTimeout(() => setCompartido(false), 3000);
      } else {
        setError(r.error ?? 'No se pudo compartir.');
      }
    });
  };

  const borrar = (id: string) => {
    setInformes((p) => p.filter((x) => x.id !== id));
    startTransition(() => {
      eliminarInformePacienteAction(id, vinculacionId);
    });
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
        <h3 className="mb-1 flex items-center gap-2 font-serif text-lg text-ink">
          <FileText className="size-5 text-noema-sage" /> Compartir un informe con el paciente
        </h3>
        <p className="mb-3 text-sm text-foreground-muted">
          Genera un resumen con IA de su proceso, edítalo a tu gusto y compártelo. Sin
          diagnósticos; tú tienes el control del texto final.
        </p>

        <input
          className={`${input} mb-3`}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título del informe"
        />

        <div className="mb-3 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={incluir.tendencias}
              onChange={() => setIncluir((p) => ({ ...p, tendencias: !p.tendencias }))}
              className="size-4 accent-noema-sage"
            />
            Tendencias emocionales
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={incluir.tareas}
              onChange={() => setIncluir((p) => ({ ...p, tareas: !p.tareas }))}
              className="size-4 accent-noema-sage"
            />
            Tareas
          </label>
          <button
            onClick={generar}
            disabled={generando}
            className="inline-flex items-center gap-1.5 rounded-md bg-noema-sage px-3 py-1.5 text-sm font-medium text-bone hover:bg-noema-sage/90 disabled:opacity-40"
          >
            <Sparkles className="size-4" /> {generando ? 'Generando…' : 'Generar con IA'}
          </button>
        </div>

        <textarea
          className={`${input} min-h-[200px] leading-relaxed`}
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribe aquí, o genera un borrador con IA y edítalo. Este texto es lo que verá tu paciente."
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={compartir}
            disabled={!titulo.trim() || !contenido.trim()}
            className="inline-flex items-center gap-2 rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
          >
            <Share2 className="size-4" /> Compartir con el paciente
          </button>
          {compartido && (
            <span className="inline-flex items-center gap-1 text-sm text-noema-sage">
              <Check className="size-4" /> Compartido
            </span>
          )}
        </div>
      </section>

      {informes.length > 0 && (
        <section>
          <h3 className="mb-3 font-serif text-lg text-ink">Informes compartidos</h3>
          <ul className="space-y-2">
            {informes.map((inf) => (
              <li
                key={inf.id}
                className="flex items-start gap-3 rounded-xl border border-noema-deep/10 bg-white px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{inf.titulo}</p>
                  <p className="text-xs text-foreground-muted">Compartido el {inf.compartido}</p>
                </div>
                <button
                  onClick={() => borrar(inf.id)}
                  aria-label="Eliminar"
                  className="shrink-0 text-ink/30 hover:text-red-600"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
