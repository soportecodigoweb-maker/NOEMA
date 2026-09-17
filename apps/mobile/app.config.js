/**
 * Configuración dinámica de Expo. Parte de app.json y añade lo que depende del
 * entorno de build.
 *
 * Push en Android (FCM): el archivo `google-services.json` de Firebase NO se
 * commitea. Se toma de:
 *   1. la variable GOOGLE_SERVICES_JSON (variable de entorno de EAS de tipo
 *      "file": `eas env:create --scope project --name GOOGLE_SERVICES_JSON
 *      --type file --value ./google-services.json`), o
 *   2. `apps/mobile/google-services.json` en local (está en .gitignore).
 * Si no existe ninguno, el build sigue funcionando; solo no habrá push Android.
 *
 * Ver DEPLOYMENT.md → "Notificaciones push".
 */
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const candidatos = [
    process.env.GOOGLE_SERVICES_JSON,
    path.join(__dirname, 'google-services.json'),
  ].filter(Boolean);
  const googleServicesFile = candidatos.find((p) => fs.existsSync(p));

  return {
    ...config,
    android: {
      ...config.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
  };
};
