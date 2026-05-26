/**
 * Detalle de tarea — el paciente registra una respuesta (cómo le fue).
 */
import { useState, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { colors, spacing, fontFamily, radii } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  contenido_md: string | null;
  fecha_limite: string | null;
  estado: string;
}

export default function DetalleTareaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [tarea, setTarea] = useState<Tarea | null>(null);
  const [textoLibre, setTextoLibre] = useState('');
  const [dificultad, setDificultad] = useState<number>(3);
  const [compartir, setCompartir] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('tareas')
        .select('id, titulo, descripcion, contenido_md, fecha_limite, estado')
        .eq('id', id!)
        .maybeSingle();
      setTarea(data as Tarea | null);
    })();
  }, [id]);

  const enviar = async () => {
    if (!user || !tarea) return;
    setError(null);
    setSaving(true);
    try {
      // Insertar respuesta
      const { error: rErr } = await supabase.from('tarea_respuestas').insert({
        tarea_id: tarea.id,
        paciente_id: user.id,
        texto_libre: textoLibre || null,
        dificultad_percibida: dificultad,
        compartir_terapeuta: compartir,
      });
      if (rErr) throw rErr;

      // Marcar tarea como en_progreso si era pendiente
      if (tarea.estado === 'pendiente') {
        await supabase
          .from('tareas')
          .update({ estado: 'en_progreso' })
          .eq('id', tarea.id);
      }
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.back}>‹ Tareas</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {!tarea ? (
              <Text variant="muted">Cargando…</Text>
            ) : (
              <>
                <Text variant="caption">Tarea</Text>
                <Text variant="h1" style={{ marginTop: spacing[1] }}>
                  {tarea.titulo}
                </Text>

                {tarea.descripcion && (
                  <Text variant="bodyL" style={{ marginTop: spacing[3], lineHeight: 26 }}>
                    {tarea.descripcion}
                  </Text>
                )}

                {tarea.contenido_md && (
                  <Card padding={4} variant="flat" style={{ marginTop: spacing[4] }}>
                    <Text variant="bodyM" color="#5C6B5A">
                      {tarea.contenido_md}
                    </Text>
                  </Card>
                )}

                <View style={{ marginTop: spacing[6], gap: spacing[3] }}>
                  <Text variant="h3">¿Cómo te fue?</Text>
                  <Input
                    multiline
                    placeholder="Cuenta cómo te sentiste haciéndola, qué notaste…"
                    value={textoLibre}
                    onChangeText={setTextoLibre}
                    maxLength={1000}
                    style={{ minHeight: 120 }}
                  />
                </View>

                <View style={{ marginTop: spacing[5] }}>
                  <Text variant="h3" style={{ marginBottom: spacing[2] }}>
                    Dificultad
                  </Text>
                  <Text variant="muted" style={{ marginBottom: spacing[3] }}>
                    1 fácil · 5 muy difícil
                  </Text>
                  <View style={styles.scaleRow}>
                    {[1, 2, 3, 4, 5].map((n) => {
                      const selected = dificultad === n;
                      return (
                        <Pressable
                          key={n}
                          onPress={() => setDificultad(n)}
                          style={[styles.scaleChip, selected && styles.scaleChipSelected]}
                        >
                          <Text
                            style={{
                              fontFamily: fontFamily.serifMedium,
                              fontSize: 22,
                              color: selected ? colors.bone : colors.ink,
                            }}
                          >
                            {n}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <Pressable
                  onPress={() => setCompartir((v) => !v)}
                  style={styles.shareRow}
                >
                  <View
                    style={[styles.checkbox, compartir && styles.checkboxOn]}
                  >
                    {compartir && <Text style={{ color: colors.bone, fontSize: 14 }}>✓</Text>}
                  </View>
                  <Text variant="bodyM" style={{ flex: 1 }}>
                    Compartir esta respuesta con mi terapeuta
                  </Text>
                </Pressable>

                {error && (
                  <Text variant="muted" color="#B85450" style={{ marginTop: spacing[3] }}>
                    {error}
                  </Text>
                )}
              </>
            )}
          </ScrollView>

          {tarea && (
            <View style={styles.footer}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={enviar}
                loading={saving}
              >
                Guardar respuesta
              </Button>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  back: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#5C6B5A' },
  scroll: { padding: spacing[5], paddingBottom: spacing[8] },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[2] },
  scaleChip: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radii.md,
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: 'rgba(46, 59, 46, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleChipSelected: { backgroundColor: colors.noemaSage, borderColor: colors.noemaSage },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[5],
    paddingVertical: spacing[2],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(46, 59, 46, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.noemaSage, borderColor: colors.noemaSage },
  footer: {
    padding: spacing[5],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 59, 46, 0.08)',
  },
});
