/**
 * Metro config para monorepo Turborepo + pnpm workspaces.
 */
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const stub = path.resolve(projectRoot, 'metro-stub.js');

const config = getDefaultConfig(projectRoot);

// 1. Vigilar toda la raíz del monorepo (deps de workspaces)
config.watchFolders = [monorepoRoot];

// 2. Resolver node_modules en orden: app primero, luego raíz
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Stubs para módulos Node.js que React Native no tiene.
//    Necesario porque @supabase/realtime-js arrastra `ws` (que importa stream/crypto/etc).
//    En React Native, Supabase Realtime usa el WebSocket global del browser, así que
//    estos imports nunca se ejecutan — solo necesitan resolver durante bundling.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  stream: stub,
  crypto: stub,
  http: stub,
  https: stub,
  net: stub,
  tls: stub,
  zlib: stub,
  buffer: stub,
  fs: stub,
  path: stub,
  os: stub,
  util: stub,
  events: stub,
  url: stub,
  querystring: stub,
  assert: stub,
  child_process: stub,
  dgram: stub,
  dns: stub,
  string_decoder: stub,
  timers: stub,
  tty: stub,
  vm: stub,
};

module.exports = config;
