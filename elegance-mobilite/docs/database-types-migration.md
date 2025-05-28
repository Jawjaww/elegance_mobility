# Migration vers les Types Générés par Supabase

## Contexte

Suite à la génération des types avec la commande Supabase CLI :

```bash
npx supabase gen types typescript --project-id iodsddzustunlahxafif --schema public > src/lib/databasee.types.ts
Structure des Types
Les nouveaux types générés ont une structure plus complète :

Database['public']['Tables']['vehicles']['Row']      // Pour les lignes
Database['public']['Tables']['vehicles']['Insert']   // Pour l'insertion
Database['public']['Tables']['vehicles']['Update']   // Pour la mise à jour
Database['public']['Enums']['vehicle_type_enum']    // Pour les énumérations
Actions Requises
1. Mise à jour du fichier vehicle.ts
// Ancien code
export type Vehicle = Database['public']['vehicles']['Row']

// Nouveau code
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type NewVehicle = Database['public']['Tables']['vehicles']['Insert']
export type UpdateVehicle = Database['public']['Tables']['vehicles']['Update']
export type VehicleType = Database['public']['Enums']['vehicle_type_enum']
2. Recommendations
Utilisation des Types

Toujours utiliser la structure Database['public']['Tables'][table]['Row'] pour les types de table
Utiliser Database['public']['Enums'][enum] pour les énumérations
Privilégier les types générés plutôt que des types manuels
Renommage du Fichier

Renommer databasee.types.ts en database.types.ts pour corriger la faute de frappe
Mettre à jour les imports dans les fichiers concernés
Validation

Vérifier la compatibilité avec les politiques de sécurité RLS existantes
S'assurer que tous les types utilisés dans l'application correspondent à la structure de la base de données
Migration Progressive

Identifier tous les fichiers utilisant les anciens types
Planifier une mise à jour progressive
Tester chaque modification pour éviter les régressions
Avantages
Types plus précis et maintenus automatiquement
Meilleure cohérence avec la base de données
Détection plus précoce des erreurs
Simplification de la maintenance
Prochaines Étapes
Passer en mode Code pour implémenter ces changements
Mettre à jour les autres fichiers utilisant les types de base de données
Valider les changements avec les tests existants
```
