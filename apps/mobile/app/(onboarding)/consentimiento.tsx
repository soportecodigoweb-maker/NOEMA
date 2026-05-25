/**
 * Onboarding paso 2 — consentimiento informado.
 *
 * Antes de activar la vinculación con el terapeuta, el paciente debe leer y
 * aceptar el consentimiento informado. Esto se registra en `consentimientos`
 * (audit) y en `vinculaciones.consentimiento_aceptado_at`.
 *
 * REGLAS CRÍTICAS (BIBLIA §11, §12):
 *   - Privacidad como gesto, no como casilla: explicar claramente qué ve el terapeuta.
 *   - Crisis: dejar claro que la app NO sustituye atención de emergencia.
 *   - Decisión del paciente: notificar al terapeuta en crisis es OPT-IN, no default.
 */
import { useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { colors, spacing, radii, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

const VERSION_CONSENTIMIENTO = '2026-05-v1';

const puntos: Array<{ titulo: string; descripcion: string }> = [
  {
    titulo: 'Tu información es tuya',
    descripcion:
      'Tu terapeuta solo verá lo que tú decidas compartir explícitamente. Lo marcado como "privado" no llega a su panel.',
  },
  {
    titulo: 'NOEMA no es terapia',
    descripcion:
      'Esta app no sustituye la atención profesional. Tampoco las consultas en persona ni los servicios de emergencia.',
  },
  {
    titulo: 'Puedes pausar o salir',
    descripcion:
      'En cualquier momento puedes pausar la vinculación o cerrar tu cuenta. Tu información se respeta como tú decidas.',
  },
  {
    titulo: 'En crisis: ayuda real',
    descripcion:
      'Si vives una crisis, la app te orienta para contactar emergencias o personas de confianza. No es un canal de atención inmediata.',
  },
];

export default function ConsentimientoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ vinculacionId?: string }>();
  const { profile } = useAuth();
  const [aceptado, setAceptado] = useState(false);
  const [crisisOptIn, setCrisisOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aceptarYContinuar = async () => {
    if (!profile || !params.vinculacionId) return;
    setError(null);
    setLoading(true);
    try {
      // 1. Registrar consentimiento
      const { error: consentError } = await supabase.from('consentimientos').insert({
        profile_id: profile.id,
        tipo: 'consentimiento_informado',
        version: VERSION_CONSENTIMIENTO,
        aceptado: true,
      });
      if (consentError) throw consentError;

      // 2. Activar vinculación
      const { error: vincError } = await supabase
        .from('vinculaciones')
        .update({
          paciente_id: profile.id,
          estado: 'activa',
          consentimiento_aceptado_at: new Date().toISOString(),
          version_consentimiento: VERSION_CONSENTIMIENTO,
          notificar_crisis_terapeuta: crisisOptIn,
          fecha_inicio: new Date().toISOString(),
        })
        .eq('id', params.vinculacionId);
      if (vincError) throw vincError;

      // 3. Marcar onboarding completo
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ rol: 'paciente', onboarding_completo: true })
        .eq('id', profile.id);
      if (profileError) throw profileError;

      router.replace('/(paciente)/inicio');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos activar la vinculación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleBlock}>
          <Text variant="h1">Antes de empezar</Text>
          <Text variant="bodyM" color="#5C6B5A">
            Lee esto con calma. Es importante para tu proceso.
          </Text>
        </View>

        <View style={{ gap: spacing[3] }}>
          {puntos.map((p, i) => (
            <Card key={i} padding={4} variant="flat">
              <Text variant="h3" style={{ marginBottom: spacing[1] }}>
                {p.titulo}
              </Text>
              <Text variant="bodyM" color="#5C6B5A">
                {p.descripcion}
              </Text>
            </Card>
          ))}
        </View>

        {/* Opt-in: notificar al terapeuta en crisis */}
        <Pressable onPress={() => setCrisisOptIn((v) => !v)}>
          <Card padding={4} variant="flat" style={styles.optInCard}>
            <View style={styles.optInRow}>
              <View style={[styles.checkbox, crisisOptIn && styles.checkboxChecked]}>
                {crisisOptIn ? <Text style={styles.checkmark}>✓</Text> : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyM" style={{ fontFamily: fontFamily.sansMedium }}>
                  Si activo el módulo de crisis, avisar a mi terapeuta
                </Text>
                <Text variant="muted" style={{ marginTop: spacing[1] }}>
                  Solo si tú lo activas. Puedes cambiarlo después.
                </Text>
              </View>
            </View>
          </Card>
        </Pressable>

        {/* Checkbox principal */}
        <Pressable onPress={() => setAceptado((v) => !v)} style={styles.acceptRow}>
          <View style={[styles.checkbox, aceptado && styles.checkboxChecked]}>
            {aceptado ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
          <Text variant="bodyM" style={{ flex: 1, fontFamily: fontFamily.sansMedium }}>
            Leí y acepto el consentimiento informado.
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
          onPress={aceptarYContinuar}
          disabled={!aceptado}
        >
          Activar mi vinculación
        </Button>
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
  optInCard: {
    backgroundColor: 'rgba(199, 210, 189, 0.20)',
    borderColor: 'rgba(61, 77, 62, 0.20)',
  },
  optInRow: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  acceptRow: {
    flexDirection: 'row',
    gap: spacing[3],
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: 'rgba(46, 59, 46, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.noemaSage,
    borderColor: colors.noemaSage,
  },
  checkmark: {
    color: colors.bone,
    fontSize: 14,
    fontFamily: fontFamily.sansBold,
  },
});
