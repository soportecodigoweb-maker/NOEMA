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

interface CampoRespuesta {
  key: string;
  label: string;
  type: 'text' | 'scale' | 'choice';
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  contenido_md: string | null;
  fecha_limite: string | null;
  estado: string;
  campos_respuesta: CampoRespuesta[] | null;
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
  // Respuestas a los campos dinámicos de la plantilla (#2)
  const [campos, setCampos] = useState<Record<string, string | number>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const setCampo = (key: string, value: string | number) =>
    setCampos((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('tareas')
        .select('id, titulo, descripcion, contenido_md, fecha_limite, estado, campos_respuesta')
        .eq('id', id!)
        .maybeSingle();
      setTarea(data as Tarea | null);

      // Traer última retroalimentación del terapeuta (si existe) (#4)
      if (user) {
        const { data: resp } = await supabase
          .from('tarea_respuestas')
          .select('retroalimentacion')
          .eq('tarea_id', id!)
          .eq('paciente_id', user.id)
          .not('retroalimentacion', 'is', null)
          .order('retroalimentacion_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (resp?.retroalimentacion) setFeedback(resp.retroalimentacion);
      }
    })();
  }, [id, user]);

  const enviar = async () => {
    if (!user || !tarea) return;
    setError(null);
    setSaving(true);
    try {
      // Insertar respuesta (incluye campos dinámicos de la plantilla)
      const { error: rErr } = await supabase.from('tarea_respuestas').insert({
        tarea_id: tarea.id,
        paciente_id: user.id,
        respuestas: campos,
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

                {/* Retroalimentación previa del terapeuta (#4) */}
                {feedback && (
                  <Card padding={4} style={{ marginTop: spacing[4], backgroundColor: 'rgba(199,210,189,0.25)' }}>
                    <Text variant="caption" color="#5C6B5A">Tu terapeuta comentó</Text>
                    <Text variant="bodyM" style={{ marginTop: spacing[1] }}>{feedback}</Text>
                  </Card>
                )}

                {/* Campos dinámicos de la plantilla (#2) */}
                {tarea.campos_respuesta && tarea.campos_respuesta.length > 0 && (
                  <View style={{ marginTop: spacing[6], gap: spacing[5] }}>
                    {tarea.campos_respuesta.map((campo) => (
                      <CampoDinamico
                        key={campo.key}
                        campo={campo}
                        valor={campos[campo.key]}
                        onChange={(v) => setCampo(campo.key, v)}
                      />
                    ))}
                  </View>
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

/** Renderiza un campo de respuesta según su tipo (#2). */
function CampoDinamico({
  campo,
  valor,
  onChange,
}: {
  campo: CampoRespuesta;
  valor: string | number | undefined;
  onChange: (v: string | number) => void;
}) {
  if (campo.type === 'scale') {
    const min = campo.min ?? 1;
    const max = campo.max ?? 5;
    // Para escalas amplias (0-100) usamos pasos; para 1-10 chips por número.
    const paso = max - min > 10 ? Math.round((max - min) / 5) : 1;
    const valores: number[] = [];
    for (let v = min; v <= max; v += paso) valores.push(v);
    return (
      <View style={{ gap: spacing[2] }}>
        <Text variant="h3">{campo.label}</Text>
        <View style={styles.scaleRow}>
          {valores.map((n) => {
            const sel = valor === n;
            return (
              <Pressable
                key={n}
                onPress={() => onChange(n)}
                style={[styles.scaleChip, sel && styles.scaleChipSelected]}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.serifMedium,
                    fontSize: 18,
                    color: sel ? colors.bone : colors.ink,
                  }}
                >
                  {n}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (campo.type === 'choice') {
    return (
      <View style={{ gap: spacing[2] }}>
        <Text variant="h3">{campo.label}</Text>
        <View style={{ gap: spacing[2] }}>
          {(campo.options ?? []).map((op) => {
            const sel = valor === op;
            return (
              <Pressable
                key={op}
                onPress={() => onChange(op)}
                style={[styles.choiceRow, sel && styles.choiceRowSelected]}
              >
                <View style={[styles.radio, sel && styles.radioOn]} />
                <Text variant="bodyM" style={{ flex: 1 }}>{op}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // type === 'text'
  return (
    <View style={{ gap: spacing[2] }}>
      <Text variant="h3">{campo.label}</Text>
      <Input
        multiline
        placeholder="Escribe aquí…"
        value={typeof valor === 'string' ? valor : ''}
        onChangeText={(t) => onChange(t)}
        maxLength={800}
        style={{ minHeight: 80 }}
      />
    </View>
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
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(46, 59, 46, 0.10)',
    backgroundColor: colors.bone,
  },
  choiceRowSelected: { borderColor: colors.noemaSage, backgroundColor: 'rgba(199,210,189,0.20)' },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(46, 59, 46, 0.30)',
  },
  radioOn: { borderColor: colors.noemaSage, backgroundColor: colors.noemaSage },
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
