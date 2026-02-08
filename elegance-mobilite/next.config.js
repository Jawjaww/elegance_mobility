/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname, "src"),
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
  // Configuration Tauri-Ready : Export statique
  output: "export",
  // Désactiver l'optimisation d'images pour le mode export (Tauri-compatible)
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
