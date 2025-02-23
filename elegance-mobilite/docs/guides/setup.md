# Guide d'installation

## Prérequis

- Node.js 18+ (LTS recommandé)
- PostgreSQL 14+
- Git
- Compte Supabase
- Compte Vercel (optionnel pour le déploiement)

## Installation

### 1. Cloner le projet

```bash
git clone git@github.com:elegance-mobilite/elegance-mobilite.git
cd elegance-mobilite
```

### 2. Installation des dépendances

```bash
npm install
```

### 3. Configuration de l'environnement

```bash
# Copier le fichier d'exemple
cp .env.local.example .env.local

# Éditer les variables suivantes :
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
```

### 4. Configuration de la base de données

```bash
# Créer la base de données
psql -c "CREATE DATABASE elegance_mobilite"

# Exécuter les migrations
cd database/migrations
psql -d elegance_mobilite -f 20250223_clean_and_setup_database.sql
psql -d elegance_mobilite -f 20250223_create_initial_users.sql
psql -d elegance_mobilite -f 20250223_create_promotions_tables.sql
```

### 5. Configuration de Supabase

1. Créer un projet sur [Supabase](https://app.supabase.io)
2. Dans "Settings > Database", récupérer l'URL de connexion
3. Dans "Settings > API", récupérer la clé anon
4. Configurer l'authentification email/password

### 6. Lancer le projet

```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

## Configuration des services externes

### Leaflet (Cartographie)

```typescript
// src/config/leaflet.ts
export const MAPBOX_TOKEN = 'votre_token_mapbox'
```

### Stripe (Paiements)

```typescript
// src/config/stripe.ts
export const STRIPE_PUBLIC_KEY = 'votre_cle_publique_stripe'
export const STRIPE_SECRET_KEY = 'votre_cle_secrete_stripe'
```

### SendGrid (Emails)

```typescript
// src/config/email.ts
export const SENDGRID_API_KEY = 'votre_cle_sendgrid'
```

## Tests

```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Tests e2e
npm run test:e2e
```

## Configuration de l'IDE

### VSCode

Extensions recommandées :
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- PostCSS Language Support

Settings recommandés :
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Dépannage

### Problèmes courants

1. **Erreur de connexion à la base de données**
```bash
# Vérifier que PostgreSQL est lancé
sudo service postgresql status

# Vérifier les permissions
sudo -u postgres psql -c "\du"
```

2. **Erreur de build Next.js**
```bash
# Nettoyer le cache
rm -rf .next
npm run build
```

3. **Erreur d'authentification Supabase**
```bash
# Vérifier les variables d'environnement
cat .env.local
# Vérifier les clés dans la console Supabase
```

## Mise à jour

```bash
# Mettre à jour les dépendances
npm update

# Exécuter les nouvelles migrations
cd database/migrations
psql -d elegance_mobilite -f nouvelle_migration.sql
```

## Support

- Documentation Supabase : [docs.supabase.io](https://docs.supabase.io)
- Documentation Next.js : [nextjs.org/docs](https://nextjs.org/docs)
- Support technique : [support@elegance-mobilite.com](mailto:support@elegance-mobilite.com)
