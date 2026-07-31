'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Settings2, ShieldAlert, CalendarCheck, Check, UserMinus } from 'lucide-react';
import { RIESGO, NIVELES_RIESGO, riesgoConfig, type NivelRiesgo } from '@/lib/riesgo';
import {
  setNivelRiesgoAction,
  setSosHabilitadoAction,
  setAgendaHabilitadaAction,
  desvincularPacienteAction,
} from '../../../app/(panel)/pacientes/[id]/config-actions';

export interface ConfigVinculacionProps {
  vinculacionId: string;
  nivelRiesgo: string;
  sosHabilitado: boolean;
  agendaHabilitada: boolean;
  nombrePaciente?: string;
}

export function ConfigVinculacion({
  vinculacionId,
  nivelRiesgo: nivelInicial,
  sosHabilitado: sosInicial,
  agendaHabilitada: agendaInicial,
  nombrePaciente,
}: ConfigVinculacionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nivel, setNivel] = useState<NivelRiesgo>((nivelInicial as NivelRiesgo) ?? 'sin_evaluar');
  const [sos, setSos] = useState(sosInicial);
  const [agenda, setAgenda] = useState(agendaInicial);
  const [pending, startTransition] = useTransition();
  const [confirmandoDesvincular, setConfirmandoDesvincular] = useState(false);
  const [errorDesvincular, setErrorDesvincular] = useState<string | null>(null);

  const desvincular = () => {
    setErrorDesvincular(null);
    startTransition(async () => {
      const r = await desvincularPacienteAction(vinculacionId);
      if (r.ok) {
        setOpen(false);
        router.push('/pacientes');
        router.refresh();
      } else {
        setErrorDesvincular(r.error ?? 'No se pudo desvincular.');
      }
    });
  };

  const cfgActual = riesgoConfig(nivel);

  const cambiarNivel = (n: NivelRiesgo) => {
    setNivel(n);
    startTransition(() => {
      setNivelRiesgoAction(vinculacionId, n);
    });
  };

  const toggleSos = () => {
    const v = !sos;
    setSos(v);
    startTransition(() => {
      setSosHabilitadoAction(vinculacionId, v);
    });
  };

  const toggleAgenda = () => {
    const v = !agenda;
    setAgenda(v);
    startTransition(() => {
      setAgendaHabilitadaAction(vinculacionId, v);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-md border border-noema-deep/15 bg-bone px-3 py-2 text-sm text-ink transition-colors hover:border-noema-deep/30"
      >
        <span className={`size-2.5 rounded-full ${cfgActual.dot}`} />
        <span className="font-medium">Riesgo: {cfgActual.label}</span>
        <Settings2 className="size-4 text-foreground-muted" strokeWidth={1.6} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-noema-deep/10 bg-white p-4 shadow-lg">
            {/* Nivel de riesgo */}
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
                Nivel de riesgo
              </p>
              <div className="space-y-1">
                {NIVELES_RIESGO.slice()
                  .reverse()
                  .map((n) => {
                    const cfg = RIESGO[n];
                    const activo = nivel === n;
                    return (
                      <button
                        key={n}
                        onClick={() => cambiarNivel(n)}
                        disabled={pending}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                          activo ? 'bg-paper' : 'hover:bg-paper/60'
                        }`}
                      >
                        <span className={`size-3 shrink-0 rounded-full ${cfg.dot}`} />
                        <span className="flex-1">
                          <span className="font-medium text-ink">{cfg.label}</span>
                        </span>
                        {activo && <Check className="size-4 text-noema-sage" strokeWidth={2} />}
                      </button>
                    );
                  })}
              </div>
              <p className="mt-2 text-[11px] leading-snug text-foreground-muted">
                {cfgActual.descripcion}
              </p>
            </div>

            <div className="my-3 border-t border-noema-deep/8" />

            {/* Toggle S.O.S. */}
            <ToggleRow
              icon={<ShieldAlert className="size-4" strokeWidth={1.7} />}
              label="Botón S.O.S. del paciente"
              descripcion={
                sos
                  ? 'El paciente puede pedir apoyo de crisis desde la app.'
                  : 'El botón de crisis está oculto para este paciente.'
              }
              on={sos}
              onToggle={toggleSos}
              disabled={pending}
            />

            {/* Toggle agenda */}
            <ToggleRow
              icon={<CalendarCheck className="size-4" strokeWidth={1.7} />}
              label="Permitir que agende citas"
              descripcion={
                agenda
                  ? 'El paciente puede solicitar y agendar sesiones.'
                  : 'Solo tú puedes agendar sesiones con este paciente.'
              }
              on={agenda}
              onToggle={toggleAgenda}
              disabled={pending}
            />

            <div className="my-3 border-t border-noema-deep/8" />

            {/* Desvincular paciente */}
            {!confirmandoDesvincular ? (
              <button
                onClick={() => setConfirmandoDesvincular(true)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-[#B85450] transition-colors hover:bg-[#B85450]/8"
              >
                <UserMinus className="size-4 shrink-0" strokeWidth={1.7} />
                <span className="font-medium">Desvincular paciente</span>
              </button>
            ) : (
              <div className="rounded-lg border border-[#B85450]/30 bg-[#B85450]/[0.05] p-3">
                <p className="text-sm font-medium text-ink">
                  ¿Desvincular a {nombrePaciente ?? 'este paciente'}?
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-foreground-muted">
                  Terminarás la relación en NOEMA y dejarás de ver su información. El paciente
                  quedará sin terapeuta. Podrán volver a vincularse con una nueva invitación.
                </p>
                {errorDesvincular && (
                  <p className="mt-1 text-[11px] text-red-600">{errorDesvincular}</p>
                )}
                <div className="mt-2.5 flex gap-2">
                  <button
                    onClick={desvincular}
                    disabled={pending}
                    className="rounded-md bg-[#B85450] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#A14642] disabled:opacity-50"
                  >
                    {pending ? 'Desvinculando…' : 'Sí, desvincular'}
                  </button>
                  <button
                    onClick={() => {
                      setConfirmandoDesvincular(false);
                      setErrorDesvincular(null);
                    }}
                    disabled={pending}
                    className="rounded-md px-3 py-1.5 text-xs text-foreground-muted hover:text-ink"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  descripcion,
  on,
  onToggle,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  descripcion: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 text-noema-deep/60">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-[11px] leading-snug text-foreground-muted">{descripcion}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={disabled}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? 'bg-noema-sage' : 'bg-noema-deep/20'
        } disabled:opacity-50`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
            on ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
