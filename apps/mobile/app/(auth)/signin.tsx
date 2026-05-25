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
import { colors, spacing, fontFamily } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { esMX } from '@noema/i18n';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // El AuthGate redirige al rol correcto automáticamente
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar sesión.');
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
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
            <Text style={styles.backText}>‹ Atrás</Text>
          </Pressable>

          <View style={styles.titleBlock}>
            <Text variant="h1" style={styles.title}>
              {esMX.auth.signInTitle}
            </Text>
            <Text variant="bodyM" color="#5C6B5A">
              Continúa tu proceso.
            </Text>
          </View>

          <View style={styles.fields}>
            <Input
              label={esMX.auth.emailLabel}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholder="tu@correo.com"
            />
            <Input
              label={esMX.auth.passwordLabel}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              textContentType="password"
              error={error ?? undefined}
            />
            <Pressable style={styles.forgotRow} onPress={() => {}}>
              <Text style={styles.forgotText}>{esMX.auth.forgotPassword}</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onPress={handleSubmit}
              disabled={!email || !password}
            >
              {esMX.auth.signInButton}
            </Button>
            <Pressable
              onPress={() => router.replace('/(auth)/signup')}
              style={styles.altRow}
            >
              <Text style={styles.altText}>{esMX.auth.noAccount}</Text>
            </Pressable>
          </View>
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
  titleBlock: {
    gap: spacing[2],
    marginTop: spacing[4],
  },
  title: { color: colors.ink },
  fields: {
    gap: spacing[4],
  },
  forgotRow: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 13,
    color: colors.noemaSage,
  },
  actions: {
    marginTop: 'auto',
    gap: spacing[4],
  },
  altRow: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  altText: {
    fontFamily: fontFamily.sansRegular,
    fontSize: 14,
    color: '#5C6B5A',
  },
});
