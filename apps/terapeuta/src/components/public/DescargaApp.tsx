import { Download, Smartphone } from 'lucide-react';
import {
  DESCARGA_ANDROID_URL,
  DESCARGA_IOS_URL,
  ANDROID_MINIMO,
  IOS_CANAL,
} from '@/lib/descargas';

function AppleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" className={className} fill="currentColor" aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zM262.1 104.5c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function AndroidGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 576 512" className={className} fill="currentColor" aria-hidden>
      <path d="M420.6 301.9a24 24 0 1 1 24-24 24 24 0 0 1-24 24m-265.1 0a24 24 0 1 1 24-24 24 24 0 0 1-24 24m273.7-144.5 47.9-83a10 10 0 1 0-17.3-10l-48.5 84.1a301.3 301.3 0 0 0-246.6 0L69.9 64.5a10 10 0 1 0-17.3 10l47.9 83C36.6 192.3-8.7 261.7 0 448h576c8.7-186.3-36.6-255.7-146.9-290.6" />
    </svg>
  );
}

function BotonTienda({
  href,
  glyph,
  sub,
  titulo,
}: {
  href: string | null;
  glyph: React.ReactNode;
  sub: string;
  titulo: string;
}) {
  const disponible = !!href;
  const contenido = (
    <>
      <span className="shrink-0">{glyph}</span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[11px] uppercase tracking-wider opacity-70">
          {disponible ? sub : 'Próximamente'}
        </span>
        <span className="block text-base font-medium leading-tight">{titulo}</span>
      </span>
      {disponible && <Download className="size-5 shrink-0 opacity-80" strokeWidth={1.8} />}
    </>
  );

  if (!disponible) {
    return (
      <div className="flex cursor-default items-center gap-3 rounded-2xl border border-bone/15 bg-bone/[0.04] px-5 py-4 text-bone/45">
        {contenido}
      </div>
    );
  }

  return (
    <a
      href={href!}
      className="flex items-center gap-3 rounded-2xl bg-bone px-5 py-4 text-noema-deep transition-transform hover:-translate-y-0.5 hover:shadow-lg"
      {...(href!.endsWith('.apk') ? { download: true } : { target: '_blank', rel: 'noreferrer' })}
    >
      {contenido}
    </a>
  );
}

/**
 * Sección editorial de descarga de la app móvil. Muestra botones prominentes de
 * iOS (TestFlight) y Android (APK). Cada botón se activa solo cuando su enlace
 * existe en `@/lib/descargas`; mientras tanto se muestra en "Próximamente".
 */
export function DescargaApp() {
  const hayAndroid = !!DESCARGA_ANDROID_URL;

  return (
    <section className="bg-noema-deep text-bone">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 py-20 md:grid-cols-[1.1fr_1fr]">
        {/* Copy + botones */}
        <div>
          <p className="caption mb-3 text-bone/60">Disponible para tu celular</p>
          <h2 className="mb-4 font-serif text-4xl leading-[1.1] sm:text-5xl">
            Lleva tu proceso<br />en el bolsillo.
          </h2>
          <p className="mb-8 max-w-md text-bone/75 leading-relaxed">
            Registra emociones en segundos, escribe en tu diario y accede a tu plan de apoyo
            desde donde estés. Gratis, y funciona incluso antes de tener terapeuta.
          </p>

          <div className="flex flex-col gap-3 sm:max-w-sm">
            <BotonTienda
              href={DESCARGA_IOS_URL}
              glyph={<AppleGlyph className="size-7" />}
              sub={IOS_CANAL}
              titulo="Descargar para iPhone"
            />
            <BotonTienda
              href={DESCARGA_ANDROID_URL}
              glyph={<AndroidGlyph className="size-7" />}
              sub="APK directo"
              titulo="Descargar para Android"
            />
          </div>

          {hayAndroid && (
            <p className="mt-4 max-w-sm text-xs text-bone/55 leading-relaxed">
              Android: al abrir el archivo, tu teléfono puede pedirte permitir la instalación
              de "orígenes desconocidos". Es normal en apps fuera de la tienda. Requiere{' '}
              {ANDROID_MINIMO}.
            </p>
          )}
        </div>

        {/* Mockup de teléfono */}
        <div className="flex justify-center md:justify-end">
          <div className="relative aspect-[9/19] w-56 rounded-[2.5rem] border-4 border-bone/15 bg-gradient-to-b from-noema-sage/25 to-noema-deep p-3 shadow-2xl">
            <div className="absolute left-1/2 top-3 h-1.5 w-16 -translate-x-1/2 rounded-full bg-bone/20" />
            <div className="flex h-full w-full flex-col items-center justify-center rounded-[1.8rem] bg-bone/[0.06] text-center">
              <Smartphone className="mb-3 size-10 text-bone/70" strokeWidth={1.4} />
              <p className="px-6 font-serif text-lg text-bone/90">NOEMA</p>
              <p className="mt-1 px-6 text-[11px] text-bone/55">
                Tu proceso, contigo todos los días.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
