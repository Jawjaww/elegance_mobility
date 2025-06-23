/**
 * Configuration optimisée pour app chauffeur mobile
 * Vector tiles gratuits pour performances maximales
 */

export const mapConfig = {
  // Position par défaut (Paris)
  defaultCenter: [2.3522, 48.8566] as [number, number], // [lng, lat] pour MapLibre
  defaultZoom: 12,
  
  // Style vectoriel gratuit optimisé pour chauffeurs
  style: 'https://demotiles.maplibre.org/style.json',
  
  // OU style personnalisé pour thème sombre chauffeur
  customStyle: {
    version: 8,
    sources: {
      'openmaptiles': {
        type: 'vector',
        tiles: [
          // Protomaps - Vector tiles OSM gratuits
          'https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.mvt'
        ],
        minzoom: 0,
        maxzoom: 14
      }
    },
    layers: [
      // Fond sombre pour conduite de nuit
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#0a0a0a'
        }
      },
      // Routes principales bien visibles
      {
        id: 'roads-major',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'trunk', 'primary', 'secondary'],
        paint: {
          'line-color': '#404040',
          'line-width': {
            base: 1.4,
            stops: [[6, 1], [20, 30]]
          }
        }
      },
      // Routes secondaires
      {
        id: 'roads-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'tertiary', 'minor', 'service'],
        paint: {
          'line-color': '#2a2a2a',
          'line-width': {
            base: 1.4,
            stops: [[8, 0.5], [20, 20]]
          }
        }
      },
      // Étiquettes des rues
      {
        id: 'road-labels',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        layout: {
          'text-field': '{name}',
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
          'symbol-placement': 'line',
          'text-rotation-alignment': 'map'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 1
        }
      }
    ]
  },
  
  // Configuration performance optimisée mobile
  performance: {
    // Limite le cache pour économiser mémoire
    maxTileCacheSize: 30,
    // Pas de copies du monde
    renderWorldCopies: false,
    // Antialiasing désactivé = plus rapide
    antialias: false,
    // Qualité adaptée à l'écran
    pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1,
    // Préchargement intelligent
    maxPitch: 60,
    maxZoom: 18
  },
  
  // Attribution pour les sources gratuites
  attribution: '© <a href="https://protomaps.com/">Protomaps</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}