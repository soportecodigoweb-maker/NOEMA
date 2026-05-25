import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { tiempoRelativo, formatFecha } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PacienteResumenPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Recuperar vinculación + paciente
  const { data: vinc } = await supabase
    .from('vinculaciones')
    .select('id, paciente_id, fecha_inicio')
    .eq('id', id)
    .single();

  if (!vinc?.paciente_id) {
    return (
      <Card variant="flat" className="text-center py-12">
        <p className="text-foreground-muted">
          Aún no hay datos. Cuando el paciente acepte la vinculación e inicie
          actividad, aparecerá aquí.
        </p>
      </Card>
    );
  }

  // Período: últimos 30 días
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);

  const [
    { data: registros },
    { data: ultimoRegistro },
    { count: registrosCount },
  ] = await Promise.all([
    supabase
      .from('registros_emocionales')
      .select('intensidad, emocion_principal_key, fecha, privacidad')
      .eq('paciente_id', vinc.paciente_id)
      .gte('fecha', desde.toISOString().slice(0, 10))
      .order('fecha', { ascending: false }),
    supabase
      .from('registros_emocionales')
      .select('fecha, hora, descripcion, intensidad, emocion_principal_key')
      .eq('paciente_id', vinc.paciente_id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('registros_emocionales')
      .select('*', { count: 'exact', head: true })
      .eq('paciente_id', vinc.paciente_id)
      .gte('fecha', desde.toISOString().slice(0, 10)),
  ]);

  const intensidadPromedio = registros && registros.length > 0
    ? (registros.reduce((s, r) => s + r.intensidad, 0) / registros.length).toFixed(1)
    : '—';

  // Top 5 emociones más frecuentes
  const conteoEmociones = (registros ?? []).reduce<Record<string, number>>(
    (acc, r) => {
      acc[r.emocion_principal_key] = (acc[r.emocion_principal_key] ?? 0) + 1;
      return acc;
    },
    {},
  );
  const topEmociones = Object.entries(conteoEmociones)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div>
        <h2 className="font-serif text-2xl text-ink mb-1">Panorama general</h2>
        <p className="text-sm text-foreground-muted mb-4">
          Resumen de los últimos 30 días.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="flat" className="p-5">
            <p className="caption mb-2">Registros</p>
            <p className="font-serif text-4xl text-ink">{registrosCount ?? 0}</p>
            <p className="text-xs text-foreground-muted mt-1">
              Compartidos por el paciente
            </p>
          </Card>
          <Card variant="flat" className="p-5">
            <p className="caption mb-2">Intensidad promedio</p>
            <p className="font-serif text-4xl text-ink">{intensidadPromedio}<span className="text-xl text-foreground-muted">/5</span></p>
            <p className="text-xs text-foreground-muted mt-1">
              Sobre todos los registros
            </p>
          </Card>
          <Card variant="flat" className="p-5">
            <p className="caption mb-2">Adherencia</p>
            <p className="font-serif text-4xl text-ink">—</p>
            <p className="text-xs text-foreground-muted mt-1">
              Próximamente
            </p>
          </Card>
        </div>
      </div>

      {/* Dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Último registro */}
        <Card>
          <CardHeader>
            <CardTitle>Último registro</CardTitle>
            {ultimoRegistro && (
              <CardDescription>
                {formatFecha(ultimoRegistro.fecha)} ·{' '}
                {ultimoRegistro.hora.slice(0, 5)}
              </CardDescription>
            )}
          </CardHeader>
          {ultimoRegistro ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <EmocionDot familia={emocionToFamilia(ultimoRegistro.emocion_principal_key)} />
                <p className="font-medium text-ink capitalize">
                  {ultimoRegistro.emocion_principal_key.replace('_', ' ')}
                </p>
                <span className="text-sm text-foreground-muted">
                  Intensidad {ultimoRegistro.intensidad}/5
                </span>
              </div>
              {ultimoRegistro.descripcion ? (
                <blockquote className="font-serif italic text-lg text-ink/80 leading-relaxed border-l-2 border-noema-sage/30 pl-4">
                  &ldquo;{ultimoRegistro.descripcion}&rdquo;
                </blockquote>
              ) : (
                <p className="text-sm text-foreground-muted italic">
                  Sin descripción.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-foreground-muted">
              Aún no hay registros compartidos.
            </p>
          )}
        </Card>

        {/* Temas / emociones más frecuentes */}
        <Card>
          <CardHeader>
            <CardTitle>Emociones frecuentes</CardTitle>
            <CardDescription>
              Lo que el paciente más registró este periodo.
            </CardDescription>
          </CardHeader>
          {topEmociones.length === 0 ? (
            <p className="text-sm text-foreground-muted">Sin datos aún.</p>
          ) : (
            <ul className="space-y-3">
              {topEmociones.map(([key, count]) => {
                const max = topEmociones[0]?.[1] ?? 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <li key={key} className="flex items-center gap-3">
                    <EmocionDot familia={emocionToFamilia(key)} />
                    <span className="capitalize text-sm font-medium text-ink w-32 shrink-0">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <div className="flex-1 h-2 bg-noema-deep/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-noema-sage rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-foreground-muted w-8 text-right">
                      {count}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* Disclaimer IA / clínico */}
      <p className="text-xs text-foreground-muted italic text-center">
        Esta información es operativa, no clínica. Cualquier interpretación o decisión terapéutica
        es de tu criterio profesional.
      </p>

      {/* Mini meta */}
      {vinc.fecha_inicio && (
        <p className="text-xs text-foreground-muted text-center">
          Vinculación iniciada hace{' '}
          {tiempoRelativo(vinc.fecha_inicio).toLowerCase()}.
        </p>
      )}
    </div>
  );
}

function EmocionDot({ familia }: { familia: string }) {
  const colorMap: Record<string, string> = {
    tranquilo: 'bg-emotion-tranquilo',
    ansioso: 'bg-emotion-ansioso',
    triste: 'bg-emotion-triste',
    cansado: 'bg-emotion-cansado',
    feliz: 'bg-emotion-feliz',
  };
  return (
    <span className={`size-3 rounded-full ${colorMap[familia] ?? 'bg-noema-sage/40'}`} />
  );
}

function emocionToFamilia(key: string): string {
  // Heurística inicial — usaremos un join con emociones_catalogo en la próxima iteración
  if (key.includes('feliz') || key.includes('satisf') || key.includes('orgu') || key.includes('entus') || key.includes('conec')) return 'feliz';
  if (key.includes('cansad') || key.includes('agot') || key.includes('sueno') || key.includes('sobre') || key.includes('apag')) return 'cansado';
  if (key.includes('trist') || key.includes('melan') || key.includes('vaci') || key.includes('solo') || key.includes('duel')) return 'triste';
  if (key.includes('ansi') || key.includes('preoc') || key.includes('alert') || key.includes('inqui') || key.includes('abrum')) return 'ansioso';
  return 'tranquilo';
}
