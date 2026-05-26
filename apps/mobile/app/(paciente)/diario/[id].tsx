/**
 * Detalle de una entrada de diario.
 * Permite cambiar privacidad y borrar.
 */
import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

type Privacidad = 'privado' | 'compartido' | 'marcado_sesion';

interface Entrada {
  id: string;
  fecha: string;
  titulo: string | null;
  contenido: string;
  privacidad: Privacidad;
  creado_at: string;
}

const opciones: Array<{ key: Privacidad; label: string }> = [
  { key: 'privado', label: 'Privado' },
  { key: 'compartido', label: 'Compartido' },
  { key: 'marcado_sesion', label: 'Para sesión' },
];

export default function DetalleEntradaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entrada, setEntrada] = useState<Entrada | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('diario_entradas')
        .select('id, fecha, titulo, contenido, privacidad, creado_at')
        .eq('id', id!)
        .maybeSingle();
      setEntrada(data as Entrada | null);
      setLoading(false);
    })();
  }, [id]);

  const cambiarPrivacidad = async (nueva: Privacidad) => {
    if (!entrada) return;
    await supabase
      .from('diario_entradas')
      .update({ privacidad: nueva })
      .eq('id', entrada.id);
    setEntrada({ ...entrada, privacidad: nueva });
  };

  const borrar = () => {
    Alert.alert(
      'Borrar entrada',
      'Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: async () => {
            await supabase.from('diario_entradas').delete().eq('id', id!);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Diario</Text>
          </Pressable>
          {entrada && (
            <Pressable onPress={borrar} hitSlop={12}>
              <Text style={[styles.back, { color: '#B85450' }]}>Borrar</Text>
            </Pressable>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {loading || !entrada ? (
            <Text variant="muted">Cargando…</Text>
          ) : (
            <>
              <Text variant="caption">{formatFecha(entrada.fecha)}</Text>
              {entrada.titulo && (
                <Text variant="h1" style={{ marginTop: spacing[2] }}>
                  {entrada.titulo}
                </Text>
              )}
              <Text
                variant="bodyL"
                style={{ marginTop: spacing[4], lineHeight: 28 }}
              >
                {entrada.contenido}
              </Text>

              <View style={styles.privacyBlock}>
                <Text variant="caption" style={{ marginBottom: spacing[3] }}>
                  Privacidad
                </Text>
                <View style={styles.chipsRow}>
                  {opciones.map((o) => {
                    const selected = entrada.privacidad === o.key;
                    return (
                      <Pressable
                        key={o.key}
                        onPress={() => cambiarPrivacidad(o.key)}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        <Text
                          style={{
                            fontFamily: fontFamily.sansMedium,
                            fontSize: 13,
                            color: selected ? colors.bone : colors.ink,
                          }}
                        >
                          {o.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function formatFecha(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00');
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  back: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#5C6B5A' },
  scroll: { padding: spacing[5], paddingBottom: spacing[10] },
  privacyBlock: { marginTop: spacing[8] },
  chipsRow: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: 'rgba(46, 59, 46, 0.10)',
  },
  chipSelected: {
    backgroundColor: colors.noemaSage,
    borderColor: colors.noemaSage,
  },
});
