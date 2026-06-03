/**
 * Contactos de confianza del paciente para crisis.
 * Personas a las que el paciente decide poder llamar rápido desde la pantalla
 * de crisis. SIEMPRE iniciativa del paciente (BIBLIA §11).
 */
import { useCallback, useState } from 'react';
import {
  ScrollView, View, StyleSheet, Pressable, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing, fontFamily } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface Contacto {
  id: string;
  nombre: string;
  telefono: string;
  relacion: string | null;
}

export default function ContactosConfianzaScreen() {
  const { user } = useAuth();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [relacion, setRelacion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('contactos_confianza')
      .select('id, nombre, telefono, relacion')
      .eq('paciente_id', user.id)
      .eq('activo', true)
      .order('orden');
    setContactos((data as Contacto[] | null) ?? []);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const agregar = async () => {
    if (!user || !nombre.trim() || !telefono.trim()) return;
    setGuardando(true);
    try {
      await supabase.from('contactos_confianza').insert({
        paciente_id: user.id,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        relacion: relacion.trim() || null,
      });
      setNombre(''); setTelefono(''); setRelacion('');
      setMostrarForm(false);
      await load();
    } finally {
      setGuardando(false);
    }
  };

  const borrar = (c: Contacto) => {
    Alert.alert('Quitar contacto', `¿Quitar a ${c.nombre} de tus contactos de confianza?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          await supabase
            .from('contactos_confianza')
            .update({ activo: false })
            .eq('id', c.id);
          await load();
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <Stack.Screen
        options={{
          title: 'Contactos de confianza',
          headerStyle: { backgroundColor: colors.paper },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text variant="bodyM" color="#5C6B5A">
            Personas a las que puedes llamar con un toque desde la pantalla de
            crisis. Tú decides quiénes están aquí.
          </Text>

          {contactos.length === 0 && !mostrarForm && (
            <Card padding={5} variant="flat" style={styles.empty}>
              <Text variant="bodyM" color="#5C6B5A" align="center">
                Aún no configuraste contactos.
              </Text>
            </Card>
          )}

          {contactos.length > 0 && (
            <View style={{ gap: spacing[3] }}>
              {contactos.map((c) => (
                <Card key={c.id} padding={4} variant="flat">
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text variant="h3">{c.nombre}</Text>
                      {c.relacion && <Text variant="muted">{c.relacion}</Text>}
                      <Text variant="bodyM" style={{ marginTop: spacing[1] }}>
                        {c.telefono}
                      </Text>
                    </View>
                    <View style={{ gap: spacing[2] }}>
                      <Pressable
                        onPress={() => Linking.openURL(`tel:${c.telefono}`)}
                        style={styles.callBtn}
                      >
                        <Text style={styles.callBtnText}>Llamar</Text>
                      </Pressable>
                      <Pressable onPress={() => borrar(c)}>
                        <Text style={styles.removeBtn}>Quitar</Text>
                      </Pressable>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {mostrarForm ? (
            <Card padding={4} style={{ gap: spacing[3] }}>
              <Text variant="h3">Nuevo contacto</Text>
              <Input
                label="Nombre"
                placeholder="Ej: Carolina (mi hermana)"
                value={nombre}
                onChangeText={setNombre}
              />
              <Input
                label="Teléfono"
                placeholder="55 1234 5678"
                value={telefono}
                onChangeText={setTelefono}
                keyboardType="phone-pad"
              />
              <Input
                label="Relación (opcional)"
                placeholder="hermana, amiga, mamá…"
                value={relacion}
                onChangeText={setRelacion}
              />
              <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[2] }}>
                <Button variant="ghost" onPress={() => setMostrarForm(false)}>
                  Cancelar
                </Button>
                <View style={{ flex: 1 }}>
                  <Button
                    variant="primary"
                    fullWidth
                    onPress={agregar}
                    loading={guardando}
                    disabled={!nombre.trim() || !telefono.trim()}
                  >
                    Agregar
                  </Button>
                </View>
              </View>
            </Card>
          ) : (
            <Button variant="primary" fullWidth onPress={() => setMostrarForm(true)}>
              Agregar contacto
            </Button>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing[5], gap: spacing[5], paddingBottom: spacing[10] },
  empty: { alignItems: 'center', paddingVertical: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  callBtn: {
    backgroundColor: colors.noemaSage,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
  },
  callBtnText: { color: colors.bone, fontFamily: fontFamily.sansMedium, fontSize: 13 },
  removeBtn: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 12,
    color: '#5C6B5A',
    textAlign: 'center',
  },
});
