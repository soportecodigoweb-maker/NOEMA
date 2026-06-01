/**
 * Pantalla Inicio (Home) — primera vista del paciente cada día.
 *
 * Estructura (según mockup del manual de identidad):
 *   1. Saludo + pregunta del día
 *   2. Calendario semanal (chips L-D con el día actual destacado)
 *   3. Tarjeta "Registro del día" con progreso
 *   4. Tarjeta "¿Cómo está tu bienestar?" → registro rápido
 *   5. Próxima sesión
 *   6. CrisisButton flotante
 */
import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily, radii } from '@/lib/theme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { esMX } from '@noema/i18n';

const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

interface ProxSesion {
  fecha_programada: string;
  modalidad: string;
}

export default function InicioScreen() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const greeting = useGreeting();
  const [proxSesion, setProxSesion] = useState<ProxSesion | null>(null);
  const [registrosHoy, setRegistrosHoy] = useState<number>(0);

  // Cargar próxima sesión + registros de hoy
  useEffect(() => {
    if (!user) return;
    (async () => {
      const hoyStr = new Date().toISOString().slice(0, 10);

      const { data: vincs } = await supabase
        .from('vinculaciones')
        .select('id')
        .eq('paciente_id', user.id)
        .eq('estado', 'activa');

      const { count } = await supabase
        .from('registros_emocionales')
        .select('*', { count: 'exact', head: true })
        .eq('paciente_id', user.id)
        .eq('fecha', hoyStr);
      setRegistrosHoy(count ?? 0);

      if (!vincs?.length) return;
      const { data } = await supabase
        .from('sesiones')
        .select('fecha_programada, modalidad')
        .in('vinculacion_id', vincs.map((v: { id: string }) => v.id))
        .gte('fecha_programada', new Date().toISOString())
        .eq('estado', 'programada')
        .order('fecha_programada', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) setProxSesion(data as ProxSesion);
    })();
  }, [user]);

  const semana = useMemo(() => {
    const hoy = new Date();
    const dia = (hoy.getDay() + 6) % 7; // L=0 ... D=6
    const monday = new Date(hoy);
    monday.setDate(hoy.getDate() - dia);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return {
        letra: DIAS[i],
        numero: d.getDate(),
        esHoy: d.toDateString() === hoy.toDateString(),
      };
    });
  }, []);

  const nombreCorto = profile?.nombre?.split(' ')[0] ?? '';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.paper }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Saludo */}
          <View style={styles.greetingBlock}>
            <Text variant="h1" style={styles.greeting}>
              {greeting}{nombreCorto ? `, ${nombreCorto}` : ''}
            </Text>
            <Text variant="bodyL" color="#5C6B5A">
              {esMX.paciente.homeQuestion}
            </Text>
          </View>

          {/* Semana */}
          <View style={styles.semanaRow}>
            {semana.map((d, i) => (
              <View
                key={i}
                style={[styles.diaChip, d.esHoy && styles.diaChipHoy]}
              >
                <Text style={[styles.diaLetra, d.esHoy && styles.diaTextoHoy]}>
                  {d.letra}
                </Text>
                <Text style={[styles.diaNumero, d.esHoy && styles.diaTextoHoy]}>
                  {d.numero}
                </Text>
              </View>
            ))}
          </View>

          {/* Registro del día */}
          <Pressable
            onPress={() => router.push('/(paciente)/registro/nuevo')}
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Card padding={4} style={styles.registroCard}>
              <View style={styles.registroHeader}>
                <View style={{ flex: 1 }}>
                  <Text variant="h3">{esMX.paciente.todaysRegister}</Text>
                  <Text variant="muted">
                    {registrosHoy === 0
                      ? 'Aún no hay registros hoy'
                      : `${registrosHoy} ${registrosHoy === 1 ? 'registro' : 'registros'} hoy`}
                  </Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(registrosHoy * 20, 100)}%` },
                  ]}
                />
              </View>
            </Card>
          </Pressable>

          {/* ¿Cómo está tu bienestar? */}
          <Pressable
            onPress={() => router.push('/(paciente)/registro/nuevo')}
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Card padding={4} variant="flat" style={styles.bienestarCard}>
              <View style={styles.bienestarIcon}>
                <Text style={{ fontSize: 22 }}>○</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h3">¿Cómo está tu bienestar?</Text>
                <Text variant="muted">
                  Explora tu estado emocional en este momento.
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </Pressable>

          {/* Próxima sesión */}
          {/* Próxima sesión — dinámica desde DB */}
          {proxSesion && (
            <Card padding={4} variant="flat" style={styles.sesionCard}>
              <View style={styles.bienestarIcon}>
                <Text style={{ fontSize: 22 }}>◐</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h3">Próxima sesión</Text>
                <Text variant="muted">
                  {formatProxSesion(proxSesion.fecha_programada)} · {proxSesion.modalidad}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          )}

          {/* Espaciador final */}
          <View style={{ height: spacing[8] }} />
        </ScrollView>
      </SafeAreaView>

      <CrisisButton variant="floating" />
    </View>
  );
}

function useGreeting() {
  const h = new Date().getHours();
  if (h < 12) return esMX.paciente.greetingMorning;
  if (h < 19) return esMX.paciente.greetingAfternoon;
  return esMX.paciente.greetingEvening;
}

function formatProxSesion(iso: string): string {
  const d = new Date(iso);
  const fecha = d.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const hora = d.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${fecha} · ${hora}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  scroll: {
    padding: spacing[5],
    gap: spacing[5],
    paddingBottom: spacing[20],
  },
  greetingBlock: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  greeting: { color: colors.ink },
  semanaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[1],
  },
  diaChip: {
    flex: 1,
    aspectRatio: 0.7,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    gap: spacing[1],
  },
  diaChipHoy: {
    backgroundColor: colors.noemaDeep,
  },
  diaLetra: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    color: '#5C6B5A',
    letterSpacing: 0.8,
  },
  diaNumero: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 16,
    color: colors.ink,
  },
  diaTextoHoy: { color: colors.bone },
  registroCard: {
    backgroundColor: '#E8E4D6',
    gap: spacing[3],
  },
  registroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(46, 59, 46, 0.12)',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.noemaSage,
    borderRadius: radii.pill,
  },
  bienestarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  sesionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  bienestarIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(61, 77, 62, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontFamily: fontFamily.serifLight,
    fontSize: 28,
    color: '#5C6B5A',
  },
});
