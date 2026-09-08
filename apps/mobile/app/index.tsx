/**
 * Pantalla índice ("/") — la primera ruta que abre la app.
 *
 * No decide el destino por sí misma: el AuthGate del layout raíz redirige según
 * el estado de sesión/onboarding. Aquí solo mostramos un fondo neutro (igual al
 * splash) para que "/" tenga una pantalla válida y NO aparezca "Unmatched Route"
 * mientras se resuelve la sesión.
 */
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/lib/theme';

export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper }}>
      <ActivityIndicator color={colors.noemaSage} />
    </View>
  );
}
