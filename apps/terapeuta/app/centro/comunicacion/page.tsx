import { redirect } from 'next/navigation';
import { MessagesSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { listaTerapeutasCentro } from '../data';
import { Anuncios, Conversaciones } from '@/components/centro/ComunicacionCentro';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Comunicación · Centro' };

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  });
}

interface PageProps {
  searchParams: Promise<{ t?: string }>;
}

export default async function ComunicacionPage({ searchParams }: PageProps) {
  const { t } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const terapeutas = await listaTerapeutasCentro(user.id);
  const seleccionado = t ?? terapeutas[0]?.terapeutaId ?? null;

  const [{ data: anuncios }, { data: mensajes }] = await Promise.all([
    supabase
      .from('centro_anuncios')
      .select('id, titulo, cuerpo, creado_at')
      .eq('centro_id', user.id)
      .order('creado_at', { ascending: false })
      .limit(20),
    seleccionado
      ? supabase
          .from('centro_mensajes')
          .select('id, cuerpo, de_centro, creado_at')
          .eq('centro_id', user.id)
          .eq('terapeuta_id', seleccionado)
          .order('creado_at', { ascending: true })
          .limit(100)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <MessagesSquare className="size-7 text-noema-sage" /> Comunicación
        </h1>
        <p className="text-sm text-foreground-muted">
          Anuncios para todo el equipo y conversaciones privadas con cada terapeuta.
        </p>
      </div>

      <Conversaciones
        terapeutas={terapeutas.map((x) => ({ id: x.terapeutaId, nombre: x.nombre }))}
        mensajes={(mensajes ?? []).map((m: any) => ({
          id: m.id,
          cuerpo: m.cuerpo,
          deCentro: m.de_centro,
          fecha: fmt(m.creado_at),
        }))}
        seleccionado={seleccionado}
      />

      <Anuncios
        inicial={(anuncios ?? []).map((a) => ({
          id: a.id,
          titulo: a.titulo,
          cuerpo: a.cuerpo,
          fecha: fmt(a.creado_at),
        }))}
      />
    </div>
  );
}
