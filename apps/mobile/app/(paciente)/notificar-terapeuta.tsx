/**
 * Pantalla que dispara una alerta_crisis al terapeuta vinculado.
 *
 * El terapeuta SOLO la recibe si previamente activaste el opt-in en el
 * consentimiento informado (notificar_crisis_terapeuta = true en vinculacion).
 *
 * No le pasamos contexto detallado — solo "el paciente necesita atención".
 * La privacidad del momento se respeta.
 */
import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function NotificarTerapeutaScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [vincId, setVincId] = useState<string | null>(null);
  const [notificaActivo, setNotificaActivo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('vinculaciones')
        .select('id, notificar_crisis_terapeuta')
        .eq('paciente_id', user.id)
        .eq('estado', 'activa')
        .maybeSingle();
      if (data) {
        setVincId(data.id);
        setNotificaActivo(!!data.notificar_crisis_terapeuta);
      }
    })();
  }, [user]);

  const enviar = async () => {
    if (!user || !vincId) return;
    setEnviando(true);
    setError(null);
    try {
      const { error: err } = await supabase.from('alertas_crisis').insert({
        paciente_id: user.id,
        vinculacion_id: vincId,
        origen: 'paciente_manual',
        gravedad: 'moderada',
        notificado_terapeuta: notificaActivo,
        notificado_at: notificaActivo ? new Date().toISOString() : null,
      });
      if (err) throw err;
      setExito(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos enviar la alerta.');
    } finally {
      setEnviando(false);
    }
  };

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
          {exito ? (
            <Card padding={5} variant="flat" style={styles.successCard}>
              <Text variant="h3">Tu terapeuta recibirá tu alerta</Text>
              <Text variant="bodyM" color="#5C6B5A" style={{ marginTop: spacing[3] }}>
                Se generó una alerta en su panel. No verá detalles, solo que
                necesitas atención. Te responderá lo antes posible.
              </Text>
              <View style={{ marginTop: spacing[5] }}>
                <Button variant="primary" fullWidth onPress={() => router.back()}>
                  Volver
                </Button>
              </View>
            </Card>
          ) : !vincId ? (
            <Card padding={5} variant="flat">
              <Text variant="bodyM" color="#5C6B5A">
                No tienes terapeuta vinculado actualmente. Si necesitas ayuda,
                contacta a líneas de crisis o servicios de emergencia.
              </Text>
            </Card>
          ) : (
            <>
              <Card padding={5} variant="flat">
                <Text variant="bodyL" style={{ lineHeight: 26 }}>
                  Tu terapeuta {notificaActivo ? 'recibirá' : 'NO recibirá automáticamente'} una
                  alerta de que activaste el módulo de crisis.
                </Text>
                {!notificaActivo && (
                  <Text variant="bodyM" color="#5C6B5A" style={{ marginTop: spacing[3] }}>
                    Durante tu vinculación marcaste como NO autorizar el aviso
                    automático. Aún así puedes registrar tu alerta para tu
                    propio historial.
                  </Text>
                )}
                {notificaActivo && (
                  <Text variant="bodyM" color="#5C6B5A" style={{ marginTop: spacing[3] }}>
                    No verá detalles, solo que necesitas atención. Tu información
                    privada sigue protegida.
                  </Text>
                )}
              </Card>

              {error && (
                <Text variant="muted" color="#B85450">
                  {error}
                </Text>
              )}

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onPress={enviar}
                loading={enviando}
              >
                {notificaActivo ? 'Enviar alerta a mi terapeuta' : 'Registrar alerta'}
              </Button>
              <Button variant="ghost" fullWidth onPress={() => router.back()}>
                Cancelar
              </Button>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[4] },
  successCard: {
    backgroundColor: 'rgba(199, 210, 189, 0.30)',
    borderColor: 'rgba(61, 77, 62, 0.20)',
  },
});
