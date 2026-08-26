import Link from 'next/link';
import { ChevronLeft, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ChatConCentro } from '@/components/centro/ChatConCentro';
import { RefrescarEnVivo } from '@/components/util/RefrescarEnVivo';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Chat del centro' };

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Mexico_City',
  });
}

export default async function ChatCentroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ct } = await supabase
    .from('centro_terapeutas')
    .select('centro_id')
    .eq('terapeuta_id', user.id)
    .in('estado', ['activa', 'por_confirmar'])
    .maybeSingle();

  if (!ct) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-6 text-center">
        <Building2 className="mb-3 size-8 text-foreground-muted" strokeWidth={1.5} />
        <p className="text-foreground-muted">No perteneces a ningún centro terapéutico.</p>
        <Link href="/mensajes" className="mt-4 text-sm text-noema-sage hover:underline">
          Volver a mensajes
        </Link>
      </div>
    );
  }

  const [{ data: centro }, { data: mensajes }] = await Promise.all([
    supabase.from('centros').select('nombre_centro').eq('profile_id', ct.centro_id).maybeSingle(),
    supabase
      .from('centro_mensajes')
      .select('id, cuerpo, de_centro, creado_at')
      .eq('terapeuta_id', user.id)
      .order('creado_at', { ascending: true })
      .limit(300),
  ]);

  const nombre = centro?.nombre_centro ?? 'Tu centro';

  return (
    <div className="flex h-screen flex-col">
      {/* Tiempo real: los mensajes del centro llegan al instante */}
      <RefrescarEnVivo
        tabla="centro_mensajes"
        filtro={`terapeuta_id=eq.${user.id}`}
        canal={`centro-chat-${user.id}`}
      />

      {/* Header (igual que el chat de pacientes) */}
      <div className="flex items-center gap-4 border-b border-noema-deep/[0.06] px-5 py-5 sm:px-8">
        <Link href="/mensajes" className="text-foreground-muted hover:text-ink">
          <ChevronLeft className="size-5" strokeWidth={1.6} />
        </Link>
        <div className="flex size-10 items-center justify-center rounded-full bg-noema-sage/15 text-noema-deep/70">
          <Building2 className="size-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="font-medium text-ink">{nombre}</p>
          <p className="text-xs text-foreground-muted">Administración de tu centro · en tiempo real</p>
        </div>
      </div>

      <ChatConCentro
        centroNombre={nombre}
        fill
        ocultarEncabezado
        mensajes={(mensajes ?? []).map((m) => ({
          id: m.id,
          cuerpo: m.cuerpo,
          deCentro: m.de_centro,
          fecha: fmt(m.creado_at),
        }))}
      />
    </div>
  );
}
