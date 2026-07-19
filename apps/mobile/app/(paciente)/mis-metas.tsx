/**
 * Mis metas y recordatorios (requerimiento #5).
 *
 * El paciente crea sus propios recordatorios/metas (independientes de las tareas
 * del terapeuta) y ve un panel de progreso personal. Son PRIVADOS — el terapeuta
 * no los ve.
 */
import { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, fontFamily, radii } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { programarRecordatorio } from '@/lib/notifications';

interface Meta {
  id: string;
  titulo: string;
  nota: string | null;
  completado: boolean;
  recurrencia: string;
}

export default function MisMetasScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [creando, setCreando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('recordatorios_personales')
      .select('id, titulo, nota, completado, recurrencia')
      .eq('paciente_id', user.id)
      .order('completado', { ascending: true })
      .order('creado_at', { ascending: false });
    setMetas((data as Meta[] | null) ?? []);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const crear = async (recordarEn?: { horas: number; etiqueta: string }) => {
    if (!user || !nuevoTitulo.trim()) return;
    setCreando(true);
    const titulo = nuevoTitulo.trim();
    let recordarAt: string | null = null;

    // Programar notificación local si se eligió un recordatorio (#3)
    if (recordarEn) {
      const fecha = new Date(Date.now() + recordarEn.horas * 3600000);
      recordarAt = fecha.toISOString();
      await programarRecordatorio('Recordatorio NOEMA', titulo, fecha);
    }

    const { error } = await supabase.from('recordatorios_personales').insert({
      paciente_id: user.id,
      titulo,
      recordar_at: recordarAt,
    });
    setCreando(false);
    if (!error) {
      setNuevoTitulo('');
      await load();
    }
  };

  const toggle = async (meta: Meta) => {
    const nuevo = !meta.completado;
    setMetas((prev) =>
      prev.map((m) => (m.id === meta.id ? { ...m, completado: nuevo } : m)),
    );
    await supabase
      .from('recordatorios_personales')
      .update({
        completado: nuevo,
        completado_at: nuevo ? new Date().toISOString() : null,
      })
      .eq('id', meta.id);
    await load();
  };

  const eliminar = async (id: string) => {
    setMetas((prev) => prev.filter((m) => m.id !== id));
    await supabase.from('recordatorios_personales').delete().eq('id', id);
  };

  const activas = metas.filter((m) => !m.completado);
  const hechas = metas.filter((m) => m.completado);
  const total = metas.length;
  const pct = total > 0 ? Math.round((hechas.length / total) * 100) : 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Cuenta</Text>
          </Pressable>
        </View>

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
          <View style={{ gap: spacing[1] }}>
            <Text variant="h1">Mis metas</Text>
            <Text variant="bodyM" color="#5C6B5A">
              Recordatorios y metas que tú defines. Son privados: tu terapeuta no
              los ve.
            </Text>
          </View>

          {/* Panel de progreso personal */}
          {total > 0 && (
            <Card padding={4} style={{ marginTop: spacing[4] }}>
              <Text variant="caption" color="#5C6B5A">Tu progreso</Text>
              <Text variant="h2" style={{ marginTop: spacing[1] }}>
                {hechas.length}/{total}
                <Text variant="muted"> completadas ({pct}%)</Text>
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
            </Card>
          )}

          {/* Crear nueva */}
          <Card padding={4} variant="flat" style={{ marginTop: spacing[4], gap: spacing[3] }}>
            <Text variant="h3">Nueva meta o recordatorio</Text>
            <Input
              placeholder="Ej. Caminar 10 min, llamar a mi hermana…"
              value={nuevoTitulo}
              onChangeText={setNuevoTitulo}
              maxLength={120}
            />
            <Button
              variant="primary"
              size="md"
              onPress={() => crear()}
              loading={creando}
              disabled={!nuevoTitulo.trim()}
            >
              Agregar
            </Button>
            {/* Recordatorios locales rápidos (#3) */}
            {nuevoTitulo.trim().length > 0 && (
              <View style={{ gap: spacing[2] }}>
                <Text variant="muted">O agregar con recordatorio:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
                  {[
                    { horas: 1, etiqueta: 'En 1 hora' },
                    { horas: 3, etiqueta: 'En 3 horas' },
                    { horas: 24, etiqueta: 'Mañana' },
                  ].map((op) => (
                    <Pressable
                      key={op.etiqueta}
                      onPress={() => crear(op)}
                      disabled={creando}
                      style={styles.recChip}
                    >
                      <Text variant="bodyM">{op.etiqueta}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* Activas */}
          {activas.length > 0 && (
            <View style={{ marginTop: spacing[5], gap: spacing[2] }}>
              <Text variant="caption" style={{ marginBottom: spacing[1] }}>
                Por hacer ({activas.length})
              </Text>
              {activas.map((m) => (
                <MetaRow key={m.id} meta={m} onToggle={() => toggle(m)} onDelete={() => eliminar(m.id)} />
              ))}
            </View>
          )}

          {/* Completadas */}
          {hechas.length > 0 && (
            <View style={{ marginTop: spacing[5], gap: spacing[2] }}>
              <Text variant="caption" style={{ marginBottom: spacing[1] }}>
                Completadas ({hechas.length})
              </Text>
              {hechas.map((m) => (
                <MetaRow key={m.id} meta={m} onToggle={() => toggle(m)} onDelete={() => eliminar(m.id)} />
              ))}
            </View>
          )}

          {total === 0 && (
            <Card padding={5} variant="flat" style={{ marginTop: spacing[4], alignItems: 'center' }}>
              <Text variant="bodyM" color="#5C6B5A" align="center">
                Aún no tienes metas. Crea la primera arriba.
              </Text>
            </Card>
          )}

          <View style={{ height: spacing[8] }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function MetaRow({
  meta,
  onToggle,
  onDelete,
}: {
  meta: Meta;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card padding={3} variant="flat" style={styles.metaRow}>
      <Pressable onPress={onToggle} style={styles.checkTap}>
        <View style={[styles.check, meta.completado && styles.checkOn]}>
          {meta.completado && <Text style={{ color: colors.bone, fontSize: 13 }}>✓</Text>}
        </View>
      </Pressable>
      <Text
        variant="bodyM"
        style={{
          flex: 1,
          textDecorationLine: meta.completado ? 'line-through' : 'none',
          color: meta.completado ? '#9AA697' : colors.ink,
        }}
      >
        {meta.titulo}
      </Text>
      <Pressable onPress={onDelete} hitSlop={10}>
        <Text style={{ color: '#B85450', fontSize: 18 }}>×</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  back: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#5C6B5A' },
  scroll: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(46,59,46,0.08)',
    marginTop: spacing[2],
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: colors.noemaSage },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  checkTap: { padding: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(61,77,62,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.noemaSage, borderColor: colors.noemaSage },
  recChip: {
    borderWidth: 1,
    borderColor: 'rgba(61,77,62,0.20)',
    borderRadius: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bone,
  },
});
