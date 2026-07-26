import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  // Salida standalone para imagen Docker mínima (self-hosted en VPS)
  output: 'standalone',
  // Packages del monorepo que Next debe transpilar
  transpilePackages: [
    '@noema/ui',
    '@noema/database',
    '@noema/i18n',
    '@noema/ai',
    '@noema/config',
  ],
  experimental: {
    // serverActions están on por default en Next 15
    optimizePackageImports: ['lucide-react', 'date-fns'],
    // En monorepo, Next necesita saber dónde está la raíz para tracing
  },
  outputFileTracingRoot: require('path').join(__dirname, '../..'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.agentecodigoweb.com' },
      { protocol: 'https', hostname: '*.somosnoema.com' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
};

export default config;
