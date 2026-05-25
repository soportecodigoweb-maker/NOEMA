/**
 * Pantalla del módulo de crisis (BIBLIA §11).
 *
 * Se llega aquí desde:
 *   - botón "Necesito ayuda ahora" omnipresente
 *   - detección automática de keywords en registros/diario (vendrá en Fase 6)
 *   - desde notificación push de emergencia
 *
 * REGLAS DE COPY (no improvisar):
 *   ✓ "Esta app no sustituye servicios de emergencia ni atención profesional urgente."
 *   ✓ "Si estás en peligro, llama a emergencias o contacta a una persona de confianza ahora."
 *   ✗ Nunca: "yo puedo ayudarte" / "cuéntame qué sientes, yo te ayudo a procesarlo"
 */
import { useRouter, Stack } from 'expo-router';
import {
  View,
  ScrollView,
  Linking,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radii, fontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { esMX } from '@noema/i18n';

interface ActionRow {
  key: string;
  label: string;
  description?: string;
  accent: 'emergency' | 'trusted' | 'therapist' | 'resources' | 'register';
  onPress: () => void;
}

export default function CrisisScreen() {
  const router = useRouter();

  // Número de emergencia por país (MX por default — Fase 5 lo hará dinámico
  // según el país declarado en el profile del paciente)
  const emergencyNumber = '911';

  const dial = (num: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Linking.openURL(`tel:${num}`);
  };

  const actions: ActionRow[] = [
    {
      key: 'emergency',
      label: esMX.crisis.callEmergency,
      description: `Marca al ${emergencyNumber}`,
      accent: 'emergency',
      onPress: () => dial(emergencyNumber),
    },
    {
      key: 'trusted',
      label: esMX.crisis.callTrustedContact,
      description: 'Tus contactos configurados',
      accent: 'trusted',
      onPress: () => router.push('/(paciente)/contactos-confianza' as never),
    },
    {
      key: 'therapist',
      label: esMX.crisis.notifyTherapist,
      description: 'Solo si lo activaste previamente',
      accent: 'therapist',
      onPress: () => router.push('/(paciente)/notificar-terapeuta' as never),
    },
    {
      key: 'resources',
      label: esMX.crisis.seeResources,
      description: 'Líneas de crisis disponibles',
      accent: 'resources',
      onPress: () => router.push('/(paciente)/recursos-emergencia' as never),
    },
    {
      key: 'register',
      label: esMX.crisis.registerFeelings,
      description: 'Si quieres dejarlo registrado',
      accent: 'register',
      onPress: () => router.push('/(paciente)/registro/nuevo' as never),
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'fade',
        }}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Cabecera */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>

          {/* Título + disclaimer */}
          <View style={styles.titleBlock}>
            <Text variant="h2" style={styles.title}>
              {esMX.crisis.title}
            </Text>
            <Text variant="bodyM" style={styles.disclaimer}>
              {esMX.crisis.disclaimer}
            </Text>
            <Text variant="bodyL" style={styles.body}>
              {esMX.crisis.body}
            </Text>
          </View>

          {/* Acciones */}
          <View style={styles.actions}>
            {actions.map((a) => (
              <Pressable
                key={a.key}
                onPress={a.onPress}
                style={({ pressed }) => [
                  styles.actionRow,
                  accentBorders[a.accent],
                  pressed && styles.actionRowPressed,
                ]}
              >
                <View style={styles.actionTextBlock}>
                  <Text variant="h3" style={styles.actionLabel}>
                    {a.label}
                  </Text>
                  {a.description ? (
                    <Text variant="muted" style={styles.actionDescription}>
                      {a.description}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>

          {/* Recordatorio de autolesión / daño */}
          <Card variant="flat" padding={4} style={styles.reminder}>
            <Text variant="bodyM" style={styles.reminderText}>
              {esMX.crisis.selfHarmReminder}
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const accentBorders = StyleSheet.create({
  emergency: { borderLeftColor: '#B85450', borderLeftWidth: 4 },
  trusted: { borderLeftColor: '#C7D2BD', borderLeftWidth: 4 },
  therapist: { borderLeftColor: '#B9C9CC', borderLeftWidth: 4 },
  resources: { borderLeftColor: '#F0C9AE', borderLeftWidth: 4 },
  register: { borderLeftColor: '#D9B98C', borderLeftWidth: 4 },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    padding: spacing[5],
    paddingBottom: spacing[10],
    gap: spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  closeBtn: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  closeText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    color: '#5C6B5A',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  titleBlock: {
    gap: spacing[3],
  },
  title: {
    color: colors.ink,
  },
  disclaimer: {
    color: '#5C6B5A',
    fontStyle: 'italic',
  },
  body: {
    color: colors.ink,
  },
  actions: {
    gap: spacing[3],
  },
  actionRow: {
    backgroundColor: colors.bone,
    borderRadius: radii.lg,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  actionRowPressed: {
    opacity: 0.85,
  },
  actionTextBlock: {
    flex: 1,
    gap: spacing[1],
  },
  actionLabel: {
    color: colors.ink,
  },
  actionDescription: {
    color: '#5C6B5A',
  },
  chevron: {
    fontFamily: fontFamily.serifLight,
    fontSize: 28,
    color: '#5C6B5A',
  },
  reminder: {
    backgroundColor: 'rgba(184, 84, 80, 0.06)',
    borderColor: 'rgba(184, 84, 80, 0.18)',
  },
  reminderText: {
    color: '#5A2826',
    textAlign: 'center',
  },
});
