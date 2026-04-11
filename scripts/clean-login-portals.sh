#!/bin/bash

# Suppression des pages de login obsolètes
echo "Suppression des pages de login redondantes..."

# Portail backoffice
rm -rf src/app/backoffice-portal/login

# Portail chauffeur
rm -rf src/app/driver-portal/login

echo "Mise à jour des redirections..."

# Mettre à jour les importations dans les composants
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/import.*from.*\/backoffice-portal\/login.*//g'
find src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/import.*from.*\/driver-portal\/login.*//g'

echo "Nettoyage terminé. Toutes les authentifications passent désormais par /login"