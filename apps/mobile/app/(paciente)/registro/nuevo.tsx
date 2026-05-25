/**
 * Registro emocional — flujo multi-paso.
 *
 * 4 pasos según mockup del manual:
 *   1. ¿Cómo te sientes hoy? — selección de emociones (chips con caritas)
 *   2. ¿Qué tan fuerte lo sientes? — escala 1-5
 *   3. ¿Qué pasó hoy? — textarea opcional + ¿qué necesito ahora?
 *   4. Privacidad: privado / compartido / marcado para sesión
 *
 * Al final se inserta en `public.registros_emocionales`.
 * El paciente puede cancelar en cualquier paso (sale a inicio).
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
import { colors, spacing, radii, fontFamily, emotionColors } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { FamiliaEmocional } from '@/queries/registros';
import { esMX } from '@noema/i18n';

// Catálogo abreviado — la lista completa vive en DB (emociones_catalogo)
// Esto es la primera fila visible: las 5 familias
const emocionesIniciales: Array<{
  key: string;
  familia: FamiliaEmocional;
  label: string;
}> = [
  { key: 'tranquilo', familia: 'tranquilo', label: 'Tranquilo' },
  { key: 'ansioso', familia: 'ansioso', label: 'Ansioso' },
  { key: 'triste', familia: 'triste', label: 'Triste' },
  { key: 'cansado', familia: 'cansado', label: 'Cansado' },
  { key: 'feliz', familia: 'feliz', label: 'Feliz' },
];

const necesidades = [
  { key: 'descansar', label: esMX.paciente.needsRest },
  { key: 'hablar', label: esMX.paciente.needsTalk },
  { key: 'tiempo', label: esMX.paciente.needsTime },
  { key: 'otra', label: esMX.paciente.needsOther },
];

const privacidades: Array<{
  key: 'privado' | 'compartido' | 'marcado_sesion';
  label: string;
  hint: string;
}> = [
  { key: 'privado', label: esMX.paciente.privacyPrivate, hint: 'Solo tú lo ves.' },
  { key: 'compartido', label: esMX.paciente.privacyShared, hint: 'Tu terapeuta podrá verlo.' },
  {
    key: 'marcado_sesion',
    label: esMX.paciente.privacyForSession,
    hint: 'Aparecerá destacado en tu próxima consulta.',
  },
];

type Step = 1 | 2 | 3 | 4;

export default function NuevoRegistroScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [emocion, setEmocion] = useState<string | null>(null);
  const [intensidad, setIntensidad] = useState<number>(3);
  const [descripcion, setDescripcion] = useState('');
  const [necesidad, setNecesidad] = useState<string | null>(null);
  const [privacidad, setPrivacidad] = useState<'privado' | 'compartido' | 'marcado_sesion'>('privado');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = () => setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  const prev = () => setStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const guardar = async () => {
    if (!user || !emocion) return;
    setError(null);
    setSaving(true);
    try {
      const { error: insertError } = await supabase.from('registros_emocionales').insert({
        paciente_id: user.id,
        emocion_principal_key: emocion,
        intensidad,
        descripcion: descripcion || null,
        necesidad,
        privacidad,
      });
      if (insertError) throw insertError;
      router.replace('/(paciente)/inicio');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  const canAdvance =
    (step === 1 && !!emocion) ||
    (step === 2 && intensidad >= 1) ||
    (step === 3 && true) || // contexto y necesidad son opcionales
    (step === 4 && true);

  return (
    <>
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header con close + progreso */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.closeText}>Cancelar</Text>
            </Pressable>
            <ProgressDots current={step} total={4} />
            <View style={{ width: 60 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 1 && (
              <StepEmocion
                emocion={emocion}
                onSelect={setEmocion}
              />
            )}
            {step === 2 && (
              <StepIntensidad value={intensidad} onChange={setIntensidad} />
            )}
            {step === 3 && (
              <StepContexto
                descripcion={descripcion}
                onDescripcion={setDescripcion}
                necesidad={necesidad}
                onNecesidad={setNecesidad}
              />
            )}
            {step === 4 && (
              <StepPrivacidad
                value={privacidad}
                onChange={setPrivacidad}
                error={error}
              />
            )}
          </ScrollView>

          {/* Footer con navegación */}
          <View style={styles.footer}>
            {step > 1 && (
              <Button variant="ghost" size="md" onPress={prev}>
                Atrás
              </Button>
            )}
            <View style={{ flex: 1 }} />
            {step < 4 ? (
              <Button variant="primary" size="lg" onPress={next} disabled={!canAdvance}>
                {esMX.common.continue}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onPress={guardar}
                loading={saving}
                disabled={!emocion}
              >
                {esMX.paciente.registerSave}
              </Button>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

// ----------------------------------------------------------------------------
// PASO 1: Emoción
// ----------------------------------------------------------------------------
function StepEmocion({
  emocion,
  onSelect,
}: {
  emocion: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={styles.stepBlock}>
      <View style={styles.stepHeader}>
        <Text variant="h2">{esMX.paciente.registerStepEmotion}</Text>
        <Text variant="bodyM" color="#5C6B5A">
          {esMX.paciente.registerStepEmotionHelp}
        </Text>
      </View>
      <View style={styles.emotionGrid}>
        {emocionesIniciales.map((e) => {
          const selected = emocion === e.key;
          return (
            <Pressable
              key={e.key}
              onPress={() => onSelect(e.key)}
              style={({ pressed }) => [
                styles.emotionChip,
                {
                  borderColor: selected ? emotionColors[e.familia] : 'rgba(46, 59, 46, 0.10)',
                  borderWidth: selected ? 2 : 1,
                },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View
                style={[
                  styles.emotionDot,
                  { backgroundColor: emotionColors[e.familia] },
                ]}
              />
              <Text variant="bodyM" style={{ fontFamily: fontFamily.sansMedium }}>
                {e.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------------
// PASO 2: Intensidad
// ----------------------------------------------------------------------------
function StepIntensidad({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.stepBlock}>
      <View style={styles.stepHeader}>
        <Text variant="h2">{esMX.paciente.registerStepIntensity}</Text>
        <Text variant="bodyM" color="#5C6B5A">
          1 es muy suave, 5 es muy intenso.
        </Text>
      </View>
      <View style={styles.scaleRow}>
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={({ pressed }) => [
                styles.scaleChip,
                selected && styles.scaleChipSelected,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text
                style={{
                  fontFamily: fontFamily.serifMedium,
                  fontSize: 24,
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
  );
}

// ----------------------------------------------------------------------------
// PASO 3: Contexto + necesidad
// ----------------------------------------------------------------------------
function StepContexto({
  descripcion,
  onDescripcion,
  necesidad,
  onNecesidad,
}: {
  descripcion: string;
  onDescripcion: (s: string) => void;
  necesidad: string | null;
  onNecesidad: (s: string) => void;
}) {
  return (
    <View style={styles.stepBlock}>
      <View style={styles.stepHeader}>
        <Text variant="h2">{esMX.paciente.registerStepContext}</Text>
        <Text variant="bodyM" color="#5C6B5A">
          {esMX.paciente.registerStepContextHelp}
        </Text>
      </View>
      <Input
        multiline
        placeholder="Si quieres, escribe lo que pasó hoy…"
        value={descripcion}
        onChangeText={onDescripcion}
        maxLength={500}
      />
      <View style={{ marginTop: spacing[5] }}>
        <Text variant="h3" style={{ marginBottom: spacing[2] }}>
          {esMX.paciente.registerStepNeeds}
        </Text>
        <Text variant="muted" style={{ marginBottom: spacing[3] }}>
          {esMX.paciente.registerStepNeedsHelp}
        </Text>
        <View style={styles.necesidadRow}>
          {necesidades.map((n) => {
            const selected = necesidad === n.key;
            return (
              <Pressable
                key={n.key}
                onPress={() => onNecesidad(n.key)}
                style={({ pressed }) => [
                  styles.necesidadChip,
                  selected && styles.necesidadChipSelected,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.sansMedium,
                    fontSize: 14,
                    color: selected ? colors.bone : colors.ink,
                  }}
                >
                  {n.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ----------------------------------------------------------------------------
// PASO 4: Privacidad
// ----------------------------------------------------------------------------
function StepPrivacidad({
  value,
  onChange,
  error,
}: {
  value: 'privado' | 'compartido' | 'marcado_sesion';
  onChange: (v: 'privado' | 'compartido' | 'marcado_sesion') => void;
  error: string | null;
}) {
  return (
    <View style={styles.stepBlock}>
      <View style={styles.stepHeader}>
        <Text variant="h2">¿Cómo quieres guardar este registro?</Text>
        <Text variant="bodyM" color="#5C6B5A">
          Tú decides qué comparte tu terapeuta. Puedes cambiarlo después.
        </Text>
      </View>
      <View style={{ gap: spacing[3] }}>
        {privacidades.map((p) => {
          const selected = value === p.key;
          return (
            <Pressable key={p.key} onPress={() => onChange(p.key)}>
              <Card
                padding={4}
                variant="flat"
                style={[
                  selected && {
                    borderColor: colors.noemaSage,
                    borderWidth: 2,
                  },
                ]}
              >
                <Text variant="h3" style={{ marginBottom: spacing[1] }}>
                  {p.label}
                </Text>
                <Text variant="muted">{p.hint}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
      {error && (
        <Text variant="muted" color="#B85450" style={{ marginTop: spacing[3] }}>
          {error}
        </Text>
      )}
    </View>
  );
}

// ----------------------------------------------------------------------------
// Header — puntos de progreso
// ----------------------------------------------------------------------------
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < current;
        return (
          <View
            key={i}
            style={[styles.dot, done && styles.dotDone]}
          />
        );
      })}
    </View>
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
  closeText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    color: '#5C6B5A',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(46, 59, 46, 0.15)',
  },
  dotDone: {
    backgroundColor: colors.noemaSage,
  },
  scroll: {
    padding: spacing[5],
    paddingBottom: spacing[6],
    gap: spacing[5],
  },
  stepBlock: { gap: spacing[5] },
  stepHeader: { gap: spacing[2] },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  emotionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.pill,
    backgroundColor: colors.bone,
  },
  emotionDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
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
  scaleChipSelected: {
    backgroundColor: colors.noemaSage,
    borderColor: colors.noemaSage,
  },
  necesidadRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  necesidadChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radii.pill,
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: 'rgba(46, 59, 46, 0.10)',
  },
  necesidadChipSelected: {
    backgroundColor: colors.noemaSage,
    borderColor: colors.noemaSage,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[5],
    paddingTop: spacing[3],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 59, 46, 0.08)',
    backgroundColor: colors.paper,
  },
});
