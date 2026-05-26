/**
 * Tab bar para usuarios en modo sin_terapeuta.
 * No tiene "Registro" ni "Análisis" (que requieren vinculación), pero sí
 * un catálogo educativo y favoritos.
 */
import { Tabs } from 'expo-router';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { Text } from '@/components/ui/Text';

const tabIcons = {
  inicio: '⌂',
  biblioteca: '☷',
  favoritos: '♡',
  perfil: '◐',
} as const;

export default function SinTerapeutaLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bone,
          borderTopColor: 'rgba(46, 59, 46, 0.08)',
          borderTopWidth: 1,
          paddingTop: spacing[1],
          height: 80,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.sansMedium,
          fontSize: 10,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          marginTop: 2,
        },
        tabBarActiveTintColor: colors.noemaSage,
        tabBarInactiveTintColor: '#9AA697',
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ic char={tabIcons.inicio} color={color} />,
        }}
      />
      <Tabs.Screen
        name="biblioteca"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color }) => <Ic char={tabIcons.biblioteca} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color }) => <Ic char={tabIcons.favoritos} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ic char={tabIcons.perfil} color={color} />,
        }}
      />
      <Tabs.Screen name="contenido" options={{ href: null }} />
    </Tabs>
  );
}

function Ic({ char, color }: { char: string; color: string }) {
  return (
    <Text style={{ fontSize: 22, color, fontFamily: fontFamily.serifRegular }}>
      {char}
    </Text>
  );
}
