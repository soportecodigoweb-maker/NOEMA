/**
 * Nueva entrada de diario.
 * Form simple: título (opcional), contenido (multiline), privacidad.
 */
import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

type Privacidad = 'privado' | 'compartido' | 'marcado_sesion';

const opciones: Array<{ key: Privacidad; label: string; hint: string }> = [
  { key: 'privado', label: 'Privado', hint: 'Solo tú lo ves' },
  { key: 'compartido', label: 'Compartir con terapeuta', hint: 'Lo verá en su panel' },
  { key: 'marcado_sesion', label: 'Marcar para sesión', hint: 'Destacado en tu próxima consulta' },
];

export default function NuevaEntradaDiarioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [privacidad, setPrivacidad] = useState<Privacidad>('privado');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!user || !contenido.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('diario_entradas').insert({
        paciente_id: user.id,
        titulo: titulo.trim() || null,
        contenido: contenido.trim(),
        privacidad,
      });
      if (insertError) throw insertError;
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
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.cancel}>Cancelar</Text>
            </Pressable>
            <Text variant="h3">Nueva entrada</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <Input
              placeholder="Título (opcional)"
              value={titulo}
              onChangeText={setTitulo}
              maxLength={120}
              style={styles.titleInput}
            />

            <View style={styles.contenidoBox}>
              <Input
                placeholder="¿Qué necesitas escribir hoy? Sin filtro, sin orden, como salga."
                value={contenido}
                onChangeText={setContenido}
                multiline
                maxLength={5000}
                style={{ minHeight: 300 }}
              />
            </View>

            <View style={styles.privacyBlock}>
              <Text variant="caption" style={{ marginBottom: spacing[2] }}>
                Privacidad
              </Text>
              <View style={{ gap: spacing[2] }}>
                {opciones.map((o) => {
                  const selected = privacidad === o.key;
                  return (
                    <Pressable key={o.key} onPress={() => setPrivacidad(o.key)}>
                      <Card
                        padding={3}
                        variant="flat"
                        style={[selected && styles.selectedCard]}
                      >
                        <Text
                          variant="bodyM"
                          style={{ fontFamily: fontFamily.sansMedium }}
                        >
                          {o.label}
                        </Text>
                        <Text variant="muted">{o.hint}</Text>
                      </Card>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {error && (
              <Text variant="muted" color="#B85450">
                {error}
              </Text>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={guardar}
              loading={saving}
              disabled={!contenido.trim()}
            >
              Guardar entrada
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[3],
  },
  cancel: { fontFamily: fontFamily.sansMedium, fontSize: 14, color: '#5C6B5A' },
  scroll: { padding: spacing[5], gap: spacing[4], paddingBottom: spacing[8] },
  titleInput: { fontSize: 18, fontFamily: fontFamily.serifMedium },
  contenidoBox: {},
  privacyBlock: { marginTop: spacing[3] },
  selectedCard: { borderColor: colors.noemaSage, borderWidth: 2 },
  footer: {
    padding: spacing[5],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 59, 46, 0.08)',
  },
});
