'use client';

import { useState, useTransition } from 'react';
import { responderTareaAction } from '../../../app/paciente/actions';

interface Campo {
  key: string;
  label: string;
  type: 'text' | 'scale' | 'choice';
  min?: number;
  max?: number;
  options?: string[];
}

export function ResponderTarea({
  tareaId,
  campos,
}: {
  tareaId: string;
  campos: Campo[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [valores, setValores] = useState<Record<string, string | number>>({});
  const [texto, setTexto] = useState('');
  const [dificultad, setDificultad] = useState(3);
  const [compartir, setCompartir] = useState(true);
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  const setV = (k: string, v: string | number) => setValores((p) => ({ ...p, [k]: v }));

  const enviar = () => {
    startTransition(async () => {
      const res = await responderTareaAction(tareaId, valores, texto, dificultad, compartir);
      if (res.ok) {
        setOk(true);
        setAbierto(false);
      }
    });
  };

  if (ok) return <p className="mt-2 text-sm text-noema-sage">✓ Respuesta enviada. Gracias.</p>;

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="mt-2 rounded-md bg-noema-deep px-3 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
      >
        Responder
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-4 rounded-xl border border-ink/10 bg-paper/40 p-4">
      {campos.map((c) => (
        <div key={c.key}>
          <label className="mb-1 block text-sm font-medium text-ink">{c.label}</label>
          {c.type === 'scale' && (
            <div className="flex gap-1.5">
              {rango(c.min ?? 1, c.max ?? 5).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setV(c.key, n)}
                  className={`size-9 rounded-md border text-sm ${
                    valores[c.key] === n
                      ? 'border-noema-sage bg-noema-sage text-bone'
                      : 'border-ink/15 text-ink/70'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          {c.type === 'choice' && (
            <div className="space-y-1.5">
              {(c.options ?? []).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setV(c.key, op)}
                  className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${
                    valores[c.key] === op
                      ? 'border-noema-sage bg-noema-sage/15'
                      : 'border-ink/15 text-ink/70'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          )}
          {c.type === 'text' && (
            <textarea
              rows={2}
              value={(valores[c.key] as string) ?? ''}
              onChange={(e) => setV(c.key, e.target.value)}
              className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
            />
          )}
        </div>
      ))}

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">¿Cómo te fue?</label>
        <textarea
          rows={2}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Cuenta cómo te sentiste…"
          className="w-full rounded-md border border-ink/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Dificultad (1 fácil · 5 difícil)</label>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setDificultad(n)}
              className={`size-9 rounded-md border text-sm ${
                dificultad === n ? 'border-noema-sage bg-noema-sage text-bone' : 'border-ink/15 text-ink/70'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" checked={compartir} onChange={(e) => setCompartir(e.target.checked)} className="accent-noema-sage" />
        Compartir esta respuesta con mi terapeuta
      </label>

      <div className="flex gap-2">
        <button
          onClick={enviar}
          disabled={pending}
          className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          {pending ? 'Enviando…' : 'Guardar respuesta'}
        </button>
        <button onClick={() => setAbierto(false)} className="text-sm text-foreground-muted">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function rango(min: number, max: number): number[] {
  const paso = max - min > 10 ? Math.round((max - min) / 5) : 1;
  const out: number[] = [];
  for (let v = min; v <= max; v += paso) out.push(v);
  return out;
}
