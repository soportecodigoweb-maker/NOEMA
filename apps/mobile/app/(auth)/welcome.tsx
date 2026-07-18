/**
 * Welcome screen — versión simplificada para diagnóstico.
 */
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.wordmark}>NOEMA</Text>
        <Text style={styles.tagline}>Tu proceso continúa acompañado.</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={styles.btnPrimary}
          onPress={() => router.push('/(auth)/signup')}
        >
          <Text style={styles.btnPrimaryText}>Crear cuenta</Text>
        </Pressable>

        <Pressable
          style={styles.btnSecondary}
          onPress={() => router.push('/(auth)/signin')}
        >
          <Text style={styles.btnSecondaryText}>Inicia sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#3D4D3E',
    padding: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  wordmark: {
    fontSize: 44,
    color: '#FAF7F1',
    letterSpacing: 14,
    fontWeight: '500',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(250, 247, 241, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    paddingBottom: 24,
    gap: 16,
  },
  btnPrimary: {
    backgroundColor: '#FAF7F1',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#2A3328',
    fontSize: 16,
    fontWeight: '500',
  },
  btnSecondary: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: 'rgba(250, 247, 241, 0.75)',
    fontSize: 14,
  },
});
