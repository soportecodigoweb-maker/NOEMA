'use client';

import { useEffect } from 'react';
import { sonarUI, inicializarSonidosUI } from '@/lib/sonidos-ui';

/**
 * Escucha global de sonidos de interfaz.
 *
 * Añade oyentes a nivel de documento para que cualquier botón, enlace,
 * interruptor o campo de texto haga un micro-sonido al usarse — sin tener que
 * tocar cada componente. Los sonidos son sutiles y modernos (ver sonidos-ui.ts).
 *
 * Se monta una sola vez en el layout raíz, así cubre a paciente y terapeuta.
 */
export function SonidosUI() {
  useEffect(() => {
    inicializarSonidosUI();

    // Si el usuario prefiere menos movimiento, no metemos sonidos por defecto.
    const prefiereQuieto =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefiereQuieto) return;

    /** ¿El elemento (o un ancestro cercano) es algo "presionable"? */
    const esPresionable = (el: Element | null): 'toggle' | 'boton' | null => {
      const objetivo = el?.closest(
        'button, a[href], [role="button"], [role="switch"], input[type="checkbox"], input[type="radio"], label',
      );
      if (!objetivo) return null;
      const rol = objetivo.getAttribute('role');
      const tipo = objetivo.getAttribute('type');
      if (
        rol === 'switch' ||
        tipo === 'checkbox' ||
        tipo === 'radio' ||
        objetivo.getAttribute('aria-checked') !== null
      ) {
        return 'toggle';
      }
      return 'boton';
    };

    const alPresionar = (e: Event) => {
      const objetivo = e.target as Element | null;
      const clase = esPresionable(objetivo);
      if (!clase) return;

      if (clase === 'toggle') {
        // aria-checked se lee ANTES de que cambie: si está apagado, sonará "on".
        const nodo = objetivo?.closest('[aria-checked], [role="switch"], input');
        const marcado =
          nodo?.getAttribute('aria-checked') === 'true' ||
          (nodo as HTMLInputElement | null)?.checked === true;
        sonarUI(marcado ? 'toggleOff' : 'toggleOn');
        return;
      }

      // Enviar / confirmar tiene un tono propio, más "de logro".
      const boton = objetivo?.closest('button, [role="button"], a[href]') as HTMLElement | null;
      const esEnvio =
        boton?.getAttribute('type') === 'submit' ||
        boton?.dataset.sonido === 'enviar' ||
        /\b(enviar|guardar|publicar|confirmar|aceptar|firmar)\b/i.test(boton?.textContent ?? '');
      sonarUI(esEnvio ? 'enviar' : 'tap');
    };

    const alEscribir = (e: KeyboardEvent) => {
      const objetivo = e.target as HTMLElement | null;
      if (!objetivo) return;
      const editable =
        objetivo.tagName === 'INPUT' ||
        objetivo.tagName === 'TEXTAREA' ||
        objetivo.isContentEditable;
      if (!editable) return;
      // Solo teclas que "escriben" o borran; ignoramos modificadores y flechas.
      if (e.key.length === 1 || e.key === 'Backspace') {
        sonarUI('tecla');
      }
    };

    document.addEventListener('pointerdown', alPresionar, { passive: true });
    document.addEventListener('keydown', alEscribir, { passive: true });

    return () => {
      document.removeEventListener('pointerdown', alPresionar);
      document.removeEventListener('keydown', alEscribir);
    };
  }, []);

  return null;
}
