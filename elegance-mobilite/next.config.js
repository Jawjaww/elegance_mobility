/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src')
    };
    return config;
  },
  // Ignorer les erreurs de prerender pendant le build
  typescript: {
    ignoreBuildErrors: false, // Garder false pour voir les vraies erreurs de type
  },
  eslint: {
    ignoreDuringBuilds: true, // Désactiver ESLint pendant le build
  },
  // Désactiver la génération statique pour les pages qui utilisent des données dynamiques
  output: 'standalone',
};

module.exports = nextConfig;
