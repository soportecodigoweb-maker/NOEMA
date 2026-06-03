/**
 * Mensajes del paciente con su terapeuta — comunicación asíncrona.
 *
 * No es chat 24/7 (BIBLIA §11). Es texto que el paciente y el terapeuta
 * leen cuando pueden. Si necesitas atención urgente, módulo de crisis.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { CrisisButton } from '@/components/crisis/CrisisButton';
import { colors, spacing, fontFamily, radii } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Mensaje {
  id: string;
  contenido: string;
  autor_id: string;
  creado_at: string;
  leido_at: string | null;
}

export default function MensajesScreen() {
  const { user } = useAuth();
  const [vincId, setVincId] = useState<string | null>(null);
  const [terapeutaNombre, setTerapeutaNombre] = useState<string>('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Cargar vinculación + mensajes + marcar leídos
  const load = useCallback(async () => {
    if (!user) return;

    const { data: vinc } = await supabase
      .from('vinculaciones')
      .select(`
        id,
        terapeuta:profiles!vinculaciones_terapeuta_id_fkey(nombre)
      `)
      .eq('paciente_id', user.id)
      .eq('estado', 'activa')
      .maybeSingle();
    if (!vinc) { setLoading(false); return; }
    setVincId(vinc.id);
    const t = Array.isArray((vinc as any).terapeuta)
      ? (vinc as any).terapeuta[0]
      : (vinc as any).terapeuta;
    setTerapeutaNombre(t?.nombre ?? '');

    const { data: msgs } = await supabase
      .from('mensajes')
      .select('id, contenido, autor_id, creado_at, leido_at')
      .eq('vinculacion_id', vinc.id)
      .order('creado_at', { ascending: true });
    setMensajes((msgs as Mensaje[] | null) ?? []);
    setLoading(false);

    // Marcar como leídos los que no son míos
    await supabase
      .from('mensajes')
      .update({ leido_at: new Date().toISOString() })
      .eq('vinculacion_id', vinc.id)
      .is('leido_at', null)
      .neq('autor_id', user.id);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [mensajes]);

  const enviar = async () => {
    if (!user || !vincId || !texto.trim()) return;
    const t = texto.trim();
    setTexto('');
    setEnviando(true);
    try {
      const { data: nuevo } = await supabase
        .from('mensajes')
        .insert({
          vinculacion_id: vincId,
          autor_id: user.id,
          contenido: t,
        })
        .select('id, contenido, autor_id, creado_at, leido_at')
        .single();
      if (nuevo) {
        setMensajes((m) => [...m, nuevo as Mensaje]);
      }
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.noemaSage} />
      </View>
    );
  }

  if (!vincId) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <Text variant="h1">Mensajes</Text>
          </View>
          <Card padding={5} variant="flat" style={{ margin: spacing[5] }}>
            <Text variant="bodyM" color="#5C6B5A" align="center">
              Necesitas un terapeuta vinculado para usar mensajes.
            </Text>
          </Card>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.paper }}>
        <View style={styles.header}>
          <Text variant="caption">CONVERSACIÓN CON</Text>
          <Text variant="h2" style={{ marginTop: spacing[1] }}>
            {terapeutaNombre}
          </Text>
          <Text variant="muted" style={{ marginTop: spacing[1] }}>
            Comunicación asíncrona — no es chat 24/7
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {mensajes.length === 0 ? (
          <Card padding={5} variant="flat" style={styles.empty}>
            <Text variant="bodyM" color="#5C6B5A" align="center">
              Aún no hay mensajes. Escribe el primero.
            </Text>
          </Card>
        ) : (
          mensajes.map((m) => {
            const mio = m.autor_id === user!.id;
            return (
              <View key={m.id} style={mio ? styles.bubbleMioRow : styles.bubbleOtroRow}>
                <View style={mio ? styles.bubbleMio : styles.bubbleOtro}>
                  <Text variant="bodyM" color={mio ? colors.bone : colors.ink}>
                    {m.contenido}
                  </Text>
                  <Text
                    style={[
                      styles.timestamp,
                      { color: mio ? 'rgba(250,247,241,0.6)' : '#5C6B5A' },
                    ]}
                  >
                    {new Date(m.creado_at).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: spacing[4] }} />
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.paper }}>
        <View style={styles.composer}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe a tu terapeuta…"
            placeholderTextColor="rgba(42, 51, 40, 0.35)"
            style={styles.input}
            multiline
            maxLength={2000}
          />
          <Pressable
            onPress={enviar}
            disabled={!texto.trim() || enviando}
            style={[styles.sendBtn, (!texto.trim() || enviando) && { opacity: 0.4 }]}
          >
            <Text style={styles.sendIcon}>→</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <CrisisButton variant="floating" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(46, 59, 46, 0.06)',
  },
  scroll: {
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    gap: spacing[2],
  },
  empty: { alignItems: 'center', paddingVertical: spacing[10], marginTop: spacing[5] },
  bubbleMioRow: { alignItems: 'flex-end' },
  bubbleOtroRow: { alignItems: 'flex-start' },
  bubbleMio: {
    maxWidth: '78%',
    backgroundColor: colors.noemaSage,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    borderBottomRightRadius: 4,
  },
  bubbleOtro: {
    maxWidth: '78%',
    backgroundColor: colors.bone,
    borderWidth: 1,
    borderColor: 'rgba(46, 59, 46, 0.06)',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radii.lg,
    borderBottomLeftRadius: 4,
  },
  timestamp: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 10,
    marginTop: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing[3],
    gap: spacing[2],
    borderTopWidth: 1,
    borderTopColor: 'rgba(46, 59, 46, 0.06)',
  },
  input: {
    flex: 1,
    backgroundColor: colors.bone,
    borderRadius: radii.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontFamily: fontFamily.sansRegular,
    fontSize: 15,
    color: colors.ink,
    minHeight: 44,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.noemaDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: colors.bone,
    fontSize: 22,
    fontFamily: fontFamily.sansBold,
  },
});
