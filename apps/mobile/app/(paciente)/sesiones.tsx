/**
 * Sesiones del paciente — próximas y pasadas.
 * El paciente puede ver sus notas públicas (si el terapeuta las compartió)
 * y abrir el link de videollamada si la sesión es online.
 */
import { useCallback, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  Linking,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Sesion {
  id: string;
  numero: number | null;
  fecha_programada: string;
  duracion_min: number;
  modalidad: string;
  link_videollamada: string | null;
  ubicacion: string | null;
  estado: string;
  nota?: {
    contenido_publico: string | null;
    visible_paciente: boolean;
  } | null;
}

export default function SesionesScreen() {
  const { user } = useAuth();
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [vincActiva, setVincActiva] = useState<{ id: string; agenda: boolean } | null>(null);
  const [agendando, setAgendando] = useState(false);
  const [slotEnviando, setSlotEnviando] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: vincs } = await supabase
      .from('vinculaciones')
      .select('id, estado, agenda_habilitada')
      .eq('paciente_id', user.id)
      .in('estado', ['activa', 'pausada']);
    if (!vincs?.length) return;

    // Guardar la vinculación activa para saber si puede agendar
    const activa = vincs.find((v: { estado: string }) => v.estado === 'activa');
    if (activa) {
      setVincActiva({ id: activa.id, agenda: activa.agenda_habilitada === true });
    }

    const ids = vincs.map((v: { id: string }) => v.id);
    const { data } = await supabase
      .from('sesiones')
      .select(`
        id, numero, fecha_programada, duracion_min, modalidad,
        link_videollamada, ubicacion, estado,
        nota:sesion_notas(contenido_publico, visible_paciente)
      `)
      .in('vinculacion_id', ids)
      .order('fecha_programada', { ascending: false });

    const lista = ((data as any[]) ?? []).map((s) => ({
      ...s,
      nota: Array.isArray(s.nota) ? s.nota[0] : s.nota,
    })) as Sesion[];
    setSesiones(lista);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const solicitarCita = useCallback(
    async (slotISO: string) => {
      if (!vincActiva) return;
      setSlotEnviando(slotISO);
      const { error } = await supabase.from('sesiones').insert({
        vinculacion_id: vincActiva.id,
        fecha_programada: slotISO,
        duracion_min: 60,
        modalidad: 'online',
        estado: 'programada',
      });
      setSlotEnviando(null);
      if (!error) {
        setAgendando(false);
        await load();
      }
    },
    [vincActiva, load],
  );

  const ahora = Date.now();
  const proximas = sesiones.filter(
    (s) =>
      new Date(s.fecha_programada).getTime() > ahora &&
      (s.estado === 'programada' || s.estado === 'reagendada'),
  );
  const pasadas = sesiones
    .filter(
      (s) =>
        new Date(s.fecha_programada).getTime() <= ahora ||
        s.estado === 'realizada' ||
        s.estado === 'no_asistio',
    );

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <SafeAreaView edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={colors.noemaSage}
            />
          }
        >
          <View style={styles.header}>
            <Text variant="h1">Tus sesiones</Text>
            <Text variant="bodyM" color="#5C6B5A">
              Próximas y pasadas con tu terapeuta.
            </Text>
          </View>

          {/* Solicitar cita — solo si el terapeuta habilitó la agenda (#11) */}
          {vincActiva?.agenda && (
            <View>
              {!agendando ? (
                <Button variant="secondary" size="md" onPress={() => setAgendando(true)}>
                  Solicitar una cita
                </Button>
              ) : (
                <Card padding={4} variant="flat" style={{ gap: spacing[3] }}>
                  <Text variant="h3">Elige un horario</Text>
                  <Text variant="muted">
                    Tu terapeuta habilitó que agendes. Elige un espacio sugerido.
                  </Text>
                  <View style={styles.slotsWrap}>
                    {generarSlots().map((slot) => (
                      <Pressable
                        key={slot.iso}
                        onPress={() => solicitarCita(slot.iso)}
                        disabled={slotEnviando !== null}
                        style={[
                          styles.slotChip,
                          slotEnviando === slot.iso && styles.slotChipActive,
                        ]}
                      >
                        <Text variant="bodyM">{slot.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Pressable onPress={() => setAgendando(false)}>
                    <Text variant="muted" style={{ textAlign: 'center' }}>
                      Cancelar
                    </Text>
                  </Pressable>
                </Card>
              )}
            </View>
          )}

          {/* Próximas */}
          {proximas.length > 0 && (
            <View>
              <Text variant="caption" style={styles.sectionLabel}>
                Próximas ({proximas.length})
              </Text>
              <View style={{ gap: spacing[3] }}>
                {proximas.map((s) => (
                  <ProxSesionCard key={s.id} sesion={s} />
                ))}
              </View>
            </View>
          )}

          {/* Historial */}
          {pasadas.length > 0 && (
            <View>
              <Text variant="caption" style={styles.sectionLabel}>
                Historial
              </Text>
              <View style={{ gap: spacing[3] }}>
                {pasadas.map((s) => (
                  <PasadaSesionCard key={s.id} sesion={s} />
                ))}
              </View>
            </View>
          )}

          {proximas.length === 0 && pasadas.length === 0 && (
            <Card padding={5} variant="flat" style={styles.empty}>
              <Text variant="bodyM" color="#5C6B5A" align="center">
                No tienes sesiones programadas todavía.
              </Text>
            </Card>
          )}
        </ScrollView>
      </SafeAreaView>
      <CrisisButton variant="floating" />
    </View>
  );
}

/**
 * Genera espacios sugeridos: próximos días hábiles a 3 horarios comunes.
 * (Sin date-picker nativo para no agregar dependencias.)
 */
function generarSlots(): Array<{ iso: string; label: string }> {
  const slots: Array<{ iso: string; label: string }> = [];
  const horas = [10, 16, 18];
  const hoy = new Date();
  let dias = 0;
  let offset = 1;
  while (dias < 5 && offset < 20) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() + offset);
    offset += 1;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // saltar fin de semana
    dias += 1;
    for (const h of horas) {
      const slot = new Date(d);
      slot.setHours(h, 0, 0, 0);
      slots.push({
        iso: slot.toISOString(),
        label: `${slot.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })} · ${h}:00`,
      });
    }
  }
  return slots;
}

function ProxSesionCard({ sesion }: { sesion: Sesion }) {
  const f = new Date(sesion.fecha_programada);
  const diasRestantes = Math.ceil((f.getTime() - Date.now()) / 86400000);
  const esHoy = diasRestantes === 0;
  const esManana = diasRestantes === 1;

  return (
    <Card padding={5} style={esHoy ? styles.cardDestacada : undefined}>
      <Text variant="caption" color={esHoy ? colors.bone : '#5C6B5A'}>
        {esHoy ? 'HOY' : esManana ? 'MAÑANA' : f.toLocaleDateString('es-MX', { weekday: 'long' }).toUpperCase()}
      </Text>
      <Text
        variant="h2"
        color={esHoy ? colors.bone : colors.ink}
        style={{ marginTop: spacing[1] }}
      >
        {f.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
      </Text>
      <Text variant="bodyL" color={esHoy ? 'rgba(250,247,241,0.85)' : colors.ink} style={{ marginTop: spacing[1] }}>
        {f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} ·{' '}
        {sesion.duracion_min} min · {sesion.modalidad}
      </Text>

      {sesion.link_videollamada && sesion.modalidad !== 'presencial' && (
        <View style={{ marginTop: spacing[4] }}>
          <Button
            variant={esHoy ? 'inverse' : 'primary'}
            fullWidth
            onPress={() => Linking.openURL(sesion.link_videollamada!)}
          >
            Entrar a la videollamada
          </Button>
        </View>
      )}
      {sesion.ubicacion && sesion.modalidad !== 'online' && (
        <View style={{ marginTop: spacing[3] }}>
          <Text variant="muted" color={esHoy ? 'rgba(250,247,241,0.7)' : '#5C6B5A'}>
            📍 {sesion.ubicacion}
          </Text>
        </View>
      )}
    </Card>
  );
}

function PasadaSesionCard({ sesion }: { sesion: Sesion }) {
  const f = new Date(sesion.fecha_programada);
  const estado = sesion.estado;
  const notaVisible = sesion.nota?.visible_paciente && sesion.nota?.contenido_publico;

  return (
    <Card padding={4} variant="flat">
      <View style={styles.pasadaHeader}>
        <Text variant="bodyM" style={{ fontFamily: fontFamily.sansMedium }}>
          {f.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <EstadoBadge estado={estado} />
      </View>
      {sesion.numero && (
        <Text variant="muted" style={{ marginTop: spacing[1] }}>
          Sesión #{sesion.numero}
        </Text>
      )}
      {notaVisible && (
        <View style={styles.notaBox}>
          <Text variant="caption">RESUMEN DE TU SESIÓN</Text>
          <Text variant="bodyM" style={{ marginTop: spacing[2], lineHeight: 22 }}>
            {sesion.nota!.contenido_publico}
          </Text>
        </View>
      )}
    </Card>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, { label: string; color: string }> = {
    realizada: { label: 'Realizada', color: 'rgba(199, 210, 189, 0.5)' },
    cancelada: { label: 'Cancelada', color: 'rgba(46, 59, 46, 0.10)' },
    no_asistio: { label: 'No asistí', color: 'rgba(184, 84, 80, 0.15)' },
    reagendada: { label: 'Reagendada', color: 'rgba(240, 201, 174, 0.30)' },
  };
  const v = map[estado] ?? { label: estado, color: 'rgba(46, 59, 46, 0.10)' };
  return (
    <View style={[styles.badge, { backgroundColor: v.color }]}>
      <Text variant="caption" color={colors.ink}>
        {v.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[6], paddingBottom: spacing[20] },
  header: { gap: spacing[2], marginTop: spacing[2] },
  sectionLabel: { marginBottom: spacing[3] },
  empty: { alignItems: 'center', paddingVertical: spacing[10] },
  slotsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  slotChip: {
    borderWidth: 1,
    borderColor: 'rgba(61, 77, 62, 0.20)',
    borderRadius: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    backgroundColor: colors.bone,
  },
  slotChipActive: {
    backgroundColor: colors.noemaSage,
    borderColor: colors.noemaSage,
  },
  cardDestacada: { backgroundColor: colors.noemaDeep },
  pasadaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notaBox: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 59, 46, 0.06)',
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: 999,
  },
});
