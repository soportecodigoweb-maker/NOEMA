import type { NextConfig } from 'next';

const config: NextConfig = {
  // Build standalone (~100MB en lugar de todo node_modules) — para Docker
  output: 'standalone',
  reactStrictMode: true,
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
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
};

export default config;
