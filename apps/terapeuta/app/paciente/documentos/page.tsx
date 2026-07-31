import { redirect } from 'next/navigation';
import { FileSignature } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { DocumentosPaciente } from './DocumentosPaciente';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Documentos' };

function fmt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  });
}

export default async function DocumentosPacientePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id')
    .eq('paciente_id', user.id)
    .eq('estado', 'activa')
    .maybeSingle();

  let documentos: Array<{
    id: string;
    titulo: string;
    contenido: string;
    enviado: string;
    firmado: string | null;
    firmaNombre: string | null;
  }> = [];
  let informes: Array<{ id: string; titulo: string; contenido: string; compartido: string }> = [];

  if (vinc) {
    const [{ data: docs }, { data: infs }] = await Promise.all([
      supabase
        .from('consentimientos_informados')
        .select('id, titulo, contenido, enviado_at, firmado_at, firma_nombre')
        .eq('vinculacion_id', vinc.id)
        .order('enviado_at', { ascending: false }),
      supabase
        .from('informes_paciente')
        .select('id, titulo, contenido, compartido_at')
        .eq('vinculacion_id', vinc.id)
        .order('compartido_at', { ascending: false }),
    ]);
    documentos = (docs ?? []).map((d) => ({
      id: d.id,
      titulo: d.titulo,
      contenido: d.contenido,
      enviado: fmt(d.enviado_at) ?? '',
      firmado: fmt(d.firmado_at),
      firmaNombre: d.firma_nombre,
    }));
    informes = (infs ?? []).map((d) => ({
      id: d.id,
      titulo: d.titulo,
      contenido: d.contenido,
      compartido: fmt(d.compartido_at) ?? '',
    }));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <header className="mb-8 flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-noema-sage/15">
          <FileSignature className="size-7 text-noema-sage" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className="font-serif text-3xl text-ink">Documentos</h1>
          <p className="mt-1 text-sm text-ink/60">
            Consentimientos y documentos que tu terapeuta te comparte para leer y firmar.
          </p>
        </div>
      </header>

      {informes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">
            Informes de tu terapeuta
          </h2>
          <ul className="space-y-3">
            {informes.map((inf) => (
              <li key={inf.id} className="rounded-2xl border border-ink/10 bg-white p-5">
                <h3 className="font-serif text-lg text-ink">{inf.titulo}</h3>
                <p className="mb-2 text-xs text-ink/50">Compartido el {inf.compartido}</p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">
                  {inf.contenido}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mb-3 text-xs uppercase tracking-wider text-ink/50">Para firmar</h2>
      <DocumentosPaciente documentos={documentos} />
    </div>
  );
}
