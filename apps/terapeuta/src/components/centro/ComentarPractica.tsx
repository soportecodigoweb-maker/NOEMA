'use client';

import { useState, useTransition } from 'react';
import { MessageSquarePlus, Check } from 'lucide-react';
import { comentarPracticaAction } from '../../../app/centro/supervision-actions';

const SECCIONES = [
  'General',
  'Notas clínicas',
  'Sesiones y notas',
  'Registros del paciente',
  'Ejercicios y tareas',
  'Plan de apoyo',
  'Historial clínico',
  'Adherencia al tratamiento',
];

/** Observación del supervisor sobre la práctica clínica del terapeuta.
 *  Puede referirse a un paciente concreto y a una sección específica. */
export function ComentarPractica({
  terapeutaId,
  vinculacionId,
  pacienteNombre,
}: {
  terapeutaId: string;
  vinculacionId?: string;
  pacienteNombre?: string;
}) {
  const [texto, setTexto] = useState('');
  const [seccion, setSeccion] = useState('General');
  const [guardado, setGuardado] = useState(false);
  const [pending, startTransition] = useTransition();

  const guardar = () => {
    if (!texto.trim()) return;
    // Contexto legible: "[Paciente] · Sección".
    const partes = [pacienteNombre, seccion !== 'General' ? seccion : null].filter(Boolean);
    const contexto = partes.join(' · ') || null;
    startTransition(async () => {
      const r = await comentarPracticaAction(terapeutaId, texto, vinculacionId ?? null, contexto);
      if (r.ok) {
        setGuardado(true);
        setTexto('');
        setTimeout(() => setGuardado(false), 3000);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <h2 className="mb-1 flex items-center gap-2 font-serif text-lg text-ink">
        <MessageSquarePlus className="size-5 text-noema-sage" /> Observación de supervisión
      </h2>
      <p className="mb-3 text-sm text-foreground-muted">
        Deja una observación sobre la práctica del terapeuta. Elige a qué se refiere; le llegará como
        aviso indicando exactamente dónde revisar.
      </p>

      <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-foreground-muted">
        ¿Sobre qué sección?
      </label>
      <select
        value={seccion}
        onChange={(e) => setSeccion(e.target.value)}
        className="mb-2 w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm text-ink focus:border-noema-sage focus:outline-none"
      >
        {SECCIONES.map((s) => (
          <option key={s} value={s}>
            {s}
            {s !== 'General' && pacienteNombre ? ` — ${pacienteNombre}` : ''}
          </option>
        ))}
      </select>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={3}
        placeholder="Tu observación o sugerencia para el terapeuta…"
        className="w-full rounded-md border border-noema-deep/15 px-3 py-2 text-sm text-ink focus:border-noema-sage focus:outline-none"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={guardar}
          disabled={pending || !texto.trim()}
          className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
        >
          {pending ? 'Guardando…' : 'Enviar observación'}
        </button>
        {guardado && (
          <span className="inline-flex items-center gap-1 text-sm text-noema-sage">
            <Check className="size-4" /> Enviada al terapeuta
          </span>
        )}
      </div>
    </section>
  );
}
