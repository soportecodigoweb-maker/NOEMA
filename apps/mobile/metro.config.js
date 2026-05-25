/**
 * Metro config para monorepo Turborepo + pnpm workspaces.
 *
 * Watch incluye toda la raíz del monorepo y nodeModulesPaths apunta a
 * los node_modules de la app + de la raíz para resolver workspace deps.
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar toda la raíz del monorepo
config.watchFolders = [monorepoRoot];

// 2. Resolver node_modules en orden: app primero, luego raíz
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Desactivar la hoisted detection automática (no aplica con pnpm)
config.resolver.disableHierarchicalLookup = true;

// 4. Para SVG como componentes (opcional, lo activamos cuando tengamos
//    react-native-svg-transformer instalado — por ahora usamos <Svg> directo
//    desde react-native-svg con los path inline).

module.exports = config;
