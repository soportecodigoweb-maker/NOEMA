/**
 * Patrones de bienestar/malestar — SOLO DATOS DUROS (requerimiento #7).
 *
 * Muestra cuántas veces cada situación/conducta que el paciente registró
 * coincidió con una emoción de bienestar (tranquilo/feliz) o de malestar
 * (ansioso/triste/cansado). SIN interpretaciones, SIN análisis, SIN hipótesis.
 * El objetivo es que el paciente vea sus propios datos y saque sus conclusiones.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { colors, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const FAMILIAS_BIENESTAR = new Set(['tranquilo', 'feliz']);
const FAMILIAS_MALESTAR = new Set(['ansioso', 'triste', 'cansado']);

interface Fila {
  etiqueta: string;
  bienestar: number;
  malestar: number;
  total: number;
}

export function PatronesBienestar({ userId }: { userId: string }) {
  const [situaciones, setSituaciones] = useState<Fila[]>([]);
  const [conductas, setConductas] = useState<Fila[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      // Traer registros con contexto (últimos 60 días para tener muestra)
      const desde = new Date();
      desde.setDate(desde.getDate() - 60);
      const { data: regs } = await supabase
        .from('registros_emocionales')
        .select('emocion_principal_key, situacion_detonante, conducta')
        .eq('paciente_id', userId)
        .gte('fecha', desde.toISOString().slice(0, 10));

      if (!regs?.length) {
        setCargando(false);
        return;
      }

      // Mapa emoción → familia
      const { data: cat } = await supabase
        .from('emociones_catalogo')
        .select('key, familia');
      const familiaPorKey = new Map<string, string>();
      for (const c of cat ?? []) familiaPorKey.set(c.key, c.familia);

      const agrupar = (campo: 'situacion_detonante' | 'conducta') => {
        const mapa = new Map<string, { bienestar: number; malestar: number }>();
        for (const r of regs) {
          const etiqueta = (r[campo] ?? '').trim();
          if (!etiqueta) continue;
          const familia = familiaPorKey.get(r.emocion_principal_key) ?? r.emocion_principal_key;
          const cur = mapa.get(etiqueta) ?? { bienestar: 0, malestar: 0 };
          if (FAMILIAS_BIENESTAR.has(familia)) cur.bienestar += 1;
          else if (FAMILIAS_MALESTAR.has(familia)) cur.malestar += 1;
          mapa.set(etiqueta, cur);
        }
        return [...mapa.entries()]
          .map(([etiqueta, v]) => ({
            etiqueta,
            bienestar: v.bienestar,
            malestar: v.malestar,
            total: v.bienestar + v.malestar,
          }))
          .filter((f) => f.total >= 2) // solo con al menos 2 registros
          .sort((a, b) => b.total - a.total)
          .slice(0, 6);
      };

      setSituaciones(agrupar('situacion_detonante'));
      setConductas(agrupar('conducta'));
      setCargando(false);
    })();
  }, [userId]);

  if (cargando) return null;
  if (situaciones.length === 0 && conductas.length === 0) return null;

  return (
    <View style={{ gap: spacing[4] }}>
      <View style={{ gap: spacing[1] }}>
        <Text variant="h3">Tus patrones</Text>
        <Text variant="muted">
          Estos son tus datos, tal cual. Sin interpretaciones — tú decides qué significan.
        </Text>
      </View>

      {situaciones.length > 0 && (
        <BloquePatron titulo="Situaciones que registraste" filas={situaciones} />
      )}
      {conductas.length > 0 && (
        <BloquePatron titulo="Cosas que hiciste" filas={conductas} />
      )}
    </View>
  );
}

function BloquePatron({ titulo, filas }: { titulo: string; filas: Fila[] }) {
  return (
    <Card padding={4} variant="flat" style={{ gap: spacing[3] }}>
      <Text variant="caption" color="#5C6B5A">{titulo}</Text>
      {filas.map((f) => (
        <View key={f.etiqueta} style={{ gap: spacing[1] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="bodyM" style={{ flex: 1 }}>{f.etiqueta}</Text>
            <Text variant="muted">
              {f.bienestar} bienestar · {f.malestar} malestar
            </Text>
          </View>
          {/* Barra de proporción — solo visual, no interpretativa */}
          <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' }}>
            <View
              style={{
                flex: Math.max(f.bienestar, 0.001),
                backgroundColor: colors.noemaSage,
              }}
            />
            <View
              style={{
                flex: Math.max(f.malestar, 0.001),
                backgroundColor: '#E4B7A0',
              }}
            />
          </View>
        </View>
      ))}
    </Card>
  );
}
