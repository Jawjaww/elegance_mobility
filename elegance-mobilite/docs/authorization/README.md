# Authentification et Autorisation

## Vue d'ensemble

Le système d'authentification et d'autorisation utilise Supabase Auth avec des politiques Row Level Security (RLS) personnalisées.

## Rôles Utilisateurs

```typescript
type UserRole = 'superAdmin' | 'admin' | 'client' | 'driver'
```

### Hiérarchie des rôles
- superAdmin: Accès complet au système
- admin: Gestion des opérations quotidiennes
- driver: Accès aux courses assignées
- client: Réservation et suivi des courses

## Politiques de Sécurité

Les politiques sont définies dans `/database/migrations/20250225_03_policies.sql` :

### Utilisateurs
- Lecture: Profil personnel uniquement
- Modification: Données personnelles uniquement
- Création: Via processus d'inscription

### Chauffeurs
- Lecture: Admins et chauffeur concerné
- Modification: Admins uniquement
- Création: Admins uniquement

### Courses
- Lecture: Client concerné, chauffeur assigné, admins
- Modification: Statut par chauffeur assigné, tout par admin
- Création: Clients et admins

### Promotions
- Lecture: Codes actifs pour clients, tout pour admins
- Création/Modification: Admins uniquement
- Utilisation: Vérification automatique des conditions

## Configuration

Le fichier `20250226_01_setup_admin_policies.sql` contient les politiques spécifiques aux administrateurs.

Pour plus de détails techniques, consultez [/docs/architecture/database.md](/docs/architecture/database.md).
