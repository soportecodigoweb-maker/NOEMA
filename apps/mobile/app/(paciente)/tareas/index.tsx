import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing } from '@/lib/theme';

export default function TareasIndexScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaView edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <Text variant="h1">Tus tareas</Text>
            <Text variant="bodyM" color="#5C6B5A">
              Ejercicios y prácticas que asignó tu terapeuta.
            </Text>
          </View>
          <Card padding={5} variant="flat" style={styles.empty}>
            <Text variant="bodyM" color="#5C6B5A" align="center">
              Cuando tu terapeuta te asigne una tarea, aparecerá aquí.
            </Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
      <CrisisButton variant="floating" />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[20] },
  header: { gap: spacing[2], marginTop: spacing[2] },
  empty: { alignItems: 'center', paddingVertical: spacing[10] },
});
