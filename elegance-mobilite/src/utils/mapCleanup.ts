/**
 * Utilitaire de nettoyage global pour les cartes MapLibre
 */

export function cleanupMapCanvases() {
  try {
    // Nettoyage des contexts WebGL
    const canvases = document.querySelectorAll('.maplibregl-canvas');
    canvases.forEach((canvas) => {
      try {
        const gl = (canvas as HTMLCanvasElement).getContext('webgl');
        if (gl) {
          gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
      } catch (e) {
        console.warn("Impossible de nettoyer le contexte WebGL:", e);
      }
    });

    // Nettoyage des marqueurs
    document.querySelectorAll('.maplibregl-marker').forEach(el => {
      el.remove();
    });

    // Nettoyage des conteneurs
    document.querySelectorAll('.maplibregl-map').forEach(el => {
      try {
        // Tenter de récupérer et nettoyer l'instance de carte
        const mapInstance = (el as any)._map;
        if (mapInstance && typeof mapInstance.remove === 'function') {
          mapInstance.remove();
        }
      } catch (e) {
        console.error("Erreur lors du nettoyage de la carte:", e);
      }
      // Si impossible de nettoyer via l'API, nettoyer le DOM
      el.remove();
    });

    console.log("[MapLibre] Nettoyage global effectué");
    return true;
  } catch (e) {
    console.error("[MapLibre] Erreur lors du nettoyage global:", e);
    return false;
  }
}

// Ajouter un nettoyage global lors de la navigation
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanupMapCanvases);
}

export default cleanupMapCanvases;
