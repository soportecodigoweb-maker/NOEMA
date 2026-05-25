'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TabsNavProps {
  vinculacionId: string;
}

const tabs = [
  { slug: '', label: 'Resumen' },
  { slug: 'registros', label: 'Registros' },
  { slug: 'sesiones', label: 'Sesiones' },
  { slug: 'ejercicios', label: 'Ejercicios' },
  { slug: 'notas', label: 'Notas' },
];

export function TabsNav({ vinculacionId }: TabsNavProps) {
  const pathname = usePathname();
  const base = `/pacientes/${vinculacionId}`;

  return (
    <nav className="flex gap-1 border-b border-noema-deep/[0.06] -mb-[1px]">
      {tabs.map((t) => {
        const href = t.slug ? `${base}/${t.slug}` : base;
        const active =
          (t.slug === '' && pathname === base) ||
          (t.slug !== '' && pathname === href);

        return (
          <Link
            key={t.slug}
            href={href}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              active
                ? 'border-noema-sage text-ink'
                : 'border-transparent text-foreground-muted hover:text-ink',
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
