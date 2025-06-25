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
  
  // Attribution pour les cartes
  osmAttribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  
  // Sources vectorielles disponibles sans clé API ni problèmes CORS
  vectorTileSources: {
    // MapTiler Tiles - Open source, sans CORS, très performant
    maptiler: {
      type: 'vector',
      tiles: ['https://maps.tilehosting.com/data/v3/{z}/{x}/{y}.pbf.pict?key=U0qxfqPQMf6VrIc2Gng3'],
      maxzoom: 14
    },
    // Maplibre demo - Parfait pour le développement
    maplibre: {
      type: 'vector',
      tiles: ['https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.pbf'],
      maxzoom: 14
    },
    // OSM2VectorTiles - Alternative sans clé
    osm2vectortiles: {
      type: 'vector',
      tiles: ['https://osm2vectortiles-0.tileserver.com/v3/{z}/{x}/{y}.pbf'],
      maxzoom: 14
    },
    // GeoBasis NRW - Tuiles européennes bien optimisées
    geobasisNrw: {
      type: 'vector',
      tiles: ['https://www.wms.nrw.de/geobasis/wms_nw_dtk?version=2.0.0&service=WMS&request=GetMap&layers=nw_dtk_sw&styles=&format=application/x-protobuf;type=mapbox-vector&transparent=true&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}'],
      maxzoom: 14
    }
  },
  
  // Style vectoriel client clair (style général pour portail client)
  clientVectorStyle: {
    version: 8,
    sources: {
      'openmaptiles': {
        type: 'vector',
        tiles: ['https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }
    },
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    layers: [
      // Fond clair pour meilleure lisibilité côté client
      {
        id: 'background',
        type: 'background',
        paint: {
          'background-color': '#f8f8f8'
        }
      },
      // Eau
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: {
          'fill-color': '#c8e1f9'
        }
      },
      // Bâtiments
      {
        id: 'buildings',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        paint: {
          'fill-color': '#e0e0e0',
          'fill-outline-color': '#d0d0d0'
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
          'line-color': '#c0c0c0',
          'line-width': {
            base: 1.4,
            stops: [[6, 1], [20, 20]]
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
          'line-color': '#d8d8d8',
          'line-width': {
            base: 1.4,
            stops: [[8, 0.5], [20, 15]]
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
          'text-font': ['Noto Sans Regular', 'Arial Unicode MS Regular'],
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
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}