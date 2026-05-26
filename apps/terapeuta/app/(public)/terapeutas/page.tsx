import Link from 'next/link';
import { Search, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';

export const metadata = {
  title: 'Directorio de terapeutas · NOEMA',
  description:
    'Encuentra un terapeuta verificado en México. Busca por especialidad, enfoque y modalidad.',
};

export const dynamic = 'force-dynamic';

interface SearchParams {
  searchParams: Promise<{
    q?: string;
    modalidad?: string;
    ciudad?: string;
  }>;
}

interface TerapeutaPublico {
  profile_id: string;
  titulo: string;
  descripcion: string | null;
  especialidades: string[];
  enfoques: string[];
  modalidades: string[];
  estado_verificacion: string;
  profile: {
    nombre: string;
    avatar_url: string | null;
    ciudad: string | null;
  } | null;
}

export default async function DirectorioPage({ searchParams }: SearchParams) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const modalidad = params.modalidad;
  const ciudad = params.ciudad?.trim();

  const supabase = await createClient();
  let query = supabase
    .from('terapeutas')
    .select(`
      profile_id, titulo, descripcion, especialidades, enfoques, modalidades, estado_verificacion,
      profile:profiles!terapeutas_profile_id_fkey(nombre, avatar_url, ciudad)
    `)
    .eq('estado_verificacion', 'verificado')
    .order('titulo');

  if (modalidad) query = query.contains('modalidades', [modalidad]);

  const { data: terapeutasRaw } = await query;
  const terapeutas = ((terapeutasRaw as any[]) ?? []).map((t) => ({
    ...t,
    profile: Array.isArray(t.profile) ? t.profile[0] : t.profile,
  })) as TerapeutaPublico[];

  // Filtros client-side adicionales (búsqueda en nombre/descripción/especialidades)
  const filtrados = terapeutas.filter((t) => {
    if (ciudad && t.profile?.ciudad?.toLowerCase() !== ciudad.toLowerCase()) {
      return false;
    }
    if (q) {
      const haystack = [
        t.profile?.nombre,
        t.titulo,
        t.descripcion,
        ...(t.especialidades ?? []),
        ...(t.enfoques ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q.toLowerCase());
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <p className="caption mb-2">Directorio</p>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink leading-tight">
          Encuentra a tu terapeuta
        </h1>
        <p className="text-foreground-muted mt-3 max-w-2xl">
          Profesionales verificados con cédula vigente en México. Filtra por
          especialidad o enfoque para encontrar a alguien que se adapte a ti.
        </p>
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap gap-3 mb-8" method="get">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, especialidad, enfoque…"
            className="h-11 w-full pl-10 pr-3 rounded-md border border-noema-deep/10 bg-bone text-[15px] focus:outline-none focus:border-noema-sage focus:ring-1 focus:ring-noema-sage"
          />
        </div>
        <select
          name="modalidad"
          defaultValue={modalidad ?? ''}
          className="h-11 px-3 rounded-md border border-noema-deep/10 bg-bone text-[15px] focus:outline-none focus:border-noema-sage focus:ring-1 focus:ring-noema-sage"
        >
          <option value="">Toda modalidad</option>
          <option value="online">Online</option>
          <option value="presencial">Presencial</option>
          <option value="hibrida">Híbrida</option>
        </select>
        <input
          name="ciudad"
          defaultValue={ciudad ?? ''}
          placeholder="Ciudad"
          className="h-11 px-3 rounded-md border border-noema-deep/10 bg-bone text-[15px] focus:outline-none focus:border-noema-sage focus:ring-1 focus:ring-noema-sage min-w-[180px]"
        />
        <button
          type="submit"
          className="h-11 px-5 rounded-md bg-noema-sage text-bone font-medium hover:bg-noema-deep transition-colors"
        >
          Buscar
        </button>
      </form>

      {/* Resultados */}
      {filtrados.length === 0 ? (
        <Card variant="flat" className="text-center py-16">
          <p className="text-foreground-muted mb-2">
            No encontramos terapeutas con esos filtros.
          </p>
          <p className="text-sm text-foreground-muted">
            Ajusta tu búsqueda o explora sin filtros.
          </p>
        </Card>
      ) : (
        <>
          <p className="caption mb-4">
            {filtrados.length} {filtrados.length === 1 ? 'terapeuta' : 'terapeutas'}
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((t) => (
              <li key={t.profile_id}>
                <Link href={`/terapeutas/${t.profile_id}`}>
                  <Card
                    variant="flat"
                    className="h-full hover:shadow-soft transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="size-12 rounded-full bg-noema-sage/15 flex items-center justify-center text-noema-deep/70 font-medium shrink-0">
                        {t.profile ? initials(t.profile.nombre) : '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate">
                          {t.profile?.nombre ?? '—'}
                        </p>
                        <p className="text-xs text-foreground-muted truncate">
                          {t.titulo}
                        </p>
                      </div>
                    </div>

                    {t.profile?.ciudad && (
                      <p className="text-xs text-foreground-muted flex items-center gap-1 mb-3">
                        <MapPin className="size-3" />
                        {t.profile.ciudad}
                      </p>
                    )}

                    {t.descripcion && (
                      <p className="text-sm text-foreground-muted line-clamp-3 mb-3">
                        {t.descripcion}
                      </p>
                    )}

                    {t.especialidades.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {t.especialidades.slice(0, 3).map((e) => (
                          <span
                            key={e}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-noema-deep/5 text-foreground-muted"
                          >
                            {e}
                          </span>
                        ))}
                        {t.especialidades.length > 3 && (
                          <span className="text-[11px] text-foreground-muted px-2 py-0.5">
                            +{t.especialidades.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}
