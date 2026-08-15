import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Mail, Phone, MapPin, Calendar, Clock, CreditCard } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { detalleUsuario } from '../../data';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UsuarioDetallePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const u = await detalleUsuario(id);
  if (!u) notFound();

  const meta = [
    { icon: Mail, label: 'Correo', valor: u.email },
    { icon: Phone, label: 'Teléfono', valor: u.telefono || '—' },
    { icon: MapPin, label: 'Ciudad', valor: u.ciudad || '—' },
    { icon: Calendar, label: 'Registro', valor: u.registro },
    { icon: Clock, label: 'Último acceso', valor: u.ultimoAcceso },
    { icon: CreditCard, label: 'Suscripción', valor: u.suscripcion },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin/usuarios" className="inline-flex items-center gap-1 text-sm text-foreground-muted hover:text-ink">
        <ChevronLeft className="size-4" /> Usuarios
      </Link>

      <div className="flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-noema-sage/15 text-lg font-medium text-noema-deep/70">
          {u.nombre.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? '').join('')}
        </span>
        <div>
          <h1 className="font-serif text-2xl text-ink">{u.nombre}</h1>
          <span className="rounded bg-noema-deep/[0.06] px-2 py-0.5 text-xs text-ink/70">{u.rol}</span>
        </div>
      </div>

      {/* Datos básicos */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {meta.map((m) => (
          <div key={m.label} className="rounded-xl border border-noema-deep/10 bg-white p-4">
            <p className="mb-0.5 flex items-center gap-1.5 text-xs uppercase tracking-wider text-foreground-muted">
              <m.icon className="size-3.5" /> {m.label}
            </p>
            <p className="truncate text-sm text-ink">{m.valor}</p>
          </div>
        ))}
      </div>

      {/* Resumen del proceso (sin contenido clínico) */}
      {u.resumen.length > 0 && (
        <section className="rounded-2xl border border-noema-deep/10 bg-white p-5">
          <h2 className="mb-1 font-serif text-lg text-ink">Resumen del proceso</h2>
          <p className="mb-4 text-xs text-foreground-muted">
            Información básica y de actividad. No incluye contenido clínico.
          </p>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {u.resumen.map((r) => (
              <div key={r.label}>
                <dt className="text-xs text-foreground-muted">{r.label}</dt>
                <dd className="font-serif text-2xl text-ink">{r.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
