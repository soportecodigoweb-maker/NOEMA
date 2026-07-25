'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ZoomIn, X } from 'lucide-react';

/**
 * Editor de foto de perfil: recorta, acerca y reposiciona la imagen al gusto
 * antes de subirla. Todo con canvas nativo (sin librerías). Exporta un cuadrado
 * 512×512 que luego se muestra como círculo en toda la app.
 */
const D = 288; // lado del área de edición en pantalla
const OUT = 512; // lado de la imagen exportada

export function EditorAvatar({
  file,
  onCancel,
  onSave,
  guardando,
}: {
  file: File;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
  guardando: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [listo, setListo] = useState(false);

  // Mantiene la imagen siempre cubriendo el área (sin bordes vacíos).
  const limitar = useCallback(
    (off: { x: number; y: number }, s: number) => {
      const img = imgRef.current;
      if (!img) return off;
      const w = img.width * s;
      const h = img.height * s;
      const maxX = Math.max(0, (w - D) / 2);
      const maxY = Math.max(0, (h - D) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, off.x)),
        y: Math.min(maxY, Math.max(-maxY, off.y)),
      };
    },
    [],
  );

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const cover = Math.max(D / img.width, D / img.height);
      setMinScale(cover);
      setScale(cover);
      setOffset({ x: 0, y: 0 });
      setListo(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const dibujar = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, D, D);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, D / 2 - w / 2 + offset.x, D / 2 - h / 2 + offset.y, w, h);
  }, [scale, offset]);

  useEffect(() => {
    if (listo) dibujar();
  }, [listo, dibujar]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setOffset((o) => limitar({ x: o.x + dx, y: o.y + dy }, scale));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const cambiarZoom = (s: number) => {
    setScale(s);
    setOffset((o) => limitar(o, s));
  };

  const guardar = () => {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement('canvas');
    out.width = OUT;
    out.height = OUT;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    const r = OUT / D;
    const w = img.width * scale * r;
    const h = img.height * scale * r;
    ctx.drawImage(img, OUT / 2 - w / 2 + offset.x * r, OUT / 2 - h / 2 + offset.y * r, w, h);
    out.toBlob((blob) => blob && onSave(blob), 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-noema-deep/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg text-ink">Acomoda tu foto</h3>
          <button onClick={onCancel} aria-label="Cerrar" className="text-foreground-muted hover:text-ink">
            <X className="size-5" />
          </button>
        </div>

        {/* Área de edición con máscara circular */}
        <div className="relative mx-auto touch-none" style={{ width: D, height: D }}>
          <canvas
            ref={canvasRef}
            width={D}
            height={D}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className="cursor-grab rounded-lg bg-bone active:cursor-grabbing"
          />
          {/* Máscara: oscurece fuera del círculo */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ boxShadow: '0 0 0 9999px rgba(46,59,46,0.45)' }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/70" />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <ZoomIn className="size-4 shrink-0 text-foreground-muted" strokeWidth={1.8} />
          <input
            type="range"
            min={minScale}
            max={minScale * 3}
            step={0.001}
            value={scale}
            onChange={(e) => cambiarZoom(Number(e.target.value))}
            className="w-full accent-noema-sage"
            aria-label="Acercar"
          />
        </div>
        <p className="mt-1 text-center text-xs text-foreground-muted">
          Arrastra para mover · desliza para acercar
        </p>

        <div className="mt-4 flex gap-2">
          <button
            onClick={guardar}
            disabled={guardando || !listo}
            className="flex-1 rounded-md bg-noema-deep px-4 py-2.5 text-sm font-medium text-bone hover:bg-noema-deep/90 disabled:opacity-50"
          >
            {guardando ? 'Guardando…' : 'Guardar foto'}
          </button>
          <button
            onClick={onCancel}
            className="rounded-md px-3 py-2.5 text-sm text-foreground-muted hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
