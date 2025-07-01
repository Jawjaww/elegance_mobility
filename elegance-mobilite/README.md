# 🚀 Elegance Mobilité - Plateforme de Transport

Application Next.js complète pour la gestion de courses de transport avec chauffeurs.

## ✅ Statut du Projet

- ✅ **Erreurs 403 Supabase** : Résolues définitivement (30 juin 2025)
- ✅ **Authentification** : Fonctionnelle avec RLS
- ✅ **Driver Portal** : Opérationnel
- ✅ **Mapping** : MapLibre intégré et stable

## 🚀 Démarrage Rapide

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev

# Ouvrir http://localhost:3000
```

## 📁 Architecture

```
src/
├── app/                 # Pages Next.js (App Router)
├── components/          # Composants React réutilisables
├── hooks/              # Hooks personnalisés (TanStack Query)
├── lib/                # Configuration et utilitaires
├── store/              # Gestion d'état (Zustand)
└── types/              # Types TypeScript

docs/                   # Documentation technique
scripts/                # Scripts de maintenance DB
```

## 🛡️ Sécurité & RLS

Les politiques Row Level Security (RLS) de Supabase utilisent le JWT pour l'autorisation :

```sql
-- ✅ Politique correcte (utilise le JWT)
(auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'app_driver'
```

**📖 Documentation complète :** `docs/SOLUTION-ERREURS-403-FINALE.md`

## 🧹 Maintenance

```bash
# Nettoyage des fichiers obsolètes
chmod +x scripts/cleanup-obsolete-files.sh
./scripts/cleanup-obsolete-files.sh
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
