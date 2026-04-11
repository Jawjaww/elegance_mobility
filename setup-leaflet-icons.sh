#!/bin/bash

# Créer le répertoire pour les images
mkdir -p public/images

# Télécharger les icônes Leaflet
curl -o public/images/marker-icon.png https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png
curl -o public/images/marker-icon-2x.png https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png
curl -o public/images/marker-shadow.png https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png

echo "Icônes Leaflet téléchargées avec succès dans le dossier public/images/"
