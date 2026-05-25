/**
 * Lista pública de líneas de ayuda según país.
 * Lee directamente de `public.recursos_emergencia` (visible para authenticated).
 */
import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

interface Recurso {
  id: string;
  nombre: string;
  telefono: string;
  descripcion: string | null;
  horario: string | null;
  url: string | null;
  tipo: string;
}

export default function RecursosEmergenciaScreen() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);

  useEffect(() => {
    supabase
      .from('recursos_emergencia')
      .select('id, nombre, telefono, descripcion, horario, url, tipo')
      .eq('pais', 'MX')
      .eq('activo', true)
      .order('orden')
      .then(({ data }) => {
        if (data) setRecursos(data as Recurso[]);
      });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen
        options={{
          title: 'Recursos de ayuda',
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text variant="bodyM" color="#5C6B5A">
            Líneas profesionales de ayuda en crisis. Disponibles para llamar
            directamente.
          </Text>

          {recursos.map((r) => (
            <Pressable key={r.id} onPress={() => Linking.openURL(`tel:${r.telefono}`)}>
              <Card padding={4} variant="flat">
                <Text variant="h3" style={{ marginBottom: spacing[1] }}>
                  {r.nombre}
                </Text>
                <Text style={styles.tel}>{r.telefono}</Text>
                {r.descripcion && (
                  <Text variant="muted" style={{ marginTop: spacing[2] }}>
                    {r.descripcion}
                  </Text>
                )}
                {r.horario && (
                  <Text variant="caption" style={{ marginTop: spacing[2] }}>
                    {r.horario}
                  </Text>
                )}
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[4] },
  tel: {
    fontFamily: fontFamily.serifMedium,
    fontSize: 22,
    color: colors.noemaSage,
  },
});
