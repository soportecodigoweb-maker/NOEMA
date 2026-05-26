/**
 * Biblioteca completa de contenido educativo.
 * Filtros: categoría (acepta param ?categoria=key), tipo, búsqueda.
 */
import { useState, useCallback, useMemo } from 'react';
import {
  ScrollView, View, StyleSheet, Pressable, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily, radii } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

interface Contenido {
  id: string;
  titulo: string;
  subtitulo: string | null;
  tipo: string;
  duracion_min: number | null;
  categoria_key: string | null;
}

interface Categoria {
  key: string;
  nombre: string;
}

export default function BibliotecaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoria?: string }>();
  const [categoriaSel, setCategoriaSel] = useState<string | null>(params.categoria ?? null);
  const [search, setSearch] = useState('');
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const load = useCallback(async () => {
    const [{ data: cats }, { data: cont }] = await Promise.all([
      supabase.from('categorias').select('key, nombre').eq('activa', true).order('orden'),
      supabase
        .from('contenido_educativo')
        .select('id, titulo, subtitulo, tipo, duracion_min, categoria_key')
        .eq('publicado', true)
        .order('destacado', { ascending: false })
        .order('titulo'),
    ]);
    setCategorias((cats as Categoria[] | null) ?? []);
    setContenidos((cont as Contenido[] | null) ?? []);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtrados = useMemo(() => {
    return contenidos.filter((c) => {
      if (categoriaSel && c.categoria_key !== categoriaSel) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.titulo.toLowerCase().includes(q) ||
          (c.subtitulo?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [contenidos, categoriaSel, search]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaView edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0]}
        >
          {/* Header sticky */}
          <View style={styles.headerWrap}>
            <View style={styles.header}>
              <Text variant="h1">Biblioteca</Text>
              <Text variant="bodyM" color="#5C6B5A">
                Contenido para tu bienestar emocional.
              </Text>
            </View>
            <View style={styles.searchWrap}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar tema, autor, palabra…"
                placeholderTextColor="rgba(42, 51, 40, 0.35)"
                style={styles.searchInput}
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <Pressable
                onPress={() => setCategoriaSel(null)}
                style={[styles.chip, !categoriaSel && styles.chipActive]}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.sansMedium,
                    fontSize: 13,
                    color: !categoriaSel ? colors.bone : colors.ink,
                  }}
                >
                  Todo
                </Text>
              </Pressable>
              {categorias.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={() => setCategoriaSel(c.key)}
                  style={[
                    styles.chip,
                    categoriaSel === c.key && styles.chipActive,
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: fontFamily.sansMedium,
                      fontSize: 13,
                      color: categoriaSel === c.key ? colors.bone : colors.ink,
                    }}
                  >
                    {c.nombre}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Lista */}
          {filtrados.length === 0 ? (
            <Card padding={5} variant="flat" style={styles.empty}>
              <Text variant="bodyM" color="#5C6B5A" align="center">
                Sin resultados para tu búsqueda.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: spacing[3], marginTop: spacing[4] }}>
              {filtrados.map((c) => (
                <Pressable
                  key={c.id}
                  onPress={() => router.push(`/(sin-terapeuta)/contenido/${c.id}`)}
                  style={({ pressed }) => [pressed && { opacity: 0.85 }]}
                >
                  <Card padding={4} variant="flat">
                    <View style={styles.row}>
                      <Text variant="caption">{c.tipo.toUpperCase()}</Text>
                      {c.duracion_min && (
                        <Text variant="caption" color="#5C6B5A">{c.duracion_min} min</Text>
                      )}
                    </View>
                    <Text variant="h3" style={{ marginTop: spacing[2] }}>{c.titulo}</Text>
                    {c.subtitulo && (
                      <Text variant="bodyM" color="#5C6B5A" style={{ marginTop: spacing[1] }}>
                        {c.subtitulo}
                      </Text>
                    )}
                  </Card>
                </Pressable>
              ))}
            </View>
          )}

          <View style={{ height: spacing[20] }} />
        </ScrollView>
      </SafeAreaView>
      <CrisisButton variant="floating" />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing[5], paddingBottom: spacing[10] },
  headerWrap: { backgroundColor: colors.paper, paddingTop: spacing[2], paddingBottom: spacing[2], gap: spacing[3] },
  header: { gap: spacing[2] },
  searchWrap: {},
  searchInput: {
    backgroundColor: colors.bone,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 59, 46, 0.10)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontFamily: fontFamily.sansRegular,
    fontSize: 15,
    color: colors.ink,
  },
  chipsRow: { gap: spacing[2], paddingVertical: spacing[1] },
  chip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: 'rgba(46, 59, 46, 0.10)',
  },
  chipActive: { backgroundColor: colors.noemaDeep, borderColor: colors.noemaDeep },
  empty: { alignItems: 'center', paddingVertical: spacing[10], marginTop: spacing[4] },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
