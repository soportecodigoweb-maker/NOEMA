import Link from 'next/link';
import { Users, Search, ChevronRight } from 'lucide-react';
import { buscarUsuarios } from '../data';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Usuarios · Panel de dueño' };

const ROL_COLOR: Record<string, string> = {
  terapeuta: 'bg-noema-sage/15 text-noema-sage',
  paciente: 'bg-noema-clay/15 text-noema-clay',
  centro: 'bg-noema-deep/10 text-noema-deep/70',
  admin: 'bg-ink/10 text-ink/70',
  sin_terapeuta: 'bg-noema-deep/[0.06] text-ink/60',
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function UsuariosPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const usuarios = await buscarUsuarios(q ?? '');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-ink">
          <Users className="size-7 text-noema-sage" /> Gestión de usuarios
        </h1>
        <p className="text-sm text-foreground-muted">
          Datos básicos y estado del proceso. No se muestra contenido clínico.
        </p>
      </div>

      <form method="get" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground-muted" />
          <input
            name="q"
            defaultValue={q ?? ''}
            placeholder="Buscar por nombre o correo…"
            className="w-full rounded-md border border-noema-deep/15 bg-white py-2 pl-9 pr-3 text-sm focus:border-noema-sage focus:outline-none"
          />
        </div>
        <button className="rounded-md bg-noema-deep px-4 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90">
          Buscar
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-noema-deep/10 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-noema-deep/[0.08] text-left text-xs uppercase tracking-wider text-foreground-muted">
              <th className="px-4 py-3 font-medium">Usuario</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Registro</th>
              <th className="px-4 py-3 font-medium">Último acceso</th>
              <th className="px-4 py-3 font-medium">Suscripción</th>
              <th className="px-4 py-3 font-medium">Proceso</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-foreground-muted">
                  Sin resultados.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} className="border-b border-noema-deep/[0.04] transition-colors last:border-0 hover:bg-paper/40">
                  <td className="px-4 py-3">
                    <Link href={`/admin/usuarios/${u.id}`} className="block">
                      <p className="font-medium text-ink">{u.nombre}</p>
                      <p className="text-xs text-foreground-muted">{u.email}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[11px] ${ROL_COLOR[u.rol] ?? ''}`}>{u.rol}</span>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">{u.registro}</td>
                  <td className="px-4 py-3 text-foreground-muted">{u.ultimoAcceso}</td>
                  <td className="px-4 py-3 text-foreground-muted">{u.suscripcion}</td>
                  <td className="px-4 py-3 text-foreground-muted">{u.estadoProceso || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/usuarios/${u.id}`} className="text-foreground-muted hover:text-ink">
                      <ChevronRight className="ml-auto size-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
