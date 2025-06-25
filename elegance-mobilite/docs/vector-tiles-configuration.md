# Documentation du système de carte vectorielle avec fallback

Ce document détaille l'implémentation et la configuration du système de cartes dans l'application Elegance Mobilité, incluant les tuiles vectorielles et le mécanisme de fallback.

## Architecture des cartes

L'application utilise une architecture de cartes moderne basée sur MapLibre GL JS, avec plusieurs niveaux de fallback :

1. **Proxy API prioritaire** - Notre API proxy interne pour contourner les problèmes CORS
2. **Sources vectorielles alternatives** - En cas d'échec de la source primaire
3. **Fallback raster** - OSM classique en dernier recours pour garantir l'affichage

## Erreurs CORS normales pendant le développement

Si vous voyez des erreurs CORS dans la console pendant le développement, c'est normal et attendu. Notre système gère automatiquement ces erreurs en :

1. Détectant les erreurs CORS/réseau
2. Basculant automatiquement vers une source alternative
3. Activant le fallback raster si toutes les sources vectorielles échouent

**Note importante** : La présence d'erreurs CORS dans la console n'est pas un problème tant que la carte s'affiche correctement. Ces erreurs font partie du processus normal de fallback.

## Séparation CSS

L'application utilise une séparation stricte des styles CSS :

- `map.css` : Styles globaux partagés
- `client-map.css` : Styles spécifiques au portail client
- `vector-map.css` : Styles optimisés pour les cartes vectorielles

Cette séparation permet d'éviter les conflits et d'adapter l'apparence selon le contexte (chauffeur vs client).

## Sources de tuiles vectorielles

Le système utilise plusieurs sources de tuiles vectorielles par ordre de priorité :

1. **MapLibre Demo Tiles** - Source principale, rapide et sans clé API
   ```
   https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.pbf
   ```

2. **MapTiler** - Alternative performante avec rendu optimisé
   ```
   https://maps.tilehosting.com/data/v3/{z}/{x}/{y}.pbf
   ```

3. **API Proxy** - Contourne les restrictions CORS en développement
   ```
   /api/proxy-map?url=https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.pbf
   ```

4. **Fallback Raster** - Tuiles OSM classiques en dernier recours
   ```
   https://tile.openstreetmap.org/{z}/{x}/{y}.png
   ```

## Mécanisme de fallback

Le système implémente un mécanisme de fallback intelligent à trois niveaux :

1. **Détection d'erreurs** - Capture les erreurs CORS, 404, 403, 429 et timeout
2. **Fallback progressif** - Tente chaque source vectorielle dans l'ordre suivant :
   - Notre proxy API interne (évite les problèmes CORS)
   - Source alternative via notre proxy (seconde chance)
   - Source directe (dernier essai, susceptible aux erreurs CORS)
3. **Fallback raster** - Si toutes les sources vectorielles échouent, active la couche OpenStreetMap
4. **Protection contextuelle** - Vérifie l'état de la carte avant chaque changement

### Comportement normal face aux erreurs CORS

En développement local (`localhost`), il est normal de voir des erreurs CORS dans la console car :

1. Les fournisseurs de tuiles vectorielles (MapTiler, etc.) bloquent souvent `localhost`
2. Notre système essaie ces sources puis bascule automatiquement sur notre proxy ou le raster
3. La carte s'affiche quand même correctement grâce au système de fallback

**Il n'y a pas lieu de s'inquiéter de ces erreurs tant que la carte est visible.**

## API Proxy CORS

Le système inclut un proxy API NextJS pour contourner les restrictions CORS :

- Endpoint : `/api/proxy-map`
- Utilisation : `/api/proxy-map?url=URL_ENCODEE`
- Headers ajoutés : CORS, cache, content-type
- Gestion des timeouts et des erreurs

## Performances optimisées

Configuration optimisée pour les performances :

- Cache limité pour économiser la mémoire
- Pas de rendu d'antialiasing ou de copies du monde 
- Pixelratio adapté au périphérique
- Compression et optimisation des glyphes

## Guide de maintenance

Pour ajouter une nouvelle source de tuiles vectorielles :

1. Ajouter l'entrée dans le tableau `vectorTileSources` dans `ClientConfirmationMap.tsx`
2. Respecter le typage `VectorSourceSpecification`
3. Tester avec et sans le proxy CORS

Pour modifier l'apparence des cartes vectorielles :

1. Éditer les styles dans `vector-map.css`
2. Ajuster les couches dans le style client dans `map.ts`
