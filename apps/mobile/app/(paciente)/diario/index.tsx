/**
 * Diario — lista de entradas del paciente.
 *
 * La privacidad es inviolable:
 *  - 'privado'         → solo el paciente
 *  - 'compartido'      → terapeuta puede leer
 *  - 'marcado_sesion'  → terapeuta lo verá destacado en próxima sesión
 *
 * Se marca con un punto sage cuando es compartido o marcado.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, radii, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface EntradaDiario {
  id: string;
  fecha: string;
  titulo: string | null;
  contenido: string;
  privacidad: 'privado' | 'compartido' | 'marcado_sesion';
  tags: string[];
  creado_at: string;
}

export default function DiarioIndexScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [entradas, setEntradas] = useState<EntradaDiario[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('diario_entradas')
      .select('id, fecha, titulo, contenido, privacidad, tags, creado_at')
      .eq('paciente_id', user.id)
      .order('fecha', { ascending: false })
      .order('creado_at', { ascending: false })
      .limit(100);
    setEntradas((data as EntradaDiario[] | null) ?? []);
    setLoading(false);
  }, [user]);

  // Recargar al volver a la pantalla
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.paper }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.noemaSage} />
          }
        >
          <View style={styles.header}>
            <Text variant="h1">Tu diario</Text>
            <Text variant="bodyM" color="#5C6B5A">
              Escribe sin filtro. Tú decides qué compartir.
            </Text>
          </View>

          {loading ? (
            <View style={{ paddingTop: spacing[10], alignItems: 'center' }}>
              <ActivityIndicator color={colors.noemaSage} />
            </View>
          ) : entradas.length === 0 ? (
            <Card padding={5} variant="flat" style={styles.empty}>
              <Text variant="bodyM" color="#5C6B5A" align="center">
                Cuando escribas tu primera entrada, aparecerá aquí.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: spacing[3] }}>
              {entradas.map((e) => (
                <Pressable
                  key={e.id}
                  onPress={() => router.push(`/(paciente)/diario/${e.id}`)}
                  style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                >
                  <Card padding={4} variant="flat">
                    <View style={styles.entryHeader}>
                      <Text variant="caption">{formatFecha(e.fecha)}</Text>
                      <PrivacyDot privacidad={e.privacidad} />
                    </View>
                    {e.titulo && (
                      <Text variant="h3" style={{ marginTop: spacing[2] }}>
                        {e.titulo}
                      </Text>
                    )}
                    <Text
                      variant="bodyM"
                      style={{ marginTop: spacing[2] }}
                      numberOfLines={3}
                    >
                      {e.contenido}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* FAB de nueva entrada */}
      <Pressable
        onPress={() => router.push('/(paciente)/diario/nuevo')}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
      >
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>

      <CrisisButton variant="floating" />
    </View>
  );
}

function PrivacyDot({ privacidad }: { privacidad: EntradaDiario['privacidad'] }) {
  const styles = {
    privado: { color: '#9AA697', label: 'Privado' },
    compartido: { color: colors.noemaSage, label: 'Compartido' },
    marcado_sesion: { color: '#D9B98C', label: 'Para sesión' },
  } as const;
  const s = styles[privacidad];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
      <Text variant="caption" color="#5C6B5A">
        {s.label}
      </Text>
    </View>
  );
}

function formatFecha(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
}

const localStyles = StyleSheet.create({
  fab: {},
});

const styles = StyleSheet.create({
  scroll: {
    padding: spacing[5],
    gap: spacing[5],
    paddingBottom: spacing[24],
  },
  header: { gap: spacing[2], marginTop: spacing[2] },
  empty: { alignItems: 'center', paddingVertical: spacing[10] },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: spacing[20],
    right: spacing[4],
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.noemaDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.noemaDeep,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  fabPlus: {
    color: colors.bone,
    fontSize: 32,
    fontFamily: fontFamily.sansLight,
    lineHeight: 36,
  },
});
