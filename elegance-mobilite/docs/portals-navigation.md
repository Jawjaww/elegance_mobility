# Architecture de Navigation par Portail

> **Date de mise à jour:** Février 2026  
> **Structure:** Next.js 15 avec App Router

---

## 🗺️ Vue d'Ensemble des Portails

```
┌─────────────────────────────────────────────────────────────────┐
│                     STRUCTURE DES PORTAILS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🌐 PUBLIC (/)                    👤 CLIENT (/my-account)       │
│  ───────────────────              ─────────────────────         │
│  /                                  /my-account                  │
│  /reservation                       /my-account/reservations     │
│  /contact                           /my-account/settings         │
│  /auth/*                            /rates                       │
│                                                                 │
│  🚗 DRIVER (/driver-portal)       ⚙️ ADMIN (/backoffice-portal) │
│  ──────────────────────────       ─────────────────────────     │
│  /driver-portal/dashboard           /backoffice-portal          │
│  /driver-portal/pending             /backoffice-portal/drivers  │
│  /driver-portal/profile             /backoffice-portal/rides    │
│  /driver-portal/login               /backoffice-portal/rates    │
│                                     /backoffice-portal/vehicles │
│                                     /backoffice-portal/login    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 1. Public Portal (`/(public-portal)`)

**Access:** Public (sans authentification)  
**Layout:** `src/app/(public-portal)/layout.tsx`

### Routes

| Route | Description | Composant |
|-------|-------------|-----------|
| `/` | Page d'accueil | `page.tsx` |
| `/reservation` | Réservation de course | `(public-portal)/reservation/page.tsx` |
| `/contact` | Page contact | `contact/page.tsx` |
| `/auth/*` | Authentification | `auth/login/page.tsx`, `auth/signup/page.tsx` |

### Caractéristiques
- Aucune vérification de rôle
- Accessible hors ligne (PWA)
- Header minimal

---

## 👤 2. Client Portal (`/(client-portal)`)

**Access:** `app_customer` uniquement  
**Layout:** `src/app/(client-portal)/layout.tsx`  
**Redirection:** Non connecté → `/auth/login`

### Routes

| Route | Description | Rôle Requis |
|-------|-------------|-------------|
| `/my-account` | Dashboard client | `app_customer` |
| `/my-account/reservations` | Liste des réservations | `app_customer` |
| `/my-account/reservations/[id]` | Détail réservation | `app_customer` |
| `/my-account/reservations/[id]/edit` | Modifier réservation | `app_customer` |
| `/my-account/settings` | Paramètres du compte | `app_customer` |
| `/rates` | Affichage des tarifs | `app_customer` |

### Caractéristiques
- Header avec avatar utilisateur
- Navigation mobile (bottom nav)
- Menu utilisateur déroulant

### Vérification d'Accès
```typescript
// Dans le layout
const userRole = getAppRole(user);
if (userRole !== 'app_customer') {
  redirect('/auth/login');
}
```

---

## 🚗 3. Driver Portal (`/driver-portal`)

**Access:** `app_driver` uniquement  
**Layout:** `src/app/driver-portal/layout.tsx`  
**Redirection:** Non connecté → `/driver-portal/login`

### Routes

| Route | Description | Rôle Requis | Statut Driver |
|-------|-------------|-------------|---------------|
| `/driver-portal/login` | Connexion chauffeur | Public | - |
| `/driver-portal/dashboard` | Dashboard chauffeur | `app_driver` | `active` |
| `/driver-portal/pending` | Page d'attente | `app_driver` | `pending_validation` |
| `/driver-portal/profile` | Profil chauffeur | `app_driver` | Tous sauf `incomplete` |
| `/driver-portal/profile/setup` | Configuration initiale | `app_driver` | `incomplete` |

### Workflow de Navigation

```
Inscription Driver
       │
       ▼
/driver-portal/login ──(connexion)──▶ Vérifie statut
       │                                    │
       ▼                                    ▼
incomplete ─────────────────────────▶ /profile/setup
       │                                    │
       ▼ (profil complété)                ▼ (complété)
pending_validation ─────────────────▶ /pending
       │                                    │
       ▼ (admin approuve)                ▼
active ─────────────────────────────▶ /dashboard
       │
       ▼
Accepte des courses
```

### Vérification d'Accès
```typescript
// Dans le layout
const userRole = getAppRole(user);
if (userRole !== 'app_driver') {
  redirect('/driver-portal/login');
}

// Puis vérification du statut driver
const { status } = await getDriverStatus(user.id);
switch (status) {
  case 'incomplete': redirect('/driver-portal/profile/setup');
  case 'pending_validation': redirect('/driver-portal/pending');
  case 'active': allow_access;
  default: redirect('/driver-portal/login');
}
```

---

## ⚙️ 4. Backoffice Portal (`/backoffice-portal`)

**Access:** `app_admin` ou `app_super_admin`  
**Layout:** `src/app/backoffice-portal/layout.tsx`  
**Redirection:** Non connecté → `/backoffice-portal/login`

### Routes

| Route | Description | Rôle Requis |
|-------|-------------|-------------|
| `/backoffice-portal/login` | Connexion admin | Public |
| `/backoffice-portal` | Dashboard admin | `app_admin` |
| `/backoffice-portal/drivers` | Gestion chauffeurs | `app_admin` |
| `/backoffice-portal/drivers/pending` | Validation en attente | `app_admin` |
| `/backoffice-portal/rides` | Gestion des courses | `app_admin` |
| `/backoffice-portal/rides/pending` | Courses en attente | `app_admin` |
| `/backoffice-portal/rides/today` | Courses du jour | `app_admin` |
| `/backoffice-portal/vehicles` | Gestion véhicules | `app_admin` |
| `/backoffice-portal/rates` | Gestion des tarifs | `app_admin` |
| `/backoffice-portal/options` | Gestion des options | `app_admin` |
| `/backoffice-portal/promo-codes` | Codes promo | `app_admin` |
| `/backoffice-portal/chauffeurs` | Vue chauffeurs (alt) | `app_admin` |
| `/backoffice-portal/courses` | Vue courses (alt) | `app_admin` |

### Caractéristiques
- Interface d'administration complète
- Tableaux de données (data tables)
- Formulaires de création/édition
- Navigation latérale (sidebar)

### Vérification d'Accès
```typescript
// Dans le layout
const userRole = getAppRole(user);
if (!['app_admin', 'app_super_admin'].includes(userRole)) {
  redirect('/backoffice-portal/login');
}
```

---

## 🔐 Redirections par Rôle

| Rôle Détecté | Destination | Raison |
|--------------|-------------|--------|
| `app_customer` | `/my-account` | Portail client |
| `app_driver` (active) | `/driver-portal/dashboard` | Portail chauffeur |
| `app_driver` (pending) | `/driver-portal/pending` | En attente validation |
| `app_driver` (incomplete) | `/driver-portal/profile/setup` | Profil incomplet |
| `app_admin` | `/backoffice-portal` | Portail admin |
| `app_super_admin` | `/backoffice-portal` | Portail admin |
| Non connecté | `/auth/login` | Authentification requise |

---

## 🧭 Structure des Layouts

```typescript
// src/app/(client-portal)/layout.tsx
export default async function ClientLayout({ children }) {
  const user = await getServerUser();
  if (!user || getAppRole(user) !== 'app_customer') {
    redirect('/auth/login');
  }
  return (
    <ClientHeader user={user}>
      {children}
    </ClientHeader>
  );
}

// src/app/driver-portal/layout.tsx
export default async function DriverLayout({ children }) {
  const user = await getServerUser();
  if (!user || getAppRole(user) !== 'app_driver') {
    redirect('/driver-portal/login');
  }
  // Vérification statut driver...
  return (
    <DriverHeader user={user}>
      {children}
    </DriverHeader>
  );
}
```

---

## 📱 Navigation Mobile

| Portail | Navigation | Description |
|---------|------------|-------------|
| Public | Header fixe | Liens simples |
| Client | Bottom nav | Accueil, Réservations, Profil |
| Driver | Bottom nav | Dashboard, Courses, Profil |
| Admin | Sidebar + Header | Menu latéral complet |

---

## 🚫 Pages d'Erreur

| Route | Usage | Déclencheur |
|-------|-------|-------------|
| `/auth/login` | Connexion requise | Accès protégé sans session |
| `/unauthorized` | Rôle invalide | Mauvais rôle pour le portail |
| `/driver-portal/pending` | En attente | Driver `pending_validation` |

---

## 📚 Documentation Connexe

- [driver-workflow.md](./driver-workflow.md) - Workflow chauffeur détaillé
- [ARCHITECTURE-ROLES.md](./ARCHITECTURE-ROLES.md) - Système de rôles
- [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) - Structure BDD

---

**Dernière mise à jour:** Février 2026  
**Vérification des routes:** OK (toutes les routes existent dans `src/app/`)
