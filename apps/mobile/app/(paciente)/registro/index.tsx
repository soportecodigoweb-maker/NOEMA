/**
 * Lista de registros emocionales del paciente.
 * Muestra los últimos 60 días agrupados por fecha (más reciente arriba).
 */
import { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily, emotionColors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Registro {
  id: string;
  fecha: string;
  hora: string;
  emocion_principal_key: string;
  intensidad: number;
  descripcion: string | null;
  privacidad: 'privado' | 'compartido' | 'marcado_sesion';
}

export default function RegistroIndexScreen() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const desde = new Date();
    desde.setDate(desde.getDate() - 60);
    const { data } = await supabase
      .from('registros_emocionales')
      .select('id, fecha, hora, emocion_principal_key, intensidad, descripcion, privacidad')
      .eq('paciente_id', user.id)
      .gte('fecha', desde.toISOString().slice(0, 10))
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });
    setRegistros((data as Registro[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Agrupar por fecha
  const porFecha = registros.reduce<Record<string, Registro[]>>((acc, r) => {
    (acc[r.fecha] = acc[r.fecha] ?? []).push(r);
    return acc;
  }, {});

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaView edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={colors.noemaSage}
            />
          }
        >
          <View style={styles.header}>
            <Text variant="h1">Tus registros</Text>
            <Text variant="bodyM" color="#5C6B5A">
              Lo que has registrado en los últimos 60 días.
            </Text>
          </View>

          {loading ? (
            <View style={{ paddingTop: spacing[10], alignItems: 'center' }}>
              <ActivityIndicator color={colors.noemaSage} />
            </View>
          ) : registros.length === 0 ? (
            <Card padding={5} variant="flat" style={styles.empty}>
              <Text variant="bodyM" color="#5C6B5A" align="center">
                Cuando registres tu primera emoción, aparecerá aquí.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: spacing[5] }}>
              {Object.entries(porFecha).map(([fecha, items]) => (
                <View key={fecha} style={{ gap: spacing[2] }}>
                  <Text variant="caption" style={styles.fechaLabel}>
                    {formatFecha(fecha)}
                  </Text>
                  <View style={{ gap: spacing[2] }}>
                    {items.map((r) => (
                      <Card key={r.id} padding={4} variant="flat">
                        <View style={styles.row}>
                          <View
                            style={[
                              styles.emocionDot,
                              { backgroundColor: emotionColorFor(r.emocion_principal_key) },
                            ]}
                          />
                          <Text variant="bodyM" style={{ fontFamily: fontFamily.sansMedium, flex: 1 }}>
                            {capitalizar(r.emocion_principal_key)}
                          </Text>
                          <Text variant="caption" color="#5C6B5A">
                            {r.hora.slice(0, 5)} · {r.intensidad}/5
                          </Text>
                        </View>
                        {r.descripcion && (
                          <Text variant="bodyM" color="#5C6B5A" style={{ marginTop: spacing[2] }} numberOfLines={3}>
                            {r.descripcion}
                          </Text>
                        )}
                        <View style={styles.privacyChip}>
                          <Text variant="caption" color="#5C6B5A">
                            {privacidadLabel(r.privacidad)}
                          </Text>
                        </View>
                      </Card>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      <CrisisButton variant="floating" />
    </View>
  );
}

function formatFecha(f: string): string {
  const d = new Date(f + 'T00:00:00');
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  if (d.getTime() === hoy.getTime()) return 'Hoy';
  if (d.getTime() === ayer.getTime()) return 'Ayer';
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

function capitalizar(key: string): string {
  return key.split('_').map((s) => (s[0]?.toUpperCase() ?? '') + s.slice(1)).join(' ');
}

function privacidadLabel(p: string): string {
  if (p === 'privado') return 'Privado';
  if (p === 'marcado_sesion') return 'Para sesión';
  return 'Compartido';
}

function emotionColorFor(key: string): string {
  if (key.includes('feliz') || key.includes('satisf') || key.includes('orgu')) return emotionColors.feliz;
  if (key.includes('cansad') || key.includes('agot')) return emotionColors.cansado;
  if (key.includes('trist') || key.includes('melan') || key.includes('vaci')) return emotionColors.triste;
  if (key.includes('ansi') || key.includes('preoc') || key.includes('inqui')) return emotionColors.ansioso;
  return emotionColors.tranquilo;
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[24] },
  header: { gap: spacing[2], marginTop: spacing[2] },
  empty: { alignItems: 'center', paddingVertical: spacing[10] },
  fechaLabel: { marginLeft: spacing[1] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  emocionDot: { width: 12, height: 12, borderRadius: 6 },
  privacyChip: { marginTop: spacing[2], alignSelf: 'flex-start' },
});
