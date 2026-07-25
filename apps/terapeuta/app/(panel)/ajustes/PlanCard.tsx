'use client';

import { useState } from 'react';
import { ExternalLink, Check, Mail } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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

/** Los tres paquetes de NOEMA. */
const PAQUETES = [
  { id: 'p5', pacientes: 5, precio: 350, popular: false },
  { id: 'p10', pacientes: 10, precio: 600, popular: true },
  { id: 'p20', pacientes: 20, precio: 1000, popular: false },
];

const CORREO_ESPECIAL = 'soportecodigoweb@gmail.com';

export function PlanCard({ planEstado, trialTerminaAt, pacientesActivos, facturas }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activar = async (plan: string) => {
    setLoading(plan);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? 'No pudimos iniciar el pago. Intenta más tarde.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(null);
    }
  };

  const enTrial = planEstado === 'trial';
  const activa = planEstado === 'activa';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planes y paquetes</CardTitle>
        <CardDescription>
          {activa
            ? `Tu plan está activo. Tienes ${pacientesActivos} paciente${pacientesActivos === 1 ? '' : 's'} activo${pacientesActivos === 1 ? '' : 's'}.`
            : enTrial && trialTerminaAt
              ? `Estás en prueba premium hasta el ${formatFecha(trialTerminaAt)}. Elige tu paquete cuando quieras.`
              : 'Elige el paquete que mejor se ajusta a tu consulta. Todos incluyen todas las funciones de NOEMA.'}
        </CardDescription>
      </CardHeader>

      {/* Paquetes */}
      <div className="grid gap-3 sm:grid-cols-3">
        {PAQUETES.map((p) => (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-2xl border p-4 ${
              p.popular
                ? 'border-noema-sage bg-noema-sage/[0.06]'
                : 'border-noema-deep/12 bg-white'
            }`}
          >
            {p.popular && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-noema-sage px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-bone">
                Popular
              </span>
            )}
            <p className="text-sm font-medium text-ink">
              Hasta {p.pacientes} pacientes
            </p>
            <p className="mt-1 font-serif text-3xl text-ink">
              ${p.precio}
              <span className="text-base font-normal text-foreground-muted"> /mes</span>
            </p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-noema-sage">
              <Check className="size-3.5" strokeWidth={2.2} /> Todas las funciones
            </p>
            <button
              onClick={() => activar(p.id)}
              disabled={loading !== null}
              className={`mt-4 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                p.popular
                  ? 'bg-noema-deep text-bone hover:bg-noema-deep/90'
                  : 'border border-noema-deep/15 text-ink hover:border-noema-deep/30'
              }`}
            >
              {loading === p.id ? 'Abriendo…' : activa ? 'Cambiar a este' : 'Elegir paquete'}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-[#B85450]">{error}</p>}

      {/* Paquete especial */}
      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-dashed border-noema-deep/15 bg-bone/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink">¿Más de 20 pacientes?</p>
          <p className="text-xs text-foreground-muted">
            Te armamos un paquete especial a tu medida.
          </p>
        </div>
        <a
          href={`mailto:${CORREO_ESPECIAL}?subject=${encodeURIComponent('Paquete especial NOEMA (más de 20 pacientes)')}`}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-noema-deep px-3 py-2 text-sm font-medium text-bone hover:bg-noema-deep/90"
        >
          <Mail className="size-4" strokeWidth={1.8} />
          Solicitar paquete especial
        </a>
      </div>

      {facturas.length > 0 && (
        <div className="mt-6 border-t border-noema-deep/[0.06] pt-4">
          <p className="caption mb-3">Histórico de facturas</p>
          <ul className="space-y-2">
            {facturas.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-1.5 text-sm">
                <div>
                  <p className="font-medium text-ink">
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
                    className="inline-flex items-center gap-1 text-xs text-noema-sage hover:text-noema-deep"
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
