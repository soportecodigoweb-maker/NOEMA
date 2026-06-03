/**
 * Pantalla "Cuenta" del paciente — gestión de la vinculación, datos personales,
 * cerrar sesión.
 */
import { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily, radii } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface VinculacionInfo {
  id: string;
  estado: string;
  fecha_inicio: string | null;
  terapeuta: {
    nombre: string;
    avatar_url: string | null;
  } | null;
  terapeuta_info: {
    titulo: string;
  } | null;
}

export default function CuentaScreen() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [vinculacion, setVinculacion] = useState<VinculacionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('vinculaciones')
        .select(`
          id, estado, fecha_inicio,
          terapeuta:profiles!vinculaciones_terapeuta_id_fkey(nombre, avatar_url),
          terapeuta_info:terapeutas!vinculaciones_terapeuta_id_fkey(titulo)
        `)
        .eq('paciente_id', user.id)
        .in('estado', ['activa', 'pausada'])
        .maybeSingle();

      if (data) {
        // Normalizar arrays a objetos
        const t = data as any;
        setVinculacion({
          id: t.id,
          estado: t.estado,
          fecha_inicio: t.fecha_inicio,
          terapeuta: Array.isArray(t.terapeuta) ? t.terapeuta[0] : t.terapeuta,
          terapeuta_info: Array.isArray(t.terapeuta_info)
            ? t.terapeuta_info[0]
            : t.terapeuta_info,
        });
      }
      setLoading(false);
    })();
  }, [user]);

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar tu sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
    );
  };

  const cambiarTerapeuta = () => {
    Alert.alert(
      'Cambiar de terapeuta',
      'Esto pausará tu vinculación actual y te llevará a vincular con un código nuevo. Tu historial se mantiene.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: async () => {
            if (vinculacion) {
              await supabase
                .from('vinculaciones')
                .update({ estado: 'pausada' })
                .eq('id', vinculacion.id);
            }
            await supabase
              .from('profiles')
              .update({ onboarding_completo: false })
              .eq('id', user!.id);
            await refreshProfile();
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
          {/* Encabezado */}
          <View style={styles.header}>
            <Text variant="h1">Tu cuenta</Text>
            <Text variant="bodyM" color="#5C6B5A">
              {profile?.nombre}
            </Text>
            <Text variant="muted">{profile?.email}</Text>
          </View>

          {/* Vinculación con terapeuta */}
          {loading ? (
            <Card padding={4} variant="flat">
              <Text variant="muted">Cargando…</Text>
            </Card>
          ) : vinculacion ? (
            <Card padding={4}>
              <Text variant="caption" style={{ marginBottom: spacing[2] }}>
                Tu terapeuta
              </Text>
              <View style={styles.terapeutaRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {initials(vinculacion.terapeuta?.nombre ?? '?')}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="h3">{vinculacion.terapeuta?.nombre}</Text>
                  <Text variant="muted">
                    {vinculacion.terapeuta_info?.titulo}
                  </Text>
                </View>
              </View>
              {vinculacion.fecha_inicio && (
                <Text variant="muted" style={{ marginTop: spacing[3] }}>
                  Vinculados desde{' '}
                  {new Date(vinculacion.fecha_inicio).toLocaleDateString(
                    'es-MX',
                    { day: 'numeric', month: 'long', year: 'numeric' },
                  )}
                </Text>
              )}
              {vinculacion.estado === 'pausada' && (
                <View style={styles.warningPill}>
                  <Text variant="muted" color={colors.ink}>
                    Vinculación en pausa
                  </Text>
                </View>
              )}
              <Pressable
                onPress={cambiarTerapeuta}
                style={styles.changeBtn}
              >
                <Text style={styles.changeBtnText}>Cambiar de terapeuta</Text>
              </Pressable>
            </Card>
          ) : (
            <Card padding={4} variant="flat">
              <Text variant="h3" style={{ marginBottom: spacing[2] }}>
                Sin terapeuta vinculado
              </Text>
              <Text variant="muted" style={{ marginBottom: spacing[4] }}>
                Si tu terapeuta te dio un código, introdúcelo para vincularte.
              </Text>
              <Button
                variant="primary"
                size="md"
                onPress={() => router.push('/(onboarding)/codigo')}
              >
                Introducir código
              </Button>
            </Card>
          )}

          {/* Accesos rápidos a contactos y sesiones */}
          <Card padding={4} variant="flat" style={{ gap: spacing[3] }}>
            <Pressable
              onPress={() => router.push('/(paciente)/sesiones')}
              style={styles.menuRow}
            >
              <Text variant="bodyM" style={{ flex: 1, fontFamily: fontFamily.sansMedium }}>
                Mis sesiones
              </Text>
              <Text style={{ fontFamily: fontFamily.serifLight, fontSize: 22, color: '#5C6B5A' }}>
                ›
              </Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={() => router.push('/(paciente)/contactos-confianza')}
              style={styles.menuRow}
            >
              <Text variant="bodyM" style={{ flex: 1, fontFamily: fontFamily.sansMedium }}>
                Contactos de confianza
              </Text>
              <Text style={{ fontFamily: fontFamily.serifLight, fontSize: 22, color: '#5C6B5A' }}>
                ›
              </Text>
            </Pressable>
          </Card>

          {/* Privacidad */}
          <Card padding={4} variant="flat">
            <Text variant="h3">Privacidad</Text>
            <Text variant="muted" style={{ marginTop: spacing[2] }}>
              Tú decides qué compartir con tu terapeuta. Cada registro y entrada
              de diario tiene su propio nivel: privado, compartido o marcado para
              sesión. Lo privado es inviolable.
            </Text>
          </Card>

          {/* Soporte */}
          <Card padding={4} variant="flat">
            <Text variant="h3">Soporte y legal</Text>
            <View style={{ marginTop: spacing[3], gap: spacing[3] }}>
              <Pressable
                onPress={() =>
                  Linking.openURL('https://somosnoema.com/terminos')
                }
              >
                <Text style={styles.linkRow}>Términos de servicio ›</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Linking.openURL('https://somosnoema.com/privacidad')
                }
              >
                <Text style={styles.linkRow}>Aviso de privacidad ›</Text>
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL('mailto:hola@somosnoema.com')}
              >
                <Text style={styles.linkRow}>Contactar soporte ›</Text>
              </Pressable>
            </View>
          </Card>

          {/* Sesión */}
          <Card padding={4} variant="flat">
            <Text variant="h3" style={{ marginBottom: spacing[3] }}>
              Sesión
            </Text>
            <Button variant="ghost" size="md" onPress={cerrarSesion}>
              Cerrar sesión
            </Button>
          </Card>

          <View style={{ height: spacing[20] }} />
        </ScrollView>
      </SafeAreaView>
      <CrisisButton variant="floating" />
    </View>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing[5],
    gap: spacing[4],
    paddingBottom: spacing[20],
  },
  header: { gap: spacing[1], marginTop: spacing[2], marginBottom: spacing[2] },
  terapeutaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(61, 77, 62, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.sansMedium,
    color: colors.noemaDeep,
    fontSize: 16,
  },
  warningPill: {
    marginTop: spacing[3],
    backgroundColor: 'rgba(240, 201, 174, 0.30)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    alignSelf: 'flex-start',
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing[2] },
  divider: {
    height: 1,
    backgroundColor: 'rgba(46, 59, 46, 0.06)',
  },
  changeBtn: { marginTop: spacing[4], paddingVertical: spacing[2] },
  changeBtnText: {
    fontFamily: fontFamily.sansMedium,
    color: colors.noemaSage,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  linkRow: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 15,
    color: colors.ink,
  },
});
