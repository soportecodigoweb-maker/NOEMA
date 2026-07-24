'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  MessageCircle,
  Calendar,
  LifeBuoy,
  LogOut,
  HeartPulse,
  BookOpen,
  ClipboardList,
  Target,
  BarChart3,
  Menu,
  X,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { Vesica } from '@/components/ui/Vesica';
import { CentroNotificaciones } from '@/components/notificaciones/CentroNotificaciones';
import { cn } from '@/lib/utils';
import { signOutAction } from '../../../app/(auth)/actions';

export interface FuncionesPaciente {
  sos: boolean;
  chat: boolean;
  diario: boolean;
  registros: boolean;
  tareas: boolean;
  progreso: boolean;
  agenda: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Función que debe estar habilitada para mostrarlo (undefined = siempre). */
  requiere?: keyof FuncionesPaciente;
  /** Clave para el tour del modo aprendiz (data-tour). */
  tour?: string;
}

const items: NavItem[] = [
  { href: '/paciente', label: 'Inicio', icon: Home, tour: 'nav-inicio' },
  { href: '/paciente/registros', label: 'Mis registros', icon: HeartPulse, requiere: 'registros', tour: 'nav-registros' },
  { href: '/paciente/diario', label: 'Diario', icon: BookOpen, requiere: 'diario', tour: 'nav-diario' },
  { href: '/paciente/tareas', label: 'Tareas', icon: ClipboardList, requiere: 'tareas', tour: 'nav-tareas' },
  { href: '/paciente/metas', label: 'Mis metas', icon: Target, tour: 'nav-metas' },
  { href: '/paciente/progreso', label: 'Progreso', icon: BarChart3, requiere: 'progreso', tour: 'nav-progreso' },
  { href: '/paciente/mensajes', label: 'Mensajes', icon: MessageCircle, requiere: 'chat', tour: 'nav-mensajes' },
  { href: '/paciente/sesiones', label: 'Sesiones', icon: Calendar, tour: 'nav-sesiones' },
  { href: '/paciente/cuenta', label: 'Mi cuenta', icon: UserCog, tour: 'nav-cuenta' },
];

const TODAS_ACTIVAS: FuncionesPaciente = {
  sos: true,
  chat: true,
  diario: true,
  registros: true,
  tareas: true,
  progreso: true,
  agenda: false,
};

export interface PacienteNavProps {
  user: {
    nombre: string;
    avatarUrl?: string | null;
    terapeutaNombre?: string | null;
  };
  funciones?: FuncionesPaciente;
}

export function PacienteNav({ user, funciones = TODAS_ACTIVAS }: PacienteNavProps) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const visibles = items.filter((i) => !i.requiere || funciones[i.requiere]);

  return (
    <>
      {/* Barra superior — solo móvil */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-noema-deep px-4 py-3 text-bone lg:hidden">
        <div className="flex items-center gap-2.5">
          <Vesica size={24} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
          <span className="font-serif text-lg tracking-[0.3em]">NOEMA</span>
        </div>
        <div className="flex items-center gap-1">
          <CentroNotificaciones tono="oscuro" />
          <button
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú"
            className="rounded-md p-1.5 hover:bg-bone/10"
          >
            <Menu className="size-6" strokeWidth={1.8} />
          </button>
        </div>
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
          // Desktop: columna fija (sin transform para que sticky funcione)
          'lg:sticky lg:top-0 lg:h-screen lg:[transform:none]',
          // Móvil: drawer deslizable. Usamos [transform:...] (propiedad directa)
          // en vez de translate-x-* (variable CSS) para que la transición sí se
          // dispare — con la variable, Chrome deja el transform congelado.
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:transition-none',
          abierto ? '[transform:translateX(0)]' : '[transform:translateX(-100%)]',
        )}
      >
        <div className="flex items-center justify-between px-6 py-7">
          <div className="flex items-center gap-3">
            <Vesica size={28} color="rgba(250, 247, 241, 0.95)" strokeWidth={1.5} />
            <span className="font-serif text-xl tracking-[0.34em]">NOEMA</span>
          </div>
          {/* Campana: en desktop vive aquí; en móvil está en la barra superior */}
          <div className="hidden lg:block">
            <CentroNotificaciones tono="oscuro" />
          </div>
          <button
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú"
            className="rounded-md p-1 hover:bg-bone/10 lg:hidden"
          >
            <X className="size-5" strokeWidth={1.8} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {visibles.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/paciente' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setAbierto(false)}
                    data-tour={item.tour}
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

          <div className={cn('mt-6 border-t border-bone/[0.08] pt-4', !funciones.sos && 'hidden')}>
            <Link
              href="/paciente/crisis"
              onClick={() => setAbierto(false)}
              data-tour="nav-sos"
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
