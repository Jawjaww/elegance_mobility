
# Sommaire Documentation Elegance Mobilité

> **Sources de vérité et statut documentaire**
>
> - **database.types.ts** (généré par Supabase) = schéma réel de la base, toujours à jour.
> - **Scripts SQL** (ex : fix-jwt-rls-final.sql) = à utiliser uniquement si explicitement référencé dans la doc centrale. Marquer comme obsolète si non appliqué.
> - **ARCHITECTURE-COMPLETE-SYSTEM-2025.md** = logique métier, triggers, sécurité, à jour.
> - **README.md** = instructions d'installation, doit être maintenu à jour.
> - **Chaque fichier** doit comporter en haut :
>   - `> Dernière mise à jour : AAAA-MM-JJ`
>   - `> Statut : généré automatiquement / à jour / obsolète / à ne pas modifier manuellement`

---

> **Dernière mise à jour : 4 juillet 2025**

## Vue d'ensemble
- [ARCHITECTURE-COMPLETE-SYSTEM-2025.md](./ARCHITECTURE-COMPLETE-SYSTEM-2025.md)  
  _Documentation centrale, logique métier, triggers, sécurité, complétude, statuts._
- [README.md](./README.md)  
  _Guide d'installation, démarrage rapide, structure du projet._

## Guides pratiques
- [GUIDE-UTILISATION-RAPIDE.md](./GUIDE-UTILISATION-RAPIDE.md)  
  _Exemples d'intégration, commandes courantes, dashboard admin._
- [project-architecture-overview.md](./project-architecture-overview.md)  
  _Vue synthétique de l'architecture, patterns frontend/backend._
- [tanstack-zustand-migration.md](./tanstack-zustand-migration.md)  
  _Migration état serveur/UI, patterns avancés React._

## Référence technique
- [roles-rls-architecture-finale.md](./roles-rls-architecture-finale.md)  
  _RLS, sécurité, patterns JWT._
- [supabase-typing-best-practices.md](./supabase-typing-best-practices.md)  
  _Types, conventions, bonnes pratiques._
- [fix-jwt-rls-final.sql](../scripts/fix-jwt-rls-final.sql)  
  _Script SQL sécurité._

## Maintenance & Migration
- [NETTOYAGE-EFFECTUE.md](./NETTOYAGE-EFFECTUE.md)  
  _Historique de nettoyage, migrations, suppression d'obsolètes._
- [MIGRATION_PLAN.md](../MIGRATION_PLAN.md)  
  _Plan de migration technique._

## FAQ & Dépannage
- [SOLUTION-ERREURS-403-FINALE.md](./SOLUTION-ERREURS-403-FINALE.md)  
  _Résolution des erreurs courantes._
- [loading-system-guide.md](./loading-system-guide.md)  
  _Guide de gestion du chargement._

## Obsolètes ou à archiver
- [debug_check_driver_profile_completeness.sql](../scripts/debug_check_driver_profile_completeness.sql)  
  _Obsolète, à supprimer si non utilisé._
- [diagnostic-*.sql](../scripts/)  
  _Scripts de diagnostic anciens._

---

> **Astuce :** Chaque fichier doit comporter en haut la date de dernière modification (format : `> Dernière mise à jour : ...`).
> Pour fusionner, privilégier la centralisation des logiques métier et des patterns réutilisables. Pour isoler, garder les guides d'intégration ou de migration spécifiques.
> Marquer explicitement les fichiers obsolètes ou à archiver.
