'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, MessageCircle, BellRing, Check } from 'lucide-react';
import { avisarTerapeutaSOSAction, type CanalSOS } from '../../../app/paciente/crisis/actions';

export interface ContactoCrisisProps {
  terapeutaNombre: string;
  telefonoTerapeuta: string | null;
  /** El paciente autorizó que su terapeuta reciba alertas de crisis. */
  sosHabilitado: boolean;
}

/**
 * Opciones de contacto de crisis (#4/#10). Además de abrir el canal elegido
 * (mensaje / llamada / videollamada), registra una alerta que le llega al
 * terapeuta al instante vía Realtime.
 */
export function ContactoCrisis({
  terapeutaNombre,
  telefonoTerapeuta,
  sosHabilitado,
}: ContactoCrisisProps) {
  const router = useRouter();
  const [avisado, setAvisado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const avisar = (canal: CanalSOS, despues?: () => void) => {
    setError(null);
    startTransition(async () => {
      const r = await avisarTerapeutaSOSAction(canal);
      if (!r.ok) setError(r.error ?? 'No se pudo avisar.');
      else setAvisado(true);
      despues?.();
    });
  };

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">
        Contactar a {terapeutaNombre}
      </h2>

      {/* Aviso inmediato al terapeuta */}
      <button
        type="button"
        onClick={() => avisar('mensaje')}
        disabled={pending || avisado}
        className={`mb-3 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-medium transition-colors ${
          avisado
            ? 'bg-noema-sage/15 text-noema-sage'
            : 'bg-noema-clay text-white hover:bg-noema-clay/90'
        } disabled:opacity-70`}
      >
        {avisado ? (
          <>
            <Check className="size-5" strokeWidth={2} />
            {sosHabilitado
              ? `${terapeutaNombre} ya recibió tu aviso`
              : 'Aviso registrado'}
          </>
        ) : (
          <>
            <BellRing className="size-5" strokeWidth={1.9} />
            Avisar a mi terapeuta ahora
          </>
        )}
      </button>

      {!sosHabilitado && (
        <p className="mb-3 text-xs text-ink/50">
          Tu aviso queda registrado, pero no tienes activado el envío de alertas a tu
          terapeuta. Puedes activarlo con {terapeutaNombre}.
        </p>
      )}
      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => avisar('mensaje', () => router.push('/paciente/mensajes'))}
          className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-white p-5 text-center transition-colors hover:border-noema-sage"
        >
          <div className="flex size-11 items-center justify-center rounded-full bg-noema-sage/15">
            <MessageCircle className="size-5 text-noema-sage" strokeWidth={1.7} />
          </div>
          <span className="font-medium text-ink">Enviar mensaje</span>
          <span className="text-xs text-ink/50">Escríbele ahora</span>
        </button>

        {telefonoTerapeuta ? (
          <a
            href={`tel:${telefonoTerapeuta.replace(/\s/g, '')}`}
            onClick={() => avisar('llamada')}
            className="flex flex-col items-center gap-2 rounded-2xl border border-ink/10 bg-white p-5 text-center transition-colors hover:border-noema-clay"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-noema-clay/15">
              <Phone className="size-5 text-noema-clay" strokeWidth={1.7} />
            </div>
            <span className="font-medium text-ink">Llamar</span>
            <span className="text-xs text-ink/50">{telefonoTerapeuta}</span>
          </a>
        ) : (
          <OpcionDeshabilitada
            icon={<Phone className="size-5" strokeWidth={1.7} />}
            label="Llamar"
            nota="No configurado"
          />
        )}
      </div>

      <p className="mt-3 text-xs text-ink/50">
        Si es una emergencia, usa también las líneas de abajo — la respuesta de tu
        terapeuta puede no ser inmediata.
      </p>
    </section>
  );
}

function OpcionDeshabilitada({
  icon,
  label,
  nota,
}: {
  icon: React.ReactNode;
  label: string;
  nota: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink/10 bg-ink/[0.02] p-5 text-center opacity-60">
      <div className="flex size-11 items-center justify-center rounded-full bg-ink/5 text-ink/40">
        {icon}
      </div>
      <span className="font-medium text-ink/50">{label}</span>
      <span className="text-xs text-ink/40">{nota}</span>
    </div>
  );
}
