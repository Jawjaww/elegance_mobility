import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Assurer que window est disponible (côté client seulement)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      
      // Définir la correspondance initiale
      setMatches(media.matches);
      
      // Définir un écouteur pour les changements
      const listener = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Ajouter l'écouteur pour les changements de taille d'écran
      media.addEventListener('change', listener);
      
      // Nettoyage
      return () => {
        media.removeEventListener('change', listener);
      };
    }
    
    // Valeur par défaut pour le SSR
    return () => {};
  }, [query]);
  
  return matches;
}
