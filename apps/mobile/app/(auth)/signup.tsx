import { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { useAuth, type RolUsuario } from '@/hooks/useAuth';
import { esMX } from '@noema/i18n';

type Step = 'rol' | 'datos';

const roles: Array<{ key: RolUsuario; label: string; description: string }> = [
  {
    key: 'paciente',
    label: esMX.auth.rolePaciente,
    description: 'Tienes un terapeuta que te invitó con un código.',
  },
  {
    key: 'terapeuta',
    label: esMX.auth.roleTerapeuta,
    description: 'Vas a usar NOEMA con tus pacientes en consulta.',
  },
  {
    key: 'sin_terapeuta',
    label: esMX.auth.roleExplora,
    description: 'Quieres explorar contenido y buscar terapeuta.',
  },
];

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [step, setStep] = useState<Step>('rol');
  const [rol, setRol] = useState<RolUsuario | null>(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRol = (k: RolUsuario) => {
    setRol(k);
    setStep('datos');
  };

  const handleSubmit = async () => {
    if (!rol) return;
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password, rol, nombre.trim());
      // El AuthGate empuja al onboarding correcto
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos crear la cuenta.');
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => (step === 'datos' ? setStep('rol') : router.back())}
            style={styles.back}
            hitSlop={12}
          >
            <Text style={styles.backText}>‹ Atrás</Text>
          </Pressable>

          {step === 'rol' ? (
            <>
              <View style={styles.titleBlock}>
                <Text variant="h1" style={styles.title}>
                  {esMX.auth.selectRole}
                </Text>
                <Text variant="bodyM" color="#5C6B5A">
                  Esto nos ayuda a darte la experiencia adecuada.
                </Text>
              </View>

              <View style={styles.rolesList}>
                {roles.map((r) => (
                  <Pressable key={r.key} onPress={() => handleSelectRol(r.key)}>
                    <Card padding={4} style={styles.rolCard}>
                      <Text variant="h3" style={{ marginBottom: spacing[1] }}>
                        {r.label}
                      </Text>
                      <Text variant="bodyM" color="#5C6B5A">
                        {r.description}
                      </Text>
                    </Card>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.titleBlock}>
                <Text variant="h1" style={styles.title}>
                  {esMX.auth.signUpTitle}
                </Text>
                <Text variant="bodyM" color="#5C6B5A">
                  Crearemos tu espacio en NOEMA.
                </Text>
              </View>

              <View style={styles.fields}>
                <Input
                  label="¿Cómo te llamas?"
                  value={nombre}
                  onChangeText={setNombre}
                  autoCapitalize="words"
                  autoComplete="name"
                  placeholder="Tu nombre"
                />
                <Input
                  label={esMX.auth.emailLabel}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="tu@correo.com"
                />
                <Input
                  label={esMX.auth.passwordLabel}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  helper="Mínimo 8 caracteres."
                  error={error ?? undefined}
                />
              </View>

              <View style={styles.actions}>
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  onPress={handleSubmit}
                  disabled={!nombre || !email || password.length < 8}
                >
                  {esMX.auth.signUpButton}
                </Button>
                <Pressable
                  onPress={() => router.replace('/(auth)/signin')}
                  style={styles.altRow}
                >
                  <Text style={styles.altText}>{esMX.auth.haveAccount}</Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: {
    flexGrow: 1,
    padding: spacing[5],
    gap: spacing[6],
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing[2],
  },
  backText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    color: '#5C6B5A',
  },
  titleBlock: { gap: spacing[2], marginTop: spacing[4] },
  title: { color: colors.ink },
  rolesList: { gap: spacing[3] },
  rolCard: {},
  fields: { gap: spacing[4] },
  actions: { marginTop: 'auto', gap: spacing[4] },
  altRow: { alignItems: 'center', paddingVertical: spacing[2] },
  altText: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 14,
    color: '#5C6B5A',
  },
});
