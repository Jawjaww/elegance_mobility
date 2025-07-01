/**
 * Hook pour stabiliser les références des données de courses
 * Utilise une comparaison profonde basée sur le contenu sémantique
 * pour éviter les re-renders inutiles causés par de nouveaux objets JavaScript
 */

import { useMemo, useRef } from 'react'
import type { Database } from '@/lib/types/database.types'

type RideRow = Database['public']['Tables']['rides']['Row']

/**
 * Génère une clé stable basée sur le contenu sémantique des courses
 */
function createRideStabilityKey(rides: RideRow[]): string {
  if (!rides?.length) return 'empty'
  
  return rides
    .map(ride => `${ride.id}:${ride.status}:${ride.pickup_time}:${ride.driver_id || 'null'}`)
    .sort() // Sort pour éviter les problèmes d'ordre
    .join('|')
}

/**
 * Hook qui stabilise les références des courses disponibles
 * Retourne la même référence tant que le contenu sémantique n'a pas changé
 */
export function useStableRides(rides: RideRow[] | undefined): RideRow[] {
  const stableRef = useRef<RideRow[]>([])
  const lastKeyRef = useRef<string>('')
  
  return useMemo(() => {
    // Gestion défensive pour les cas undefined/null
    const currentRides = Array.isArray(rides) ? rides : []
    const currentKey = createRideStabilityKey(currentRides)
    
    // Si la clé n'a pas changé, retourner la référence stable
    if (currentKey === lastKeyRef.current && stableRef.current.length > 0) {
      console.log('✅ Stable rides: reference preserved (key:', currentKey, ') - Total rides:', currentRides.length)
      return stableRef.current
    }
    
    // Nouvelle donnée détectée, mettre à jour
    console.log('🔄 Stable rides: new data detected - Previous key:', lastKeyRef.current, 'New key:', currentKey, 'Total rides:', currentRides.length)
    lastKeyRef.current = currentKey
    stableRef.current = currentRides
    
    return currentRides
  }, [rides])
}

/**
 * Hook pour stabiliser les courses de la carte
 * Combine isOnline et les courses disponibles avec mémorisation stable
 */
export function useStableMapRides(availableRides: RideRow[], isOnline: boolean): RideRow[] {
  return useMemo(() => {
    const mapRides = isOnline ? availableRides : []
    console.log('🗺️ Map rides (stable):', { 
      isOnline, 
      ridesCount: mapRides.length,
      rideIds: mapRides.map(r => r.id)
    })
    return mapRides
  }, [isOnline, availableRides])
}
