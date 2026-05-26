'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { formatFecha } from '@/lib/utils';

interface Factura {
  id: string;
  monto_centavos: number;
  moneda: string;
  estado: string;
  pacientes_count: number | null;
  periodo_inicio: string | null;
  periodo_fin: string | null;
  url_pdf: string | null;
  pagada_at: string | null;
}

interface Props {
  planEstado: string;
  trialTerminaAt: string | null;
  pacientesActivos: number;
  facturas: Factura[];
}

export function PlanCard({ planEstado, trialTerminaAt, pacientesActivos, facturas }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activar = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Sesión expirada.');
        return;
      }
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const res = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? 'No pudimos iniciar el pago.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const estados: Record<string, { titulo: string; texto: string; color: string }> = {
    sin_pago: {
      titulo: 'Plan gratuito',
      texto: 'Comienza tu prueba de 30 días gratis con pacientes ilimitados.',
      color: 'text-foreground-muted',
    },
    trial: {
      titulo: 'Prueba premium',
      texto: trialTerminaAt
        ? `Tu prueba termina el ${formatFecha(trialTerminaAt)}.`
        : 'Estás en prueba premium.',
      color: 'text-noema-sage',
    },
    activa: {
      titulo: 'Plan activo',
      texto: `Estás cobrando $100 MXN por cada uno de tus ${pacientesActivos} pacientes activos.`,
      color: 'text-noema-sage',
    },
    pago_fallido: {
      titulo: 'Pago fallido',
      texto: 'Hubo un problema cobrando tu último mes. Revisa tu método de pago.',
      color: 'text-[#B85450]',
    },
    cancelada: {
      titulo: 'Plan cancelado',
      texto: 'Tu suscripción fue cancelada. Puedes reactivarla cuando quieras.',
      color: 'text-foreground-muted',
    },
  };

  const e = estados[planEstado] ?? estados.sin_pago!;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan</CardTitle>
        <CardDescription>
          <span className={e.color}>{e.titulo}</span> · {e.texto}
        </CardDescription>
      </CardHeader>

      {(planEstado === 'sin_pago' || planEstado === 'cancelada') && (
        <div className="space-y-3">
          <p className="text-sm text-ink/80">
            <strong>$100 MXN por paciente activo / mes.</strong> 30 días gratis para
            empezar.
          </p>
          <Button variant="primary" size="md" loading={loading} onClick={activar}>
            Iniciar prueba premium
          </Button>
          {error && <p className="text-sm text-[#B85450]">{error}</p>}
        </div>
      )}

      {planEstado === 'pago_fallido' && (
        <div className="space-y-3">
          <Button variant="primary" size="md" loading={loading} onClick={activar}>
            Actualizar método de pago
          </Button>
          {error && <p className="text-sm text-[#B85450]">{error}</p>}
        </div>
      )}

      {facturas.length > 0 && (
        <div className="mt-6 pt-4 border-t border-noema-deep/[0.06]">
          <p className="caption mb-3">Histórico de facturas</p>
          <ul className="space-y-2">
            {facturas.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between text-sm py-1.5"
              >
                <div>
                  <p className="text-ink font-medium">
                    ${(f.monto_centavos / 100).toFixed(2)} {f.moneda.toUpperCase()}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {f.pagada_at && formatFecha(f.pagada_at)}
                    {f.pacientes_count && ` · ${f.pacientes_count} pacientes`}
                  </p>
                </div>
                {f.url_pdf && (
                  <a
                    href={f.url_pdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-noema-sage hover:text-noema-deep inline-flex items-center gap-1 text-xs"
                  >
                    PDF <ExternalLink className="size-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
