/**
 * Análisis del paciente.
 *
 * Muestra:
 *   - Gráfica de intensidad emocional últimos 14 días
 *   - Top emociones más frecuentes
 *   - Total de registros del período
 *
 * Todo se calcula client-side a partir de sus propios registros.
 */
import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { IntensidadChart } from '@/components/charts/IntensidadChart';
import { colors, spacing, fontFamily, emotionColors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { esMX } from '@noema/i18n';

interface RegistroLite {
  fecha: string;
  intensidad: number;
  emocion_principal_key: string;
}

export default function AnalisisScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [registros, setRegistros] = useState<RegistroLite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const desde = new Date();
    desde.setDate(desde.getDate() - 13); // 14 días incluyendo hoy
    supabase
      .from('registros_emocionales')
      .select('fecha, intensidad, emocion_principal_key')
      .eq('paciente_id', user.id)
      .gte('fecha', desde.toISOString().slice(0, 10))
      .order('fecha', { ascending: true })
      .then(({ data }) => {
        setRegistros((data as RegistroLite[] | null) ?? []);
        setLoading(false);
      });
  }, [user]);

  // Promedio diario de intensidad (un punto por día)
  const promedioPorDia = aggregarPorDia(registros, 14);
  const promedioGlobal =
    registros.length > 0
      ? (registros.reduce((s, r) => s + r.intensidad, 0) / registros.length).toFixed(1)
      : '—';

  // Top emociones
  const conteo = registros.reduce<Record<string, number>>((acc, r) => {
    acc[r.emocion_principal_key] = (acc[r.emocion_principal_key] ?? 0) + 1;
    return acc;
  }, {});
  const topEmociones = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaView edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text variant="h1">{esMX.paciente.analysisTitle}</Text>
            <Text variant="bodyM" color="#5C6B5A">
              {esMX.paciente.analysisSubtitle}
            </Text>
          </View>

          {/* KPIs */}
          <View style={styles.kpiRow}>
            <Card variant="flat" padding={4} style={styles.kpiCard}>
              <Text variant="caption">Registros</Text>
              <Text variant="h2" style={{ marginTop: spacing[1] }}>
                {registros.length}
              </Text>
              <Text variant="muted">Últimos 14 días</Text>
            </Card>
            <Card variant="flat" padding={4} style={styles.kpiCard}>
              <Text variant="caption">Intensidad</Text>
              <Text variant="h2" style={{ marginTop: spacing[1] }}>
                {promedioGlobal}
                <Text variant="muted">/5</Text>
              </Text>
              <Text variant="muted">Promedio</Text>
            </Card>
          </View>

          {/* Gráfica */}
          <Card padding={4}>
            <Text variant="h3" style={{ marginBottom: spacing[3] }}>
              Tu intensidad emocional
            </Text>
            {loading ? (
              <Text variant="muted">Cargando…</Text>
            ) : promedioPorDia.length === 0 ? (
              <Text variant="muted">
                Cuando registres más emociones, aquí verás la curva.
              </Text>
            ) : (
              <IntensidadChart
                data={promedioPorDia}
                width={width - spacing[5] * 2 - spacing[4] * 2}
                height={180}
              />
            )}
          </Card>

          {/* Top emociones */}
          <Card padding={4}>
            <Text variant="h3" style={{ marginBottom: spacing[3] }}>
              Emociones más frecuentes
            </Text>
            {topEmociones.length === 0 ? (
              <Text variant="muted">Sin datos suficientes.</Text>
            ) : (
              <View style={{ gap: spacing[3] }}>
                {topEmociones.map(([key, count]) => {
                  const max = topEmociones[0]?.[1] ?? 1;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <View key={key} style={styles.emocionRow}>
                      <View
                        style={[
                          styles.emocionDot,
                          { backgroundColor: emotionColorFor(key) },
                        ]}
                      />
                      <Text
                        variant="bodyM"
                        style={{
                          width: 110,
                          fontFamily: fontFamily.sansMedium,
                        }}
                      >
                        {capitalizar(key)}
                      </Text>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${pct}%` }]} />
                      </View>
                      <Text variant="muted" style={{ width: 24, textAlign: 'right' }}>
                        {count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>

          <View style={{ height: spacing[8] }} />
        </ScrollView>
      </SafeAreaView>

      <CrisisButton variant="floating" />
    </View>
  );
}

// Agrupa registros por día. Devuelve siempre `n` puntos (rellena días sin datos con null→0).
function aggregarPorDia(registros: RegistroLite[], n: number): Array<{ fecha: string; valor: number }> {
  if (registros.length === 0) return [];
  const hoy = new Date();
  const dias: Array<{ fecha: string; valor: number; count: number }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    dias.push({ fecha: d.toISOString().slice(0, 10), valor: 0, count: 0 });
  }
  for (const r of registros) {
    const slot = dias.find((d) => d.fecha === r.fecha);
    if (slot) {
      slot.valor += r.intensidad;
      slot.count += 1;
    }
  }
  return dias.map((d) => ({
    fecha: d.fecha,
    valor: d.count > 0 ? d.valor / d.count : 0,
  }));
}

function capitalizar(key: string): string {
  return key
    .split('_')
    .map((s) => (s[0]?.toUpperCase() ?? '') + s.slice(1))
    .join(' ');
}

function emotionColorFor(key: string): string {
  if (key.includes('feliz') || key.includes('satisf') || key.includes('orgu') || key.includes('entus')) return emotionColors.feliz;
  if (key.includes('cansad') || key.includes('agot') || key.includes('apag')) return emotionColors.cansado;
  if (key.includes('trist') || key.includes('melan') || key.includes('vaci') || key.includes('solo')) return emotionColors.triste;
  if (key.includes('ansi') || key.includes('preoc') || key.includes('inqui') || key.includes('abrum')) return emotionColors.ansioso;
  return emotionColors.tranquilo;
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[4], paddingBottom: spacing[20] },
  header: { gap: spacing[2], marginTop: spacing[2] },
  kpiRow: { flexDirection: 'row', gap: spacing[3] },
  kpiCard: { flex: 1 },
  emocionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  emocionDot: { width: 10, height: 10, borderRadius: 5 },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(46, 59, 46, 0.06)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.noemaSage,
    borderRadius: 999,
  },
});
