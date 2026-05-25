'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  MessageCircle,
  Library,
  BarChart3,
  Settings,
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

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-noema-deep text-bone">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-7">
        <Vesica size={28} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
        <span className="font-serif text-xl tracking-[0.34em]">NOEMA</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/inicio' && pathname.startsWith(item.href));
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
