import { createClient } from '@/lib/supabase/server';
import { Documentos } from './Documentos';
import { InformesPaciente } from './InformesPaciente';
import { PLANTILLA_CONSENTIMIENTO } from './plantilla';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

function fmt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  });
}

export default async function DocumentosPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: docs }, { data: infs }] = await Promise.all([
    supabase
      .from('consentimientos_informados')
      .select('id, titulo, enviado_at, firmado_at, firma_nombre')
      .eq('vinculacion_id', id)
      .order('enviado_at', { ascending: false }),
    supabase
      .from('informes_paciente')
      .select('id, titulo, compartido_at, visto_at')
      .eq('vinculacion_id', id)
      .order('compartido_at', { ascending: false }),
  ]);

  const documentos = (docs ?? []).map((d) => ({
    id: d.id,
    titulo: d.titulo,
    enviado: fmt(d.enviado_at) ?? '',
    firmado: fmt(d.firmado_at),
    firmaNombre: d.firma_nombre,
  }));

  const informes = (infs ?? []).map((d) => ({
    id: d.id,
    titulo: d.titulo,
    compartido: fmt(d.compartido_at) ?? '',
    visto: !!d.visto_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-serif text-2xl text-ink">Documentos</h2>
        <p className="text-sm text-foreground-muted">
          Envía consentimientos informados para que tu paciente los lea y firme desde su app.
        </p>
      </div>
      <Documentos vinculacionId={id} plantilla={PLANTILLA_CONSENTIMIENTO} documentos={documentos} />

      <div className="border-t border-noema-deep/8 pt-6">
        <InformesPaciente vinculacionId={id} informes={informes} />
      </div>
    </div>
  );
}
