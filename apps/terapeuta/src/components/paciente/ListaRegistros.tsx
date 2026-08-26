'use client';

import { useMemo } from 'react';
import { MessageCircle } from 'lucide-react';
import { IconoEmocion } from '@/components/paciente/IconoEmocion';

interface Emocion {
  key: string;
  nombre_es: string;
  familia?: string | null;
}
interface Registro {
  id: string;
  fecha: string;
  hora: string | null;
  emocion_principal_key: string;
  emociones_secundarias: string[] | null;
  intensidad: number;
  descripcion: string | null;
  situacion_detonante: string | null;
  privacidad: string;
  retroalimentacion?: string | null;
  retroalimentacion_at?: string | null;
}

export function ListaRegistros({
  registros,
  emociones,
}: {
  registros: Registro[];
  emociones: Emocion[];
}) {
  const nombrePorKey = useMemo(() => new Map(emociones.map((e) => [e.key, e])), [emociones]);

  if (registros.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
        Aún no tienes registros. Crea el primero con el botón de arriba.
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-2">
      {registros.map((r) => {
        const emo = nombrePorKey.get(r.emocion_principal_key);
        return (
          <li key={r.id} className="rounded-xl border border-ink/10 bg-white p-4">
            <div className="flex items-start gap-3">
              <IconoEmocion emocionKey={r.emocion_principal_key} familia={emo?.familia ?? undefined} size={40} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium text-ink">
                    {emo?.nombre_es ?? (r.emocion_principal_key === 'otro' ? 'Otro' : r.emocion_principal_key)}
                  </span>
                  {(r.emociones_secundarias ?? [])
                    .filter((k) => k && k !== r.emocion_principal_key)
                    .map((k) => (
                      <span key={k} className="rounded-full bg-noema-sage/12 px-2 py-0.5 text-[11px] text-noema-deep">
                        {nombrePorKey.get(k)?.nombre_es ?? (k === 'otro' ? 'Otro' : k)}
                      </span>
                    ))}
                  <span className="text-xs text-ink/50">intensidad {r.intensidad}/5</span>
                </div>
                {r.situacion_detonante && (
                  <p className="mt-1 text-xs text-ink/50">Detonante: {r.situacion_detonante}</p>
                )}
                {r.descripcion && <p className="mt-1 text-sm text-ink/75">{r.descripcion}</p>}
                <p className="mt-1 text-[11px] text-ink/40">
                  {new Date(r.fecha).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    timeZone: 'America/Mexico_City',
                  })}
                </p>

                {r.retroalimentacion && (
                  <div className="mt-2 rounded-lg border-l-2 border-noema-sage bg-noema-sage/[0.07] px-3 py-2">
                    <p className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-noema-sage">
                      <MessageCircle className="size-3" /> Mensaje de tu terapeuta
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink/90">{r.retroalimentacion}</p>
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
