import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import {
  AVISO_PRIVACIDAD_PACIENTE,
  VERSION_AVISO_PACIENTE,
} from '@/lib/aviso-privacidad-paciente';
import { AVISO_HERRAMIENTA_APOYO } from '@/lib/aviso-comun';
import { AceptarAvisoPacienteForm } from './AceptarAvisoPacienteForm';

export const metadata = { title: 'Aviso de privacidad' };
export const dynamic = 'force-dynamic';

export default async function AvisoPrivacidadPacientePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-noema-sage/15">
          <ShieldCheck className="size-5 text-noema-sage" strokeWidth={1.7} />
        </div>
        <div>
          <h1 className="font-serif text-2xl text-ink">Tu información es tuya</h1>
          <p className="text-sm text-ink/60">
            Antes de empezar, queremos que tengas clara tu privacidad.
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-noema-sage/30 bg-noema-sage/[0.07] p-5">
        {AVISO_HERRAMIENTA_APOYO.map((linea, i) => (
          <p
            key={i}
            className={i === 0 ? 'font-medium text-ink' : 'text-sm text-ink/75'}
          >
            {linea}
          </p>
        ))}
      </div>

      <div className="max-h-[55vh] space-y-4 overflow-y-auto rounded-xl border border-ink/10 bg-white p-6">
        {AVISO_PRIVACIDAD_PACIENTE.map((s) => (
          <section key={s.titulo}>
            <h2 className="mb-1 font-medium text-ink">{s.titulo}</h2>
            <p className="text-sm leading-relaxed text-ink/75">{s.cuerpo}</p>
          </section>
        ))}
        <p className="border-t border-ink/8 pt-3 text-xs text-ink/50">
          Versión {VERSION_AVISO_PACIENTE}.
        </p>
      </div>

      <AceptarAvisoPacienteForm />
    </div>
  );
}
