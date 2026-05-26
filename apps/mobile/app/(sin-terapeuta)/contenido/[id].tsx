/**
 * Detalle de un contenido educativo.
 * Permite marcar como favorito + reproducir/abrir URL.
 */
import { useEffect, useState } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable, Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Contenido {
  id: string;
  titulo: string;
  subtitulo: string | null;
  descripcion: string | null;
  tipo: string;
  recurso_url: string | null;
  duracion_min: number | null;
  paginas: number | null;
  autor_nombre: string | null;
}

export default function ContenidoDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [contenido, setContenido] = useState<Contenido | null>(null);
  const [esFavorito, setEsFavorito] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const [{ data }, { data: fav }] = await Promise.all([
        supabase
          .from('contenido_educativo')
          .select('id, titulo, subtitulo, descripcion, tipo, recurso_url, duracion_min, paginas, autor_nombre')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('contenido_favoritos')
          .select('contenido_id')
          .eq('usuario_id', user.id)
          .eq('contenido_id', id)
          .maybeSingle(),
      ]);
      setContenido(data as Contenido | null);
      setEsFavorito(!!fav);

      // Registrar progreso de "visto"
      if (data) {
        await supabase.from('contenido_progreso').upsert({
          usuario_id: user.id,
          contenido_id: id,
          visto_at: new Date().toISOString(),
          completado: false,
        }, { onConflict: 'usuario_id,contenido_id' });
      }
    })();
  }, [id, user]);

  const toggleFavorito = async () => {
    if (!user || !id) return;
    if (esFavorito) {
      await supabase
        .from('contenido_favoritos')
        .delete()
        .eq('usuario_id', user.id)
        .eq('contenido_id', id);
      setEsFavorito(false);
    } else {
      await supabase.from('contenido_favoritos').insert({
        usuario_id: user.id,
        contenido_id: id,
      });
      setEsFavorito(true);
    }
  };

  const abrirRecurso = async () => {
    if (!contenido?.recurso_url) return;
    if (user) {
      await supabase.from('contenido_progreso').upsert({
        usuario_id: user.id,
        contenido_id: contenido.id,
        completado: true,
        completado_at: new Date().toISOString(),
      }, { onConflict: 'usuario_id,contenido_id' });
    }
    Linking.openURL(contenido.recurso_url);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.back}>‹ Atrás</Text>
            </Pressable>
            {contenido && (
              <Pressable onPress={toggleFavorito} hitSlop={12}>
                <Text style={[styles.fav, esFavorito && { color: '#B85450' }]}>
                  {esFavorito ? '♥ Guardado' : '♡ Guardar'}
                </Text>
              </Pressable>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {!contenido ? (
              <Text variant="muted">Cargando…</Text>
            ) : (
              <>
                <Text variant="caption">
                  {contenido.tipo.toUpperCase()}
                  {contenido.duracion_min && ` · ${contenido.duracion_min} min`}
                  {contenido.paginas && ` · ${contenido.paginas} págs`}
                </Text>
                <Text variant="h1" style={{ marginTop: spacing[2] }}>
                  {contenido.titulo}
                </Text>
                {contenido.subtitulo && (
                  <Text
                    variant="bodyL"
                    color="#5C6B5A"
                    style={{ marginTop: spacing[2] }}
                  >
                    {contenido.subtitulo}
                  </Text>
                )}
                {contenido.autor_nombre && (
                  <Text variant="muted" style={{ marginTop: spacing[3] }}>
                    Por {contenido.autor_nombre}
                  </Text>
                )}

                {contenido.descripcion && (
                  <Card padding={4} variant="flat" style={{ marginTop: spacing[5] }}>
                    <Text variant="bodyL" style={{ lineHeight: 26 }}>
                      {contenido.descripcion}
                    </Text>
                  </Card>
                )}

                {contenido.recurso_url && (
                  <View style={{ marginTop: spacing[6] }}>
                    <Button variant="primary" size="lg" fullWidth onPress={abrirRecurso}>
                      {contenido.tipo === 'video' || contenido.tipo === 'audio'
                        ? 'Reproducir'
                        : 'Abrir contenido'}
                    </Button>
                  </View>
                )}

                <View style={{ height: spacing[20] }} />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
        <CrisisButton variant="floating" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  back: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#5C6B5A' },
  fav: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#5C6B5A' },
  scroll: { padding: spacing[5], paddingBottom: spacing[10] },
});
