'use client';

import { useEffect, useState } from 'react';

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const CLAVE = 'noema:pwa-oculto';

/** Aviso discreto para instalar NOEMA como app. Android: botón nativo.
 *  iPhone: instrucciones (Compartir → Agregar a inicio). */
export function InstalarPWA() {
  const [visible, setVisible] = useState(false);
  const [esIOS, setEsIOS] = useState(false);
  const [deferred, setDeferred] = useState<PromptEvent | null>(null);

  useEffect(() => {
    // Ya instalada (corriendo como app) → no mostrar.
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      // iOS Safari
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    let oculto = false;
    try {
      oculto = localStorage.getItem(CLAVE) === '1';
    } catch {
      /* noop */
    }
    if (oculto) return;

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua); // Safari iOS
    setEsIOS(ios);

    if (ios) {
      // iOS no dispara beforeinstallprompt: mostramos instrucciones.
      const t = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(t);
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as PromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const ocultar = () => {
    setVisible(false);
    try {
      localStorage.setItem(CLAVE, '1');
    } catch {
      /* noop */
    }
  };

  const instalar = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    ocultar();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-md rounded-2xl border border-noema-deep/10 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-noema-deep">
          <svg viewBox="0 0 120 120" className="size-7" aria-hidden>
            <circle cx="48" cy="60" r="36" fill="none" stroke="#F1ECE0" strokeWidth="5" />
            <circle cx="72" cy="60" r="36" fill="none" stroke="#F1ECE0" strokeWidth="5" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">Instala NOEMA en tu teléfono</p>
          {esIOS ? (
            <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
              Toca el botón <span className="font-medium text-ink">Compartir</span> ⬆️ y luego{' '}
              <span className="font-medium text-ink">«Agregar a inicio»</span>.
            </p>
          ) : (
            <p className="mt-0.5 text-xs leading-relaxed text-foreground-muted">
              Ábrela como app, a pantalla completa y con su propio ícono.
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            {!esIOS && (
              <button
                onClick={instalar}
                className="rounded-md bg-noema-deep px-3 py-1.5 text-sm font-medium text-bone hover:bg-noema-deep/90"
              >
                Instalar
              </button>
            )}
            <button onClick={ocultar} className="px-2 py-1.5 text-sm text-foreground-muted hover:text-ink">
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
