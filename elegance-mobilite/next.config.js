/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactiver les source maps pour éviter les erreurs de dev
  productionBrowserSourceMaps: false,
  
  // Supprimer les avertissements source map en développement
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
  
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src')
    };
    
    // Réduire les logs en développement et masquer les erreurs source map
    if (dev) {
      config.devtool = 'eval-cheap-module-source-map';
      // Supprimer les avertissements source map pour les extensions de navigateur
      config.ignoreWarnings = [
        /Failed to parse source map/,
        /source-map-loader/,
        /installHook\.js\.map/
      ];
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
