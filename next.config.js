/** @type {import('next').NextConfig} */
const path = require('node:path');

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
  // NOTE: removed static `output: 'export'` to allow server runtime (API routes)
  // The project previously used static export for Tauri packaging. Server APIs
  // are required for secure uploads and cannot be used with `output: 'export'`.
  images: {
    unoptimized: true,
    // Next 16 will require explicit qualities; keep common values allowed.
    qualities: [75, 90],
  },
};

module.exports = nextConfig;
