'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Send, AlertCircle } from 'lucide-react';
import { responderTareaAction } from '../../../app/paciente/actions';

interface Campo {
  key: string;
  label: string;
  type: 'text' | 'scale' | 'choice';
  min?: number;
  max?: number;
  options?: string[];
  required?: boolean;
}

export interface RespuestaPrevia {
  respuestas: Record<string, string | number> | null;
  texto_libre: string | null;
  dificultad_percibida: number | null;
  creado_at: string;
}

/**
 * Formulario de la tarea tipo Google Forms: el paciente responde cada pregunta
 * ahí mismo, dentro de la hoja membretada, y al enviar la tarea se marca como
 * completada. Si ya la respondió, se muestran sus respuestas en solo lectura.
 */
export function ResponderTarea({
  tareaId,
  campos,
  respuestaPrevia,
}: {
  tareaId: string;
  campos: Campo[];
  respuestaPrevia?: RespuestaPrevia | null;
}) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string | number>>({});
  const [texto, setTexto] = useState('');
  const [dificultad, setDificultad] = useState<number | null>(null);
  const [compartir, setCompartir] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [faltantes, setFaltantes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setV = (k: string, v: string | number) => {
    setValores((p) => ({ ...p, [k]: v }));
    setFaltantes((f) => f.filter((x) => x !== k));
  };

  // ── Ya respondida: mostrar en solo lectura ────────────────────────────────
  if (respuestaPrevia && !enviado) {
    const prev = respuestaPrevia.respuestas ?? {};
    return (
      <div className="mt-6 border-t border-noema-deep/8 pt-5">
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
          <Check className="size-3.5" strokeWidth={2.2} />
          Enviada el{' '}
          {new Date(respuestaPrevia.creado_at).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            timeZone: 'America/Mexico_City',
          })}
        </div>
        <dl className="space-y-3">
          {campos.map((c, i) => (
            <div key={c.key}>
              <dt className="text-sm font-medium text-ink">
                {i + 1}. {c.label}
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-ink/70">
                {String(prev[c.key] ?? '—')}
              </dd>
            </div>
          ))}
          {respuestaPrevia.texto_libre && (
            <div>
              <dt className="text-sm font-medium text-ink">¿Cómo te fue?</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-sm text-ink/70">
                {respuestaPrevia.texto_libre}
              </dd>
            </div>
          )}
          {respuestaPrevia.dificultad_percibida && (
            <div>
              <dt className="text-sm font-medium text-ink">Dificultad</dt>
              <dd className="mt-0.5 text-sm text-ink/70">
                {respuestaPrevia.dificultad_percibida} de 5
              </dd>
            </div>
          )}
        </dl>
      </div>
    );
  }

  // ── Confirmación de envío ─────────────────────────────────────────────────
  if (enviado) {
    return (
      <div className="mt-6 flex flex-col items-center gap-2 border-t border-noema-deep/8 pt-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15">
          <Check className="size-6 text-emerald-600" strokeWidth={2.2} />
        </div>
        <p className="font-serif text-lg text-ink">Tarea enviada</p>
        <p className="text-sm text-foreground-muted">
          Tu terapeuta ya puede verla. Gracias por tomarte el tiempo.
        </p>
      </div>
    );
  }

  const enviar = () => {
    setError(null);

    // Validar obligatorias (incluida la dificultad al final).
    const faltan = campos
      .filter((c) => c.required && !valores[c.key] && valores[c.key] !== 0)
      .map((c) => c.key);
    if (faltan.length > 0) {
      setFaltantes(faltan);
      setError('Faltan preguntas obligatorias por responder.');
      return;
    }

    startTransition(async () => {
      const res = await responderTareaAction(
        tareaId,
        valores,
        texto,
        dificultad ?? 3,
        compartir,
      );
      if (res.ok) {
        setEnviado(true);
        router.refresh();
      } else {
        setError('No se pudo enviar. Intenta de nuevo.');
      }
    });
  };

  // ── Formulario ────────────────────────────────────────────────────────────
  return (
    <div className="mt-6 border-t border-noema-deep/8 pt-5">
      <div className="space-y-5">
        {campos.map((c, i) => {
          const falta = faltantes.includes(c.key);
          return (
            <div
              key={c.key}
              className={`rounded-xl border p-4 transition-colors ${
                falta ? 'border-noema-clay/60 bg-noema-clay/[0.04]' : 'border-noema-deep/10 bg-bone/30'
              }`}
            >
              <label className="mb-2 block text-sm font-medium text-ink">
                <span className="font-serif text-noema-sage">{i + 1}.</span> {c.label}
                {c.required && <span className="ml-1 text-noema-clay">*</span>}
              </label>

              {c.type === 'scale' && (
                <div className="flex flex-wrap gap-1.5">
                  {rango(c.min ?? 1, c.max ?? 5).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setV(c.key, n)}
                      className={`size-10 rounded-md border text-sm transition-colors ${
                        valores[c.key] === n
                          ? 'border-noema-sage bg-noema-sage text-bone'
                          : 'border-noema-deep/15 bg-white text-ink/70 hover:border-noema-sage'
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
                      className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        valores[c.key] === op
                          ? 'border-noema-sage bg-noema-sage/10 text-ink'
                          : 'border-noema-deep/15 bg-white text-ink/70 hover:border-noema-sage'
                      }`}
                    >
                      <span
                        className={`size-4 shrink-0 rounded-full border-2 ${
                          valores[c.key] === op
                            ? 'border-noema-sage bg-noema-sage'
                            : 'border-noema-deep/25'
                        }`}
                      />
                      {op}
                    </button>
                  ))}
                </div>
              )}

              {c.type === 'text' && (
                <textarea
                  rows={3}
                  value={(valores[c.key] as string) ?? ''}
                  onChange={(e) => setV(c.key, e.target.value)}
                  placeholder="Tu respuesta…"
                  className="w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
                />
              )}
            </div>
          );
        })}

        {/* Cierre común a toda tarea */}
        <div className="rounded-xl border border-noema-deep/10 bg-bone/30 p-4">
          <label className="mb-2 block text-sm font-medium text-ink">¿Cómo te fue?</label>
          <textarea
            rows={3}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cuenta cómo te sentiste al hacerla…"
            className="w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-noema-deep/10 bg-bone/30 p-4">
          <label className="mb-2 block text-sm font-medium text-ink">
            ¿Qué tan difícil te pareció hacer esta tarea?
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDificultad(n)}
                className={`size-10 rounded-md border text-sm transition-colors ${
                  dificultad === n
                    ? 'border-noema-sage bg-noema-sage text-bone'
                    : 'border-noema-deep/15 bg-white text-ink/70 hover:border-noema-sage'
                }`}
              >
                {n}
              </button>
            ))}
            <span className="ml-2 text-xs text-foreground-muted">1 fácil · 5 difícil</span>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={compartir}
            onChange={(e) => setCompartir(e.target.checked)}
            className="mt-0.5 accent-noema-sage"
          />
          Compartir esta respuesta con mi terapeuta
        </label>

        {error && (
          <p className="flex items-center gap-1.5 text-sm text-noema-clay">
            <AlertCircle className="size-4" strokeWidth={1.9} />
            {error}
          </p>
        )}

        <button
          onClick={enviar}
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-noema-deep px-4 py-3 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50 sm:w-auto"
        >
          <Send className="size-4" strokeWidth={1.9} />
          {pending ? 'Enviando…' : 'Enviar tarea'}
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
