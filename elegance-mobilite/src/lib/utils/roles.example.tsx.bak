/**
 * EXEMPLES D'UTILISATION DES UTILITAIRES DE RÔLES
 * 
 * Ce fichier montre comment utiliser les fonctions de rôles dans l'application
 * à aligner avec la base de données standardisée
 */

import { 
  isAdmin, 
  isDriver, 
  isCustomer, 
  isSuperAdmin,
  hasAnyRole,
  canAccessAdminPortal,
  canAccessDriverPortal,
  canAccessClientPortal,
  formatRoleName,
  getRoleColor,
  ROLES,
  getEffectiveRole
} from './roles'
import { AppRole } from '@/lib/types/common.types'

// ============================================================================
// EXEMPLE 1: Guard de route / middleware
// ============================================================================

// middleware.ts ou dans un composant
function checkRouteAccess(userRole: AppRole | undefined, path: string): boolean {
  if (path.startsWith('/backoffice-portal')) {
    return canAccessAdminPortal(userRole)
  }
  
  if (path.startsWith('/driver-portal')) {
    return canAccessDriverPortal(userRole)
  }
  
  if (path.startsWith('/client-portal') || path === '/dashboard') {
    return canAccessClientPortal(userRole)
  }
  
  return true // Routes publiques
}

// ============================================================================
// EXEMPLE 2: Composant React avec affichage conditionnel
// ============================================================================

import React from 'react'

interface User {
  id: string
  email: string
  role?: AppRole
}

interface DashboardProps {
  user: User
}

export function Dashboard({ user }: DashboardProps) {
  const userRole = getEffectiveRole(user.role)
  
  return (
    <div className="p-6">
      {/* Badge de rôle */}
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userRole)}`}>
        {formatRoleName(userRole)}
      </span>
      
      {/* Menu Admin - visible uniquement pour admins */}
      {isAdmin(userRole) && (
        <div className="mt-4 p-4 bg-orange-50 rounded-lg">
          <h3 className="font-semibold text-orange-800">Menu Administrateur</h3>
          <ul className="mt-2 space-y-1">
            <li><a href="/backoffice-portal/drivers">Gérer les chauffeurs</a></li>
            <li><a href="/backoffice-portal/rides">Voir toutes les courses</a></li>
            <li><a href="/backoffice-portal/rates">Configurer les tarifs</a></li>
          </ul>
        </div>
      )}
      
      {/* Section Super Admin - uniquement pour super admins */}
      {isSuperAdmin(userRole) && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border-2 border-red-200">
          <h3 className="font-semibold text-red-800">⚡ Super Admin</h3>
          <p className="text-red-600">Accès aux paramètres système</p>
          <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
            Configuration système
          </button>
        </div>
      )}
      
      {/* Section Chauffeur */}
      {isDriver(userRole) && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">Espace Chauffeur</h3>
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
            Voir mes courses
          </button>
        </div>
      )}
      
      {/* Section Client */}
      {isCustomer(userRole) && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-800">Réserver une course</h3>
          <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded">
            Nouvelle réservation
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EXEMPLE 3: Protection de composant avec RoleGuard
// ============================================================================

interface RoleGuardProps {
  userRole?: AppRole
  allowedRoles: AppRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ 
  userRole, 
  allowedRoles, 
  children, 
  fallback = <p>Accès non autorisé</p> 
}: RoleGuardProps) {
  if (hasAnyRole(userRole, allowedRoles)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

// Utilisation:
// <RoleGuard userRole={user.role} allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
//   <AdminPanel />
// </RoleGuard>

// ============================================================================
// EXEMPLE 4: Vérification avant action (bouton, formulaire)
// ============================================================================

export function CreateRideButton({ userRole }: { userRole?: AppRole }) {
  const canCreate = isCustomer(userRole) || isAdmin(userRole)
  
  return (
    <button 
      disabled={!canCreate}
      className={`px-4 py-2 rounded ${
        canCreate 
          ? 'bg-green-600 text-white hover:bg-green-700' 
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
      onClick={() => {
        if (canCreate) {
          // Créer la course
        }
      }}
    >
      Réserver une course
    </button>
  )
}

// ============================================================================
// EXEMPLE 5: Navigation conditionnelle
// ============================================================================

export function getNavigationItems(userRole?: AppRole) {
  const items = [
    { label: 'Accueil', href: '/', visible: true },
    { label: 'Mon profil', href: '/profile', visible: true },
  ]
  
  if (isAdmin(userRole)) {
    items.push(
      { label: 'Administration', href: '/backoffice-portal', visible: true },
      { label: 'Chauffeurs', href: '/backoffice-portal/drivers', visible: true },
      { label: 'Tarifs', href: '/backoffice-portal/rates', visible: true }
    )
  }
  
  if (isDriver(userRole)) {
    items.push(
      { label: 'Mes courses', href: '/driver-portal/rides', visible: true },
      { label: 'Mon véhicule', href: '/driver-portal/vehicle', visible: true }
    )
  }
  
  if (isCustomer(userRole)) {
    items.push(
      { label: 'Mes réservations', href: '/reservations', visible: true },
      { label: 'Nouvelle course', href: '/book', visible: true }
    )
  }
  
  return items
}

// ============================================================================
// EXEMPLE 6: API Route protection (Next.js)
// ============================================================================

// app/api/admin/users/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  
  const userRole = user.app_metadata?.role as AppRole
  
  if (!isAdmin(userRole)) {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }
  
  // Continuer avec la logique admin...
  const { data: users } = await supabase.from('users').select('*')
  
  return NextResponse.json({ users })
}

// ============================================================================
// EXEMPLE 7: Affichage d'une liste avec badge de rôle
// ============================================================================

interface UserListProps {
  users: Array<{ id: string; email: string; role?: AppRole }>
}

export function UserList({ users }: UserListProps) {
  return (
    <div className="space-y-2">
      {users.map(user => {
        const role = getEffectiveRole(user.role)
        
        return (
          <div 
            key={user.id} 
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <span className="font-medium">{user.email}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(role)}`}>
              {formatRoleName(role)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// TABLEAU DE CORRESPONDANCE BDD / FRONTEND
// ============================================================================

/*
 * FONCTION SQL (BDD)              | FONCTION TS (FRONTEND)       | USAGE
 * --------------------------------|------------------------------|---------------------------
 * is_admin()                      | isAdmin(role)                | Vérifie admin/super admin
 * is_super_admin()                | isSuperAdmin(role)           | Vérifie super admin uniq.
 * is_driver()                     | isDriver(role)               | Vérifie chauffeur
 * is_customer()                   | isCustomer(role)             | Vérifie client
 * get_user_role()                 | getEffectiveRole(role)       | Récupère le rôle effectif
 * has_any_role(allowed_roles)     | hasAnyRole(role, allowed)    | Vérifie rôle dans liste
 * 
 * SOURCE DE VÉRITÉ (BDD ET FRONTEND):
 * - auth.users.raw_app_meta_data->>'role' (serveur)
 * - user.app_metadata?.role (frontend Supabase)
 * 
 * RÔLES VALIDES:
 * - 'app_customer'  = Client
 * - 'app_driver'    = Chauffeur VTC  
 * - 'app_admin'     = Administrateur
 * - 'app_super_admin' = Super Admin
 */
