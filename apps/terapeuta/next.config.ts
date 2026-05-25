import type { NextConfig } from 'next';

const config: NextConfig = {
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
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
};

export default config;
