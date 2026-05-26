'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

interface ResumenResult {
  ok: boolean;
  resumen_md?: string;
  resumen_json?: any;
  meta?: {
    registros: number;
    diario: number;
    dias: number;
  };
  error?: string;
}

export function GenerarResumenButton({ vinculacionId }: { vinculacionId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResumenResult | null>(null);
  const [, startTransition] = useTransition();

  const generar = async () => {
    setLoading(true);
    setResult(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setResult({ ok: false, error: 'Sesión expirada.' });
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/generar-resumen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ vinculacion_id: vinculacionId, dias: 14 }),
      });

      const data: ResumenResult = await res.json();
      setResult(data);
      if (data.ok) {
        startTransition(() => router.refresh());
      }
    } catch (e) {
      setResult({ ok: false, error: 'No pudimos conectar con la IA.' });
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button
        variant="secondary"
        size="md"
        onClick={() => {
          setOpen(true);
          generar();
        }}
      >
        <Sparkles className="size-4" strokeWidth={1.8} />
        Generar resumen pre-sesión
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-noema-deep/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-noema-sage" strokeWidth={1.8} />
            <h2 className="font-serif text-2xl text-ink">Resumen pre-sesión</h2>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              setResult(null);
            }}
            className="text-foreground-muted hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading && (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="size-8 animate-spin text-noema-sage mx-auto" />
            <p className="text-sm text-foreground-muted">
              Analizando lo que tu paciente compartió…
            </p>
          </div>
        )}

        {result && !result.ok && (
          <div className="py-8 text-center space-y-3">
            <p className="text-[#B85450]">{result.error}</p>
            <Button variant="secondary" size="sm" onClick={generar}>
              Intentar de nuevo
            </Button>
          </div>
        )}

        {result?.ok && result.resumen_md && (
          <>
            {result.meta && (
              <p className="caption mb-4">
                Basado en {result.meta.registros} registros y {result.meta.diario} entradas de diario
                · últimos {result.meta.dias} días
              </p>
            )}
            <article className="prose-noema text-ink space-y-4">
              {renderMarkdown(result.resumen_md)}
            </article>
            <div className="mt-6 pt-4 border-t border-noema-deep/[0.06] text-xs text-foreground-muted italic">
              Generado por IA con guardrails. Es información operativa, no diagnóstica.
              El resumen se guardó en el histórico del paciente.
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

/**
 * Render minimalista de markdown (headers + bullets + blockquote + bold).
 * No usamos react-markdown para mantener el bundle pequeño.
 */
function renderMarkdown(md: string): React.ReactNode {
  const lines = md.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('# ')) {
      return (
        <h2 key={i} className="font-serif text-2xl text-ink mt-2">
          {line.slice(2)}
        </h2>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={i} className="font-sans font-semibold text-ink mt-6">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h4 key={i} className="font-sans font-medium text-ink mt-4">
          {inlineMd(line.slice(4))}
        </h4>
      );
    }
    if (line.startsWith('> ')) {
      return (
        <blockquote
          key={i}
          className="border-l-2 border-noema-sage/40 pl-3 italic text-ink/80 font-serif"
        >
          {line.slice(2)}
        </blockquote>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <li key={i} className="ml-5 list-disc text-sm text-ink/90">
          {inlineMd(line.slice(2))}
        </li>
      );
    }
    if (line.startsWith('---')) {
      return <hr key={i} className="border-noema-deep/[0.08] my-4" />;
    }
    if (line.trim() === '') return null;
    return (
      <p key={i} className="text-sm text-ink/90 leading-relaxed">
        {inlineMd(line)}
      </p>
    );
  });
}

function inlineMd(text: string): React.ReactNode {
  // Bold con **
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={i}>{p.slice(2, -2)}</strong>;
    }
    if (p.startsWith('_') && p.endsWith('_')) {
      return <em key={i}>{p.slice(1, -1)}</em>;
    }
    return p;
  });
}
