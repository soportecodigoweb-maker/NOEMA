'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  MessageCircle,
  Library,
  BarChart3,
  Wallet,
  Settings,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Vesica } from '@/components/ui/Vesica';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { href: '/inicio', label: 'Inicio', icon: Home },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/sesiones', label: 'Sesiones', icon: Calendar },
  { href: '/mensajes', label: 'Mensajes', icon: MessageCircle },
  { href: '/recursos', label: 'Recursos', icon: Library },
  { href: '/finanzas', label: 'Finanzas', icon: Wallet },
  { href: '/analiticas', label: 'Analíticas', icon: BarChart3 },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
];

export interface SidebarProps {
  user?: {
    nombre: string;
    avatarUrl?: string | null;
    titulo?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {/* Barra superior — solo móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-noema-deep px-4 py-3 text-bone lg:hidden">
        <div className="flex items-center gap-2.5">
          <Vesica size={24} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
          <span className="font-serif text-lg tracking-[0.3em]">NOEMA</span>
        </div>
        <button
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-md p-1.5 hover:bg-bone/10"
        >
          <Menu className="size-6" strokeWidth={1.8} />
        </button>
      </header>

      {/* Overlay móvil */}
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-noema-deep/50 lg:hidden"
          onClick={() => setAbierto(false)}
          aria-hidden
        />
      )}

      {/* Sidebar / drawer */}
      <aside
        className={cn(
          'flex w-64 shrink-0 flex-col bg-noema-deep text-bone',
          // Desktop: columna fija
          'lg:sticky lg:top-0 lg:h-screen',
          // Móvil: drawer deslizable
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 lg:transition-none',
          abierto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-7">
          <div className="flex items-center gap-3">
            <Vesica size={28} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
            <span className="font-serif text-xl tracking-[0.34em]">NOEMA</span>
          </div>
          <button
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="rounded-md p-1 hover:bg-bone/10 lg:hidden"
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/inicio' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    className={cn(
                      'group flex items-center gap-3 rounded-md px-3 py-2.5',
                      'text-sm font-medium transition-colors',
                      active
                        ? 'bg-bone/10 text-bone'
                        : 'text-bone/70 hover:bg-bone/[0.06] hover:text-bone',
                    )}
                  >
                    <item.icon
                      className={cn(
                        'size-[18px] shrink-0',
                        active ? 'text-bone' : 'text-bone/60 group-hover:text-bone',
                      )}
                      strokeWidth={1.6}
                    />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User card */}
        {user && (
          <div className="border-t border-bone/[0.08] p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-bone/15 text-sm font-medium">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.nombre}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  getInitials(user.nombre)
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.nombre}</p>
                {user.titulo && (
                  <p className="truncate text-xs text-bone/60">{user.titulo}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}
