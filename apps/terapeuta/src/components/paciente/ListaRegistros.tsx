'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Share2, Lock, Check, CheckSquare, Square, X, ListChecks } from 'lucide-react';
import { IconoEmocion } from '@/components/paciente/IconoEmocion';
import { cambiarPrivacidadRegistrosAction } from '../../../app/paciente/actions';

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
}

const ES_COMPARTIDO = (p: string) => p === 'compartido' || p === 'marcado_sesion';

export function ListaRegistros({
  registros,
  emociones,
}: {
  registros: Registro[];
  emociones: Emocion[];
}) {
  const router = useRouter();
  const nombrePorKey = useMemo(() => new Map(emociones.map((e) => [e.key, e])), [emociones]);
  const [items, setItems] = useState(registros);
  const [seleccion, setSeleccion] = useState(false);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [aviso, setAviso] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const privados = items.filter((r) => !ES_COMPARTIDO(r.privacidad));

  const alternar = (id: string) =>
    setMarcados((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const aplicar = (ids: string[], privacidad: 'compartido' | 'privado') => {
    if (ids.length === 0) return;
    // Optimista.
    setItems((prev) => prev.map((r) => (ids.includes(r.id) ? { ...r, privacidad } : r)));
    startTransition(async () => {
      const r = await cambiarPrivacidadRegistrosAction(ids, privacidad);
      if (r.ok) {
        setAviso(
          privacidad === 'compartido'
            ? `${r.cambiados} registro(s) compartido(s) con tu terapeuta.`
            : `${r.cambiados} registro(s) marcado(s) como privado(s).`,
        );
        setTimeout(() => setAviso(null), 3000);
        setMarcados(new Set());
        setSeleccion(false);
        router.refresh();
      } else {
        // Revertir si falló.
        router.refresh();
      }
    });
  };

  const compartirTodosPrivados = () => aplicar(privados.map((r) => r.id), 'compartido');

  if (items.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
        Aún no tienes registros. Crea el primero con el botón de arriba.
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Barra de acciones */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {!seleccion ? (
          <>
            <button
              onClick={() => setSeleccion(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-noema-sage/50"
            >
              <ListChecks className="size-4 text-noema-sage" /> Elegir cuáles compartir
            </button>
            {privados.length > 0 && (
              <button
                onClick={compartirTodosPrivados}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-md bg-noema-deep px-3 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
              >
                <Share2 className="size-4" /> Compartir todos los privados ({privados.length})
              </button>
            )}
          </>
        ) : (
          <>
            <span className="text-sm text-ink/70">{marcados.size} seleccionado(s)</span>
            <button
              onClick={() => aplicar([...marcados], 'compartido')}
              disabled={pending || marcados.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-noema-deep px-3 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-40"
            >
              <Share2 className="size-4" /> Compartir con terapeuta
            </button>
            <button
              onClick={() => aplicar([...marcados], 'privado')}
              disabled={pending || marcados.size === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-ink/15 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-ink/30 disabled:opacity-40"
            >
              <Lock className="size-4" /> Hacer privados
            </button>
            <button
              onClick={() => {
                setSeleccion(false);
                setMarcados(new Set());
              }}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-ink/50 hover:text-ink"
            >
              <X className="size-4" /> Cancelar
            </button>
          </>
        )}
      </div>

      {aviso && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-noema-sage/10 px-3 py-2 text-sm text-noema-sage">
          <Check className="size-4" /> {aviso}
        </p>
      )}

      <ul className="space-y-2">
        {items.map((r) => {
          const emo = nombrePorKey.get(r.emocion_principal_key);
          const compartido = ES_COMPARTIDO(r.privacidad);
          const marcado = marcados.has(r.id);
          return (
            <li
              key={r.id}
              className={`rounded-xl border bg-white p-4 transition-colors ${
                seleccion && marcado ? 'border-noema-sage ring-1 ring-noema-sage/30' : 'border-ink/10'
              }`}
            >
              <div className="flex items-start gap-3">
                {seleccion && (
                  <button
                    onClick={() => alternar(r.id)}
                    aria-label={marcado ? 'Quitar' : 'Seleccionar'}
                    className="mt-0.5 shrink-0 text-noema-sage"
                  >
                    {marcado ? <CheckSquare className="size-5" /> : <Square className="size-5 text-ink/30" />}
                  </button>
                )}
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
                    {/* Indicador de privacidad */}
                    <span
                      className={`ml-auto inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] ${
                        compartido ? 'bg-noema-sage/12 text-noema-sage' : 'bg-ink/5 text-ink/50'
                      }`}
                    >
                      {compartido ? <Share2 className="size-3" /> : <Lock className="size-3" />}
                      {compartido ? 'Compartido' : 'Privado'}
                    </span>
                  </div>
                  {r.situacion_detonante && (
                    <p className="mt-1 text-xs text-ink/50">Detonante: {r.situacion_detonante}</p>
                  )}
                  {r.descripcion && <p className="mt-1 text-sm text-ink/75">{r.descripcion}</p>}
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-ink/40">
                      {new Date(r.fecha).toLocaleDateString('es-MX', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        timeZone: 'America/Mexico_City',
                      })}
                    </p>
                    {/* Acción rápida individual (fuera del modo selección) */}
                    {!seleccion && (
                      <button
                        onClick={() => aplicar([r.id], compartido ? 'privado' : 'compartido')}
                        disabled={pending}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 ${
                          compartido
                            ? 'text-ink/50 hover:bg-ink/[0.04] hover:text-ink/70'
                            : 'bg-noema-sage/10 text-noema-sage hover:bg-noema-sage/20'
                        }`}
                      >
                        {compartido ? (
                          <>
                            <Lock className="size-3" /> Hacer privado
                          </>
                        ) : (
                          <>
                            <Share2 className="size-3" /> Compartir con terapeuta
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
