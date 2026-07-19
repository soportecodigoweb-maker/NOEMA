/**
 * Onboarding paso 0 — Aviso de privacidad (requerimiento #9).
 *
 * Aparece al PRIMER USO de la app, antes de que el paciente introduzca el
 * código o explore. Enfatiza que él decide qué información comparte con su
 * terapeuta y cuál queda privada. Se registra en `consentimientos`.
 */
import { useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, spacing, radii, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { marcarAvisoAceptado } from '@/hooks/useAvisoPrivacidad';
import {
  AVISO_PRIVACIDAD_PACIENTE,
  VERSION_AVISO_PACIENTE,
  RESUMEN_ACEPTACION_PACIENTE,
} from '@/lib/aviso-privacidad';

export default function AvisoPrivacidadScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [aceptado, setAceptado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continuar = async () => {
    if (!profile) return;
    setError(null);
    setLoading(true);
    try {
      const { error: consentError } = await supabase.from('consentimientos').insert({
        profile_id: profile.id,
        tipo: 'aviso_privacidad',
        version: VERSION_AVISO_PACIENTE,
        aceptado: true,
        texto_resumen: RESUMEN_ACEPTACION_PACIENTE,
      });
      if (consentError) throw new Error(consentError.message);

      marcarAvisoAceptado(profile.id);

      // Continuar al flujo normal: si ya completó onboarding va a su app,
      // si no, al código de vinculación.
      if (profile.onboarding_completo) {
        router.replace(
          profile.rol === 'sin_terapeuta'
            ? '/(sin-terapeuta)/inicio'
            : '/(paciente)/inicio',
        );
      } else {
        router.replace('/(onboarding)/codigo');
      }
    } catch (e) {
      setError('No pudimos guardar tu aceptación. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleBlock}>
          <Text variant="h1">Tu información es tuya</Text>
          <Text variant="bodyM" color="#5C6B5A">
            Antes de empezar, queremos que tengas algo muy claro sobre tu privacidad.
          </Text>
        </View>

        <View style={{ gap: spacing[3] }}>
          {AVISO_PRIVACIDAD_PACIENTE.map((s, i) => (
            <Card key={i} padding={4} variant="flat">
              <Text variant="h3" style={{ marginBottom: spacing[1] }}>
                {s.titulo}
              </Text>
              <Text variant="bodyM" color="#5C6B5A">
                {s.cuerpo}
              </Text>
            </Card>
          ))}
        </View>

        <Pressable onPress={() => setAceptado((v) => !v)} style={styles.acceptRow}>
          <View style={[styles.checkbox, aceptado && styles.checkboxChecked]}>
            {aceptado ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text variant="bodyM" style={{ flex: 1, fontFamily: fontFamily.sansMedium }}>
            Leí y entiendo que yo decido qué información comparto y cuál queda privada.
          </Text>
        </Pressable>

        {error && (
          <Text variant="muted" color="#B85450">
            {error}
          </Text>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
          onPress={continuar}
          disabled={!aceptado}
        >
          Entiendo y continúo
        </Button>

        <Text variant="muted" style={{ textAlign: 'center' }}>
          Versión {VERSION_AVISO_PACIENTE}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: {
    flexGrow: 1,
    padding: spacing[5],
    paddingBottom: spacing[10],
    gap: spacing[5],
  },
  titleBlock: { gap: spacing[2], marginTop: spacing[2] },
  acceptRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(61, 77, 62, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.noemaSage,
    borderColor: colors.noemaSage,
  },
  checkmark: { color: colors.bone, fontSize: 15, fontFamily: fontFamily.sansBold },
});
