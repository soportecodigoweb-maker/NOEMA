/**
 * Onboarding paso 1 — código de vinculación.
 *
 * El paciente introduce el código `NOEMA-XXXX` que le compartió su terapeuta.
 * Si no tiene código, puede saltar y entrar en modo `sin_terapeuta` (que
 * permite explorar contenido y buscar terapeuta más adelante).
 */
import { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function CodigoScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continuar = async () => {
    if (!profile) return;
    setError(null);
    setLoading(true);
    try {
      // Validar código existente y pendiente
      const { data: vinculacion, error: searchError } = await supabase
        .from('vinculaciones')
        .select('id, terapeuta_id, estado')
        .eq('codigo_invitacion', codigo.trim().toUpperCase())
        .eq('estado', 'pendiente')
        .maybeSingle();

      if (searchError) throw searchError;
      if (!vinculacion) {
        setError('Ese código no existe o ya fue usado.');
        return;
      }

      // Vincular: el paciente acepta. La activación final ocurre en consentimiento.
      router.push({
        pathname: '/(onboarding)/consentimiento',
        params: { vinculacionId: vinculacion.id },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos validar el código.');
    } finally {
      setLoading(false);
    }
  };

  const explorarSinTerapeuta = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({ rol: 'sin_terapeuta', onboarding_completo: true })
        .eq('id', profile.id);
      await refreshProfile();
      router.replace('/(sin-terapeuta)/inicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.titleBlock}>
            <Text variant="h1">Vincula tu cuenta</Text>
            <Text variant="bodyM" color="#5C6B5A">
              Si tu terapeuta te compartió un código, introdúcelo aquí.
            </Text>
          </View>

          <Input
            label="Código de vinculación"
            placeholder="NOEMA-XXXX"
            value={codigo}
            onChangeText={(t) => setCodigo(t.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            error={error ?? undefined}
            maxLength={10}
          />

          <View style={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={continuar}
              disabled={codigo.length < 8}
            >
              Vincular con mi terapeuta
            </Button>
            <Pressable
              onPress={explorarSinTerapeuta}
              style={styles.altRow}
              disabled={loading}
            >
              <Text style={styles.altText}>
                Aún no tengo terapeuta · <Text style={styles.altLink}>Explorar contenido</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { flexGrow: 1, padding: spacing[5], gap: spacing[6] },
  titleBlock: { gap: spacing[2], marginTop: spacing[6] },
  actions: { marginTop: 'auto', gap: spacing[4] },
  altRow: { alignItems: 'center', paddingVertical: spacing[3] },
  altText: { fontFamily: fontFamily.sansRegular, fontSize: 14, color: '#5C6B5A' },
  altLink: { fontFamily: fontFamily.sansMedium, color: colors.noemaSage },
});
