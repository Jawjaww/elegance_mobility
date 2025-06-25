/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactiver les source maps pour éviter les erreurs de dev
  productionBrowserSourceMaps: false,
  
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src')
    };
    
    // Réduire les logs en développement
    if (dev) {
      config.devtool = 'eval-cheap-module-source-map';
    }
    
    // Configuration pour supporter MapLibre GL correctement
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    });
    
    // Ignorer les importations côté serveur de MapLibre
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };
    
    return config;
  }
};

module.exports = nextConfig;
