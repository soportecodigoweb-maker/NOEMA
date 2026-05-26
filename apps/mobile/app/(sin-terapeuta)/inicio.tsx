/**
 * Inicio del modo sin_terapeuta — explora contenido y considera buscar terapeuta.
 *
 * Estructura:
 *   1. Saludo + intención
 *   2. CTA "Encuentra un terapeuta" (futuro link al directorio web)
 *   3. Contenido destacado (publicado + destacado = true)
 *   4. Categorías rápidas
 */
import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView, View, StyleSheet, Pressable, useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Contenido {
  id: string;
  titulo: string;
  subtitulo: string | null;
  tipo: string;
  duracion_min: number | null;
  miniatura_url: string | null;
  categoria_key: string | null;
}

interface Categoria {
  key: string;
  nombre: string;
  descripcion: string | null;
}

export default function SinTerapeutaInicio() {
  const router = useRouter();
  const { profile } = useAuth();
  const [destacados, setDestacados] = useState<Contenido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const load = useCallback(async () => {
    const [{ data: dest }, { data: cats }] = await Promise.all([
      supabase
        .from('contenido_educativo')
        .select('id, titulo, subtitulo, tipo, duracion_min, miniatura_url, categoria_key')
        .eq('publicado', true)
        .eq('destacado', true)
        .limit(6),
      supabase
        .from('categorias')
        .select('key, nombre, descripcion')
        .eq('activa', true)
        .order('orden'),
    ]);
    setDestacados((dest as Contenido[] | null) ?? []);
    setCategorias((cats as Categoria[] | null) ?? []);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const nombreCorto = profile?.nombre?.split(' ')[0] ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaView edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Saludo */}
          <View style={styles.header}>
            <Text variant="h1">
              Hola{nombreCorto ? `, ${nombreCorto}` : ''}
            </Text>
            <Text variant="bodyL" color="#5C6B5A">
              Explora contenido para tu bienestar. Cuando quieras, encuentra a tu terapeuta.
            </Text>
          </View>

          {/* CTA buscar terapeuta */}
          <Card padding={5} style={styles.ctaCard}>
            <Text variant="caption" color={colors.bone}>NOEMA · Directorio</Text>
            <Text
              variant="h2"
              color={colors.bone}
              style={{ marginTop: spacing[2], marginBottom: spacing[1] }}
            >
              Encuentra a tu terapeuta
            </Text>
            <Text variant="bodyM" color="rgba(250, 247, 241, 0.78)">
              Profesionales verificados, con enfoques que se adaptan a ti.
            </Text>
            <View style={{ marginTop: spacing[4] }}>
              <Button
                variant="inverse"
                size="md"
                onPress={() => router.push('/(sin-terapeuta)/perfil')}
              >
                Ver directorio
              </Button>
            </View>
          </Card>

          {/* Destacados */}
          {destacados.length > 0 && (
            <View>
              <Text variant="caption" style={{ marginBottom: spacing[3] }}>
                Destacado
              </Text>
              <View style={{ gap: spacing[3] }}>
                {destacados.slice(0, 3).map((c) => (
                  <ContenidoCard
                    key={c.id}
                    contenido={c}
                    onPress={() => router.push(`/(sin-terapeuta)/contenido/${c.id}`)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Categorías */}
          {categorias.length > 0 && (
            <View>
              <Text variant="caption" style={{ marginBottom: spacing[3] }}>
                Categorías
              </Text>
              <View style={styles.categoriaGrid}>
                {categorias.slice(0, 6).map((c) => (
                  <Pressable
                    key={c.key}
                    onPress={() => router.push({
                      pathname: '/(sin-terapeuta)/biblioteca',
                      params: { categoria: c.key },
                    })}
                    style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                  >
                    <Card padding={3} variant="flat" style={styles.categoriaCard}>
                      <Text
                        variant="bodyM"
                        style={{ fontFamily: fontFamily.serifMedium, fontSize: 16 }}
                      >
                        {c.nombre}
                      </Text>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: spacing[20] }} />
        </ScrollView>
      </SafeAreaView>
      <CrisisButton variant="floating" />
    </View>
  );
}

function ContenidoCard({
  contenido,
  onPress,
}: {
  contenido: Contenido;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
      <Card padding={4} variant="flat">
        <View style={styles.row}>
          <Text variant="caption">{contenido.tipo.toUpperCase()}</Text>
          {contenido.duracion_min && (
            <Text variant="caption" color="#5C6B5A">{contenido.duracion_min} min</Text>
          )}
        </View>
        <Text variant="h3" style={{ marginTop: spacing[2] }}>{contenido.titulo}</Text>
        {contenido.subtitulo && (
          <Text variant="bodyM" color="#5C6B5A" style={{ marginTop: spacing[1] }}>
            {contenido.subtitulo}
          </Text>
        )}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5] },
  header: { gap: spacing[2], marginTop: spacing[2] },
  ctaCard: { backgroundColor: colors.noemaDeep },
  categoriaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  categoriaCard: { minWidth: 140 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
