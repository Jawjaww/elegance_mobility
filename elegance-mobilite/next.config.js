/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname, "src"),
    };
    return config;
  },
  // Ignorer les erreurs de prerender pendant le build
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Configuration Tauri-Ready : Export statique
  output: "export",
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
