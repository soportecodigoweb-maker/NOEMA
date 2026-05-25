/**
 * Este componente nunca se renderiza visiblemente: el botón del tab central
 * intercepta el press y navega directo a /registro/nuevo. Si por alguna
 * razón se llega aquí, mostramos un View vacío sin redirigir (para evitar
 * loops con el router).
 */
import { View } from 'react-native';
import { colors } from '@/lib/theme';

export default function NuevoRegistroPlaceholder() {
  return <View style={{ flex: 1, backgroundColor: colors.paper }} />;
}
