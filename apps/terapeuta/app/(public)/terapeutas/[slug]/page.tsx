import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('terapeutas')
    .select(`titulo, descripcion, profile:profiles!terapeutas_profile_id_fkey(nombre)`)
    .eq('profile_id', slug)
    .eq('estado_verificacion', 'verificado')
    .single();
  const profile = Array.isArray((data as any)?.profile)
    ? (data as any).profile[0]
    : (data as any)?.profile;

  if (!data) return { title: 'Terapeuta · NOEMA' };
  return {
    title: `${profile?.nombre ?? 'Terapeuta'} · ${data.titulo}`,
    description: data.descripcion?.slice(0, 160),
  };
}

export default async function PerfilPublicoPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: tRaw } = await supabase
    .from('terapeutas')
    .select(`
      profile_id, titulo, descripcion, cedula_profesional,
      especialidades, enfoques, modalidades, estado_verificacion,
      profile:profiles!terapeutas_profile_id_fkey(nombre, avatar_url, ciudad, email)
    `)
    .eq('profile_id', slug)
    .eq('estado_verificacion', 'verificado')
    .single();

  if (!tRaw) notFound();
  const t = tRaw as any;
  const profile = Array.isArray(t.profile) ? t.profile[0] : t.profile;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Link
        href="/terapeutas"
        className="inline-flex items-center gap-1 text-foreground-muted hover:text-ink mb-8 text-sm"
      >
        <ChevronLeft className="size-4" strokeWidth={1.6} />
        Directorio
      </Link>

      {/* Cabecera */}
      <div className="flex items-start gap-6 mb-10 flex-wrap">
        <div className="size-24 rounded-full bg-noema-sage/15 flex items-center justify-center text-noema-deep/70 text-2xl font-medium shrink-0">
          {profile ? initials(profile.nombre) : '?'}
        </div>
        <div className="flex-1 min-w-[280px]">
          <h1 className="font-serif text-4xl text-ink mb-1">
            {profile?.nombre ?? 'Terapeuta'}
          </h1>
          <p className="text-foreground-muted">{t.titulo}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-foreground-muted flex-wrap">
            {profile?.ciudad && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" /> {profile.ciudad}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-noema-sage">
              <span className="size-1.5 rounded-full bg-noema-sage" />
              Verificado/a
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bio */}
        <div className="lg:col-span-2 space-y-6">
          {t.descripcion && (
            <section>
              <h2 className="caption mb-3">Sobre el profesional</h2>
              <div className="prose-noema text-ink leading-relaxed">
                {t.descripcion.split('\n').map((p: string, i: number) =>
                  p.trim() ? (
                    <p key={i} className="mb-3">{p}</p>
                  ) : null,
                )}
              </div>
            </section>
          )}

          {t.especialidades?.length > 0 && (
            <section>
              <h2 className="caption mb-3">Especialidades</h2>
              <div className="flex flex-wrap gap-2">
                {t.especialidades.map((e: string) => (
                  <span
                    key={e}
                    className="text-sm px-3 py-1.5 rounded-full bg-noema-sage/10 text-noema-deep"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </section>
          )}

          {t.enfoques?.length > 0 && (
            <section>
              <h2 className="caption mb-3">Enfoques terapéuticos</h2>
              <div className="flex flex-wrap gap-2">
                {t.enfoques.map((e: string) => (
                  <span
                    key={e}
                    className="text-sm px-3 py-1.5 rounded-full bg-bone border border-noema-deep/10 text-ink/80"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar acciones */}
        <aside className="space-y-4">
          <Card>
            <h3 className="font-semibold text-ink mb-3">Modalidades</h3>
            <ul className="space-y-2 text-sm">
              {(t.modalidades ?? []).map((m: string) => (
                <li key={m} className="flex items-center gap-2 text-ink/80 capitalize">
                  <span className="size-1.5 rounded-full bg-noema-sage" />
                  {m}
                </li>
              ))}
            </ul>
          </Card>

          <Card variant="inverse">
            <h3 className="font-semibold text-bone mb-2">
              ¿Quieres comenzar contigo?
            </h3>
            <p className="text-sm text-bone/80 mb-4 leading-relaxed">
              Contáctale directamente. Cuando agendes tu primera sesión, te dará
              un código para vincularte en NOEMA.
            </p>
            {profile?.email && (
              <a
                href={`mailto:${profile.email}?subject=Contacto%20desde%20NOEMA`}
                className="inline-flex items-center gap-2 text-bone hover:underline text-sm font-medium"
              >
                <Mail className="size-4" />
                {profile.email}
              </a>
            )}
          </Card>

          {t.cedula_profesional && (
            <Card variant="flat" className="text-xs text-foreground-muted">
              <p>Cédula profesional <strong>{t.cedula_profesional}</strong></p>
              <p className="mt-1">Verificada por NOEMA</p>
            </Card>
          )}
        </aside>
      </div>
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
