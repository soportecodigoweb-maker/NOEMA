'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, Calendar, LifeBuoy, LogOut, type LucideIcon } from 'lucide-react';
import { Vesica } from '@/components/ui/Vesica';
import { cn } from '@/lib/utils';
import { signOutAction } from '../../../app/(auth)/actions';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const items: NavItem[] = [
  { href: '/paciente', label: 'Inicio', icon: Home },
  { href: '/paciente/mensajes', label: 'Mensajes', icon: MessageCircle },
  { href: '/paciente/sesiones', label: 'Sesiones', icon: Calendar },
];

export interface PacienteNavProps {
  user: {
    nombre: string;
    avatarUrl?: string | null;
    terapeutaNombre?: string | null;
  };
}

export function PacienteNav({ user }: PacienteNavProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-noema-deep text-bone">
      <div className="flex items-center gap-3 px-6 py-7">
        <Vesica size={28} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
        <span className="font-serif text-xl tracking-[0.34em]">NOEMA</span>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/paciente' && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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

        <div className="mt-6 border-t border-bone/[0.08] pt-4">
          <Link
            href="/paciente/crisis"
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2.5',
              'text-sm font-medium transition-colors',
              pathname === '/paciente/crisis'
                ? 'bg-noema-clay/25 text-bone'
                : 'bg-noema-clay/15 text-bone hover:bg-noema-clay/25',
            )}
          >
            <LifeBuoy className="size-[18px] shrink-0" strokeWidth={1.8} />
            Necesito apoyo ahora
          </Link>
        </div>
      </nav>

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
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.nombre}</p>
            {user.terapeutaNombre && (
              <p className="truncate text-xs text-bone/60">
                con {user.terapeutaNombre}
              </p>
            )}
          </div>
        </div>
        <form action={signOutAction} className="mt-3">
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-bone/60 transition-colors hover:bg-bone/[0.06] hover:text-bone"
          >
            <LogOut className="size-4" strokeWidth={1.6} />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
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
