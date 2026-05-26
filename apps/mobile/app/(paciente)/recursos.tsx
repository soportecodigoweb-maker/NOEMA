/**
 * Recursos — contenido que el terapeuta asignó al paciente.
 * Se unen 3 tablas: recursos_asignados → contenido_educativo + vinculaciones.
 */
import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  RefreshControl,
  Linking,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { esMX } from '@noema/i18n';

interface RecursoAsignado {
  id: string;
  mensaje_terapeuta: string | null;
  visto_at: string | null;
  creado_at: string;
  contenido: {
    id: string;
    titulo: string;
    descripcion: string | null;
    tipo: string;
    duracion_min: number | null;
    url: string | null;
    contenido_md: string | null;
  };
}

export default function RecursosScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<RecursoAsignado[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: vincs } = await supabase
      .from('vinculaciones')
      .select('id')
      .eq('paciente_id', user.id)
      .eq('estado', 'activa');

    if (!vincs || vincs.length === 0) {
      setItems([]);
      return;
    }
    const vincIds = vincs.map((v: { id: string }) => v.id);

    const { data } = await supabase
      .from('recursos_asignados')
      .select(`
        id, mensaje_terapeuta, visto_at, creado_at,
        contenido:contenido_educativo(id, titulo, descripcion, tipo, duracion_min, url, contenido_md)
      `)
      .in('vinculacion_id', vincIds)
      .order('creado_at', { ascending: false });

    setItems((data as RecursoAsignado[] | null) ?? []);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const abrir = async (r: RecursoAsignado) => {
    if (!r.visto_at) {
      await supabase
        .from('recursos_asignados')
        .update({ visto_at: new Date().toISOString() })
        .eq('id', r.id);
    }
    if (r.contenido.url) {
      Linking.openURL(r.contenido.url);
    }
  };

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
            <Text variant="h1">{esMX.paciente.resourcesTitle}</Text>
            <Text variant="bodyM" color="#5C6B5A">
              {esMX.paciente.resourcesSubtitle}
            </Text>
          </View>

          {items.length === 0 ? (
            <Card padding={5} variant="flat" style={styles.empty}>
              <Text variant="bodyM" color="#5C6B5A" align="center">
                Tu terapeuta puede compartirte aquí ejercicios y lecturas.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: spacing[3] }}>
              {items.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => abrir(r)}
                  style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                >
                  <Card padding={4} variant="flat">
                    <View style={styles.row}>
                      <Text variant="caption">{r.contenido.tipo.toUpperCase()}</Text>
                      {!r.visto_at && <View style={styles.unread} />}
                    </View>
                    <Text
                      variant="h3"
                      style={{ marginTop: spacing[2] }}
                    >
                      {r.contenido.titulo}
                    </Text>
                    {r.contenido.descripcion && (
                      <Text
                        variant="bodyM"
                        color="#5C6B5A"
                        style={{ marginTop: spacing[2] }}
                        numberOfLines={2}
                      >
                        {r.contenido.descripcion}
                      </Text>
                    )}
                    {r.mensaje_terapeuta && (
                      <View style={styles.terapeutaNote}>
                        <Text
                          variant="muted"
                          style={{ fontFamily: fontFamily.serifLightItalic }}
                        >
                          "{r.mensaje_terapeuta}"
                        </Text>
                      </View>
                    )}
                    {r.contenido.duracion_min && (
                      <Text variant="muted" style={{ marginTop: spacing[2] }}>
                        {r.contenido.duracion_min} min
                      </Text>
                    )}
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

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[20] },
  header: { gap: spacing[2], marginTop: spacing[2] },
  empty: { alignItems: 'center', paddingVertical: spacing[10] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.noemaSage },
  terapeutaNote: {
    marginTop: spacing[3],
    paddingLeft: spacing[3],
    borderLeftWidth: 2,
    borderLeftColor: colors.noemaSage,
  },
});
