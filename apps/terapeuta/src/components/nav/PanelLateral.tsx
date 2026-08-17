'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Inbox,
  BarChart3,
  Brain,
  Sparkles,
  Scale,
  Link2,
  Eye,
  ShieldCheck,
  Building2,
  Wallet,
  BellRing,
  Library,
  MessagesSquare,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Vesica } from '@/components/ui/Vesica';
import { cn } from '@/lib/utils';
import { signOutAction } from '../../../app/(auth)/actions';

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const MENUS: Record<'admin' | 'centro', Item[]> = {
  admin: [
    { href: '/admin', label: 'Panorama', icon: LayoutDashboard, exact: true },
    { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { href: '/admin/solicitudes', label: 'Solicitudes', icon: Inbox },
    { href: '/admin/metricas', label: 'Métricas', icon: BarChart3 },
    { href: '/admin/analitica', label: 'Analítica', icon: Brain },
    { href: '/admin/impacto', label: 'Impacto', icon: Sparkles },
    { href: '/admin/legal', label: 'Centro legal', icon: Scale },
    { href: '/admin/vincular', label: 'Vincular', icon: Link2 },
  ],
  centro: [
    { href: '/centro', label: 'Inicio', icon: LayoutDashboard, exact: true },
    { href: '/centro/terapeutas', label: 'Terapeutas', icon: Users },
    { href: '/centro/finanzas', label: 'Finanzas', icon: Wallet },
    { href: '/centro/alertas', label: 'Alertas', icon: BellRing },
    { href: '/centro/supervision', label: 'Supervisión', icon: Eye },
    { href: '/centro/recursos', label: 'Recursos', icon: Library },
    { href: '/centro/comunicacion', label: 'Comunicación', icon: MessagesSquare },
  ],
};

const MARCA: Record<'admin' | 'centro', { icon: LucideIcon; texto: string }> = {
  admin: { icon: ShieldCheck, texto: 'Panel de dueño' },
  centro: { icon: Building2, texto: 'Centro terapéutico' },
};

export function PanelLateral({
  panel,
  subtitulo,
  usuario,
}: {
  panel: 'admin' | 'centro';
  subtitulo?: string;
  usuario?: { nombre: string; sub?: string };
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const items = MENUS[panel];
  const marca = MARCA[panel];

  const esActivo = (i: Item) =>
    pathname === i.href || (!i.exact && pathname.startsWith(i.href + '/'));

  return (
    <>
      {/* Barra superior — solo móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-noema-deep px-4 py-3 text-bone lg:hidden">
        <Link href={items[0]!.href} onClick={() => setAbierto(false)} className="flex items-center gap-2.5">
          <Vesica size={24} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
          <span className="font-serif text-lg tracking-[0.3em]">NOEMA</span>
        </Link>
        <button onClick={() => setAbierto(true)} aria-label="Abrir menú" className="rounded-md p-1.5 hover:bg-bone/10">
          <Menu className="size-6" strokeWidth={1.8} />
        </button>
      </header>

      {abierto && (
        <div className="fixed inset-0 z-40 bg-noema-deep/50 lg:hidden" onClick={() => setAbierto(false)} aria-hidden />
      )}

      <aside
        className={cn(
          'flex w-64 shrink-0 flex-col bg-noema-deep text-bone',
          'lg:sticky lg:top-0 lg:h-screen lg:[transform:none]',
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:transition-none',
          abierto ? '[transform:translateX(0)]' : '[transform:translateX(-100%)]',
        )}
      >
        <div className="flex items-center justify-between px-6 py-7">
          <Link href={items[0]!.href} onClick={() => setAbierto(false)} className="flex items-center gap-3">
            <Vesica size={28} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
            <div>
              <span className="block font-serif text-lg tracking-[0.3em] leading-none">NOEMA</span>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-bone/55">
                <marca.icon className="size-3" /> {marca.texto}
              </span>
            </div>
          </Link>
          <button onClick={() => setAbierto(false)} aria-label="Cerrar menú" className="rounded-md p-1 hover:bg-bone/10 lg:hidden">
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </div>

        {subtitulo && (
          <p className="mb-1 truncate px-6 text-sm font-medium text-bone/90">{subtitulo}</p>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = esActivo(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                      active ? 'bg-bone/10 text-bone' : 'text-bone/70 hover:bg-bone/[0.06] hover:text-bone',
                    )}
                  >
                    <item.icon
                      className={cn('size-[18px] shrink-0', active ? 'text-bone' : 'text-bone/60 group-hover:text-bone')}
                      strokeWidth={1.6}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-bone/[0.08] p-4">
          {usuario && (
            <div className="mb-3 min-w-0">
              <p className="truncate text-sm font-medium">{usuario.nombre}</p>
              {usuario.sub && <p className="truncate text-xs text-bone/60">{usuario.sub}</p>}
            </div>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-bone/60 transition-colors hover:bg-bone/[0.06] hover:text-bone"
            >
              <LogOut className="size-4" strokeWidth={1.6} /> Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
