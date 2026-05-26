/**
 * Contenidos guardados por el usuario.
 */
import { useCallback, useState } from 'react';
import {
  ScrollView, View, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface FavoritoRow {
  contenido_id: string;
  creado_at: string;
  contenido: {
    id: string;
    titulo: string;
    subtitulo: string | null;
    tipo: string;
    duracion_min: number | null;
  } | null;
}

export default function FavoritosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = useState<FavoritoRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('contenido_favoritos')
      .select(`
        contenido_id, creado_at,
        contenido:contenido_educativo(id, titulo, subtitulo, tipo, duracion_min)
      `)
      .eq('usuario_id', user.id)
      .order('creado_at', { ascending: false });
    setItems((data as FavoritoRow[] | null) ?? []);
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
            <Text variant="h1">Tus favoritos</Text>
            <Text variant="bodyM" color="#5C6B5A">
              Lo que guardaste para volver.
            </Text>
          </View>

          {items.length === 0 ? (
            <Card padding={5} variant="flat" style={styles.empty}>
              <Text variant="bodyM" color="#5C6B5A" align="center">
                Aún no has guardado contenido. Toca ♡ en cualquier pieza para añadirla aquí.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: spacing[3] }}>
              {items.map((f) => {
                if (!f.contenido) return null;
                return (
                  <Pressable
                    key={f.contenido_id}
                    onPress={() => router.push(`/(sin-terapeuta)/contenido/${f.contenido_id}`)}
                    style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                  >
                    <Card padding={4} variant="flat">
                      <View style={styles.row}>
                        <Text variant="caption">{f.contenido.tipo.toUpperCase()}</Text>
                        {f.contenido.duracion_min && (
                          <Text variant="caption" color="#5C6B5A">
                            {f.contenido.duracion_min} min
                          </Text>
                        )}
                      </View>
                      <Text variant="h3" style={{ marginTop: spacing[2] }}>
                        {f.contenido.titulo}
                      </Text>
                      {f.contenido.subtitulo && (
                        <Text variant="bodyM" color="#5C6B5A" style={{ marginTop: spacing[1] }}>
                          {f.contenido.subtitulo}
                        </Text>
                      )}
                    </Card>
                  </Pressable>
                );
              })}
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
});
