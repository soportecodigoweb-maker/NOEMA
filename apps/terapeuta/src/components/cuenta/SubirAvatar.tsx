'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Camera, Loader2 } from 'lucide-react';
import { guardarAvatarUrlAction } from '../../../app/(auth)/avatar-actions';

/**
 * Foto de perfil para cualquier usuario. Sube al bucket público 'avatares'
 * bajo su carpeta y guarda la URL en profiles.avatar_url.
 */
export function SubirAvatar({
  userId,
  avatarUrl,
  nombre,
  size = 88,
}: {
  userId: string;
  avatarUrl: string | null;
  nombre: string;
  size?: number;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(avatarUrl);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const subir = async (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Elige una imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe pesar menos de 5 MB.');
      return;
    }
    setSubiendo(true);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const ruta = `${userId}/perfil-${Date.now()}.${ext}`;

    const { error: errSubida } = await supabase.storage
      .from('avatares')
      .upload(ruta, file, { contentType: file.type, upsert: true });

    if (errSubida) {
      setError('No se pudo subir la imagen.');
      setSubiendo(false);
      return;
    }

    const { data } = supabase.storage.from('avatares').getPublicUrl(ruta);
    const nuevaUrl = `${data.publicUrl}?v=${Date.now()}`; // rompe caché
    await guardarAvatarUrlAction(nuevaUrl);
    setUrl(nuevaUrl);
    setSubiendo(false);
    router.refresh();
  };

  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative shrink-0 overflow-hidden rounded-full"
        style={{ width: size, height: size }}
        aria-label="Cambiar foto de perfil"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={nombre} className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center bg-noema-sage/15 font-serif text-2xl text-noema-deep/70">
            {iniciales || '·'}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-noema-deep/50 opacity-0 transition-opacity group-hover:opacity-100">
          {subiendo ? (
            <Loader2 className="size-5 animate-spin text-white" />
          ) : (
            <Camera className="size-5 text-white" strokeWidth={1.8} />
          )}
        </span>
      </button>

      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="rounded-md border border-noema-deep/15 px-3 py-1.5 text-sm text-ink hover:border-noema-deep/30 disabled:opacity-50"
        >
          {subiendo ? 'Subiendo…' : 'Cambiar foto'}
        </button>
        <p className="mt-1 text-xs text-foreground-muted">JPG o PNG, máximo 5 MB.</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])}
        className="hidden"
      />
    </div>
  );
}
