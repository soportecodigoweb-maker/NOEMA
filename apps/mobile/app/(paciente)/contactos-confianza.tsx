import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/lib/theme';

export default function ContactosConfianzaScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen
        options={{
          title: 'Mis contactos de confianza',
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text variant="bodyM" color="#5C6B5A">
            Personas a las que puedes llamar rápidamente desde la pantalla de crisis.
          </Text>
          <Card padding={5} variant="flat" style={styles.empty}>
            <Text variant="bodyM" color="#5C6B5A" align="center">
              Aún no configuraste contactos.
            </Text>
          </Card>
          <Button variant="primary" fullWidth onPress={() => router.back()}>
            Agregar contacto
          </Button>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5] },
  empty: { alignItems: 'center', paddingVertical: spacing[8] },
});
