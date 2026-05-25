import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/lib/theme';

export default function NotificarTerapeutaScreen() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen
        options={{
          title: 'Avisar a tu terapeuta',
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Card padding={5} variant="flat">
            <Text variant="bodyM" color="#5C6B5A">
              Tu terapeuta recibirá una alerta de que activaste el módulo de
              crisis. No verá detalles, solo que necesitas atención.
            </Text>
          </Card>
          <Button variant="primary" fullWidth onPress={() => router.back()}>
            Enviar alerta
          </Button>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5] },
});
