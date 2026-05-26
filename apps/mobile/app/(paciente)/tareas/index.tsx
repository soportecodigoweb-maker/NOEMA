/**
 * Tareas asignadas por el terapeuta.
 * El paciente puede ver, marcar como hecha y escribir cómo le fue.
 */
import { useState, useCallback } from 'react';
import {
  ScrollView, View, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_limite: string | null;
  frecuencia: string;
  estado: string;
  vinculacion_id: string;
}

export default function TareasIndexScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: vincs } = await supabase
      .from('vinculaciones')
      .select('id')
      .eq('paciente_id', user.id)
      .eq('estado', 'activa');

    if (!vincs || vincs.length === 0) {
      setTareas([]);
      return;
    }

    const vincIds = vincs.map((v: { id: string }) => v.id);
    const { data } = await supabase
      .from('tareas')
      .select('id, titulo, descripcion, fecha_limite, frecuencia, estado, vinculacion_id')
      .in('vinculacion_id', vincIds)
      .in('estado', ['pendiente', 'en_progreso'])
      .order('fecha_limite', { ascending: true, nullsFirst: false });

    setTareas((data as Tarea[] | null) ?? []);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

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
            <Text variant="h1">Tus tareas</Text>
            <Text variant="bodyM" color="#5C6B5A">
              Ejercicios y prácticas que asignó tu terapeuta.
            </Text>
          </View>

          {tareas.length === 0 ? (
            <Card padding={5} variant="flat" style={styles.empty}>
              <Text variant="bodyM" color="#5C6B5A" align="center">
                Cuando tu terapeuta te asigne una tarea, aparecerá aquí.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: spacing[3] }}>
              {tareas.map((t) => (
                <Pressable
                  key={t.id}
                  onPress={() => router.push(`/(paciente)/tareas/${t.id}`)}
                  style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                >
                  <Card padding={4} variant="flat">
                    <View style={styles.row}>
                      <Text variant="caption">{t.frecuencia.toUpperCase()}</Text>
                      {t.fecha_limite && (
                        <Text variant="caption" color="#B85450">
                          Hasta {formatFecha(t.fecha_limite)}
                        </Text>
                      )}
                    </View>
                    <Text variant="h3" style={{ marginTop: spacing[2] }}>
                      {t.titulo}
                    </Text>
                    {t.descripcion && (
                      <Text
                        variant="bodyM"
                        color="#5C6B5A"
                        style={{ marginTop: spacing[2] }}
                        numberOfLines={2}
                      >
                        {t.descripcion}
                      </Text>
                    )}
                    <View style={styles.estadoChip}>
                      <Text
                        style={{
                          fontFamily: fontFamily.sansMedium,
                          fontSize: 11,
                          color: t.estado === 'en_progreso' ? colors.noemaDeep : '#5C6B5A',
                          letterSpacing: 0.5,
                          textTransform: 'uppercase',
                        }}
                      >
                        {t.estado === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
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
  return new Date(f + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[20] },
  header: { gap: spacing[2], marginTop: spacing[2] },
  empty: { alignItems: 'center', paddingVertical: spacing[10] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  estadoChip: { marginTop: spacing[3], alignSelf: 'flex-start' },
});
