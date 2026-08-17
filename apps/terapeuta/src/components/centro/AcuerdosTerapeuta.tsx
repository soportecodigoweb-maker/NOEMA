'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FileSignature, Check, Clock, Trash2 } from 'lucide-react';
import { enviarAcuerdoAction, eliminarAcuerdoAction } from '../../../app/centro/gestion-actions';

interface Acuerdo {
  id: string;
  titulo: string;
  enviado: string;
  firmado: string | null;
  firmaNombre: string | null;
}

const PLANTILLA = `ACUERDO DE COLABORACIÓN PROFESIONAL

Entre el centro terapéutico y el/la profesional, se establecen los siguientes términos de colaboración:

1. Objeto. El profesional prestará servicios de psicoterapia a los pacientes que le sean asignados por el centro.

2. Honorarios. Se acuerda la tarifa y el porcentaje de participación registrados en la sección de finanzas del centro.

3. Confidencialidad. El profesional se obliga a resguardar la información de los pacientes conforme a la LFPDPPP y a la normativa aplicable.

4. Supervisión clínica. El profesional acepta participar en los procesos de supervisión conforme a las autorizaciones que él mismo otorgue en la plataforma.

5. Vigencia. El presente acuerdo permanece vigente mientras dure la colaboración, y puede terminarse por cualquiera de las partes con aviso previo.

Al firmar, el profesional manifiesta su conformidad con estos términos.`;

const input =
  'w-full rounded-md border border-noema-deep/15 bg-white px-3 py-2 text-sm focus:border-noema-sage focus:outline-none';

export function AcuerdosTerapeuta({
  terapeutaId,
  acuerdos,
}: {
  terapeutaId: string;
  acuerdos: Acuerdo[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [titulo, setTitulo] = useState('Acuerdo de colaboración profesional');
  const [contenido, setContenido] = useState(PLANTILLA);
  const [, startTransition] = useTransition();

  const enviar = () => {
    if (!titulo.trim() || !contenido.trim()) return;
    startTransition(async () => {
      await enviarAcuerdoAction(terapeutaId, titulo, contenido);
      setAbierto(false);
      router.refresh();
    });
  };

  const borrar = (id: string) => {
    startTransition(async () => {
      await eliminarAcuerdoAction(id, terapeutaId);
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-serif text-lg text-ink">
          <FileSignature className="size-5 text-noema-sage" /> Acuerdos legales
        </h2>
        {!abierto && (
          <button
            onClick={() => setAbierto(true)}
            className="rounded-md bg-noema-deep px-3 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
          >
            Nuevo acuerdo
          </button>
        )}
      </div>

      {abierto && (
        <div className="mb-4 space-y-2 rounded-xl border border-noema-sage/25 bg-noema-sage/[0.04] p-4">
          <input className={input} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título del acuerdo" />
          <textarea
            className={`${input} min-h-[220px] leading-relaxed`}
            value={contenido}
            onChange={(e) => setContenido(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={enviar}
              className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90"
            >
              Enviar para firma
            </button>
            <button onClick={() => setAbierto(false)} className="px-3 py-2 text-sm text-foreground-muted hover:text-ink">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {acuerdos.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          Sin acuerdos. Puedes enviar uno personalizado para que el terapeuta lo firme.
        </p>
      ) : (
        <ul className="space-y-2">
          {acuerdos.map((a) => (
            <li key={a.id} className="flex items-start gap-3 rounded-xl border border-noema-deep/10 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{a.titulo}</p>
                <p className="text-xs text-foreground-muted">Enviado el {a.enviado}</p>
                {a.firmado ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded bg-noema-sage/10 px-2 py-0.5 text-[11px] text-noema-sage">
                    <Check className="size-3" /> Firmado por {a.firmaNombre} · {a.firmado}
                  </p>
                ) : (
                  <p className="mt-1 inline-flex items-center gap-1 rounded bg-noema-clay/10 px-2 py-0.5 text-[11px] text-noema-clay">
                    <Clock className="size-3" /> Pendiente de firma
                  </p>
                )}
              </div>
              <button onClick={() => borrar(a.id)} aria-label="Eliminar" className="shrink-0 text-ink/30 hover:text-red-600">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
