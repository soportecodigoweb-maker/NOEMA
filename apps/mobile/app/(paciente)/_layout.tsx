/**
 * Tab navigation de la app paciente.
 *
 * Tabs: Inicio · Registro · ➕ · Análisis · Recursos
 * El tab central abre directamente el flujo de "nuevo registro emocional".
 */
import { Tabs, useRouter } from 'expo-router';
import { Pressable, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, radii } from '@/lib/theme';
import { Text } from '@/components/ui/Text';

// Iconos minimalistas hechos con caracteres tipográficos por ahora
// (Fase 8 los reemplazamos por SVG outline 24x24 según manual)
const tabIcons = {
  inicio: '⌂',
  registro: '◷',
  analisis: '◴',
  recursos: '☷',
  cuenta: '◐',
} as const;

export default function PacienteLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.noemaSage,
        tabBarInactiveTintColor: '#9AA697',
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabIcon char={tabIcons.inicio} color={color} />,
        }}
      />
      <Tabs.Screen
        name="registro"
        options={{
          title: 'Registro',
          tabBarIcon: ({ color }) => <TabIcon char={tabIcons.registro} color={color} />,
        }}
      />
      <Tabs.Screen
        name="nuevo-registro"
        options={{
          title: '',
          tabBarIcon: () => <CentralActionIcon />,
          tabBarButton: (props) => (
            <Pressable
              {...(props as any)}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/(paciente)/registro/nuevo');
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="analisis"
        options={{
          title: 'Análisis',
          tabBarIcon: ({ color }) => <TabIcon char={tabIcons.analisis} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recursos"
        options={{
          title: 'Recursos',
          tabBarIcon: ({ color }) => <TabIcon char={tabIcons.recursos} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color }) => <TabIcon char={tabIcons.cuenta} color={color} />,
        }}
      />
      {/* Pantallas anidadas que existen pero no van en la tab bar */}
      <Tabs.Screen name="diario" options={{ href: null }} />
      <Tabs.Screen name="tareas" options={{ href: null }} />
      <Tabs.Screen name="contactos-confianza" options={{ href: null }} />
      <Tabs.Screen name="notificar-terapeuta" options={{ href: null }} />
      <Tabs.Screen name="recursos-emergencia" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ char, color }: { char: string; color: string }) {
  return <Text style={{ fontSize: 22, color, fontFamily: fontFamily.serifRegular }}>{char}</Text>;
}

function CentralActionIcon() {
  return (
    <View style={styles.centralAction}>
      <Text style={styles.centralPlus}>+</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bone,
    borderTopColor: 'rgba(46, 59, 46, 0.08)',
    borderTopWidth: 1,
    paddingTop: spacing[1],
    height: 80,
  },
  tabLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  centralAction: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.noemaSage,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -12,
    shadowColor: colors.noemaDeep,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  centralPlus: {
    color: colors.bone,
    fontSize: 28,
    fontFamily: fontFamily.sansLight,
    lineHeight: 32,
  },
});
