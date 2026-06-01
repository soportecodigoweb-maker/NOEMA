module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
    // Quitamos react-native-reanimated/plugin porque la animación de welcome
    // ahora usa React Native Animated estándar (no Reanimated).
    // Si volvemos a usar Reanimated, reactivar el plugin aquí.
  };
};
