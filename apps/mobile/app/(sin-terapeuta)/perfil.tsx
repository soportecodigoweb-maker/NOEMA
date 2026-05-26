/**
 * Perfil del usuario en modo sin_terapeuta.
 * Acciones: editar perfil, buscar terapeuta (link al directorio web), cerrar sesión.
 */
import { ScrollView, View, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// URL del directorio público (configurable por env)
const DIRECTORIO_URL = process.env.EXPO_PUBLIC_NOEMA_WEB_URL
  ? `${process.env.EXPO_PUBLIC_NOEMA_WEB_URL}/terapeutas`
  : 'https://noema.app/terapeutas';

export default function PerfilSinTerapeutaScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar tu sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
      ],
    );
  };

  const vincularTerapeuta = () => {
    Alert.alert(
      'Vincular con un terapeuta',
      '¿Ya tienes un código de tu terapeuta? Te llevamos a introducirlo.',
      [
        { text: 'Aún no', style: 'cancel' },
        {
          text: 'Sí, tengo código',
          onPress: async () => {
            // Cambiar rol a 'paciente' y mandar al onboarding
            if (!profile) return;
            await supabase
              .from('profiles')
              .update({ onboarding_completo: false })
              .eq('id', profile.id);
            router.replace('/(onboarding)/codigo');
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaView edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text variant="h1">Tu cuenta</Text>
            <Text variant="bodyM" color="#5C6B5A">
              {profile?.nombre} · {profile?.email}
            </Text>
          </View>

          <Card padding={5} style={styles.ctaCard}>
            <Text variant="caption" color={colors.bone}>
              ENCUENTRA A TU TERAPEUTA
            </Text>
            <Text
              variant="h3"
              color={colors.bone}
              style={{ marginTop: spacing[2] }}
            >
              Profesionales verificados
            </Text>
            <Text
              variant="bodyM"
              color="rgba(250, 247, 241, 0.78)"
              style={{ marginTop: spacing[2] }}
            >
              Explora el directorio en nuestra web. Cuando elijas a alguien y
              te dé un código, vuelve aquí.
            </Text>
            <View style={{ marginTop: spacing[4], gap: spacing[3] }}>
              <Button
                variant="inverse"
                size="md"
                onPress={() => Linking.openURL(DIRECTORIO_URL)}
              >
                Ver directorio web
              </Button>
              <Pressable onPress={vincularTerapeuta} style={styles.linkBtn}>
                <Text style={styles.linkText}>Ya tengo un código →</Text>
              </Pressable>
            </View>
          </Card>

          <View style={{ marginTop: spacing[6], gap: spacing[3] }}>
            <Card padding={4} variant="flat">
              <Text variant="h3">Privacidad</Text>
              <Text variant="muted" style={{ marginTop: spacing[2] }}>
                En modo exploración no compartes con nadie. Solo guardas
                favoritos y consultas el catálogo.
              </Text>
            </Card>

            <Card padding={4} variant="flat">
              <Text variant="h3" style={{ marginBottom: spacing[3] }}>
                Sesión
              </Text>
              <Button variant="ghost" size="md" onPress={cerrarSesion}>
                Cerrar sesión
              </Button>
            </Card>
          </View>

          <View style={{ height: spacing[20] }} />
        </ScrollView>
      </SafeAreaView>
      <CrisisButton variant="floating" />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[20] },
  header: { gap: spacing[2], marginTop: spacing[2] },
  ctaCard: { backgroundColor: colors.noemaDeep },
  linkBtn: { alignSelf: 'center', paddingVertical: spacing[2] },
  linkText: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    color: colors.bone,
    textDecorationLine: 'underline',
  },
});
