// FIX MAPLIBRE - Corrections à appliquer dans MapLibreMap.tsx

// 🔧 PROBLÈME 1 : Condition de création trop stricte
// AVANT (ligne ~608):
if (!departure && !destination) return;

// APRÈS - Remplacer par:
if (!departure && !destination && !showFullMap) return;

// 🔧 PROBLÈME 2 : Timeout de nettoyage automatique trop agressif  
// AVANT (ligne ~564):
const cleanupTimeout = setTimeout(() => {
  if (map.current) {
    console.log(`[MapLibre ${mapInstanceIdRef.current}] Force cleanup après timeout`);
    cleanupMap();
  }
}, 60000); // 1 minute de délai maximum

// APRÈS - Remplacer par:
const cleanupTimeout = setTimeout(() => {
  if (map.current && !isMountedRef.current) { // Seulement si démonté
    console.log(`[MapLibre ${mapInstanceIdRef.current}] Force cleanup après timeout`);
    cleanupMap();
  }
}, 300000); // 5 minutes au lieu de 1 minute

// 🔧 PROBLÈME 3 : Ajouter une prop pour stabiliser la carte
// Dans les props du composant, ajouter:
interface MapLibreMapProps {
  // ...props existantes...
  persistent?: boolean; // Nouvelle prop pour éviter la destruction automatique
}

// 🔧 PROBLÈME 4 : Condition de stabilité
// Ajouter cette condition au début du useEffect principal:
useEffect(() => {
  // Éviter la recréation si la carte existe déjà et fonctionne
  if (map.current && mapLoaded && !map.current.getCanvas()?.getContext('webgl')?.isContextLost()) {
    return; // Carte stable, ne pas recréer
  }
  
  // ...reste du code...
}, [departure, destination, mapContainer]);

// 🔧 PROBLÈME 5 : Meilleure gestion du WebGL context lost
// Ajouter cet event listener dans la création de la carte:
map.current.on('webglcontextlost', () => {
  console.warn(`[MapLibre ${mapInstanceIdRef.current}] WebGL context lost - Tentative de récupération`);
  
  // Attendre un peu avant de recréer
  setTimeout(() => {
    if (map.current && mapContainer.current) {
      try {
        map.current.getCanvas().getContext('webgl')?.getExtension('WEBGL_lose_context')?.restoreContext();
      } catch (e) {
        console.error('Impossible de restaurer le contexte WebGL:', e);
        // Recréer la carte seulement si nécessaire
        cleanupMap();
        // Marquer pour recréation lors du prochain render
        setMapLoaded(false);
      }
    }
  }, 1000);
});
