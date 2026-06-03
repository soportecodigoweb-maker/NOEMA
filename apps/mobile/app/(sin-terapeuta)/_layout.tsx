/**
 * Tab bar para usuarios en modo sin_terapeuta.
 * No tiene "Registro" ni "Análisis" (que requieren vinculación), pero sí
 * un catálogo educativo y favoritos.
 */
import { Tabs } from 'expo-router';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { Icon, type IconName } from '@/components/ui/Icon';

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
          tabBarIcon: ({ color }) => <Ic name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="biblioteca"
        options={{
          title: 'Biblioteca',
          tabBarIcon: ({ color }) => <Ic name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color }) => <Ic name="heart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ic name="user" color={color} />,
        }}
      />
      <Tabs.Screen name="contenido" options={{ href: null }} />
    </Tabs>
  );
}

function Ic({ name, color }: { name: IconName; color: string }) {
  return <Icon name={name} size={22} color={color} strokeWidth={1.6} />;
}
