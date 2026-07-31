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

  let documentos: Awaited<ReturnType<typeof cargar>> = [];
  async function cargar(vinculacionId: string) {
    const { data } = await supabase
      .from('consentimientos_informados')
      .select('id, titulo, contenido, enviado_at, firmado_at, firma_nombre')
      .eq('vinculacion_id', vinculacionId)
      .order('enviado_at', { ascending: false });
    return (data ?? []).map((d) => ({
      id: d.id,
      titulo: d.titulo,
      contenido: d.contenido,
      enviado: fmt(d.enviado_at) ?? '',
      firmado: fmt(d.firmado_at),
      firmaNombre: d.firma_nombre,
    }));
  }
  if (vinc) documentos = await cargar(vinc.id);

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

      <DocumentosPaciente documentos={documentos} />
    </div>
  );
}
