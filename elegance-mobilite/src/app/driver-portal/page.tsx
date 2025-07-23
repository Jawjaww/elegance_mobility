'use client'

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { supabase } from '@/lib/database/client'
import { ProfileAlert } from "@/components/drivers/ProfileAlert"
import { useDriverProfileCompleteness } from "@/hooks/useDriverProfileCompleteness"
import { StatsIsland } from "@/components/drivers/StatsIsland"
import { BottomSheet } from "@/components/drivers/BottomSheet"
import { SwipeableTabs } from "@/components/drivers/SwipeableTabs"
import MapLibreWrapper from "@/components/map/MapLibreWrapper"
import { AvailableRideCard } from "@/components/drivers/AvailableRideCard"
import { TodayRideCard } from "@/components/drivers/TodayRideCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { useDriverUIStore } from "@/lib/stores/driverUIStore"
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentDriverProfile, useAvailableRides, useScheduledRides, useCurrentDriverStats } from "@/hooks/queries"
import { useAcceptRide, useStartRide, useCompleteRide } from "@/hooks/queries/useRides"
import { useCurrentDriverRealtime } from "@/hooks/queries/useRealtime"
import { useStableRides, useStableMapRides } from "@/hooks/useStableRides"
import { rideKeys } from '@/lib/api/rides'
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { Database } from "@/lib/types/database.types"

type RideRow = Database["public"]["Tables"]["rides"]["Row"]

// Hook pour gérer la hauteur de l'écran de manière sécurisée (SSR-safe)
function useViewportHeight() {
  const [height, setHeight] = useState(800) // Valeur par défaut pour SSR

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateHeight = () => setHeight(window.innerHeight)
      updateHeight() // Set initial height
      window.addEventListener('resize', updateHeight)
      return () => window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return height
}

// Mock statistiques pour l'île
const mockStatsData = {
  todayStats: {
    rides: 3,
    earnings: 8750,
    hours: 6,
    rating: 4.8
  },
  weekStats: {
    rides: 18,
    earnings: 52400,
    hours: 35,
    rating: 4.7
  },
  monthStats: {
    rides: 76,
    earnings: 218300,
    hours: 142,
    rating: 4.8
  }
}

// Les courses sont maintenant fournies par useAvailableRides et useScheduledRides
// via TanStack Query + Supabase Realtime

export default function DriverDashboard() {
  // Hook pour la hauteur de l'écran (SSR-safe)
  const viewportHeight = useViewportHeight()
  
  // TanStack QueryClient pour les invalidations manuelles
  const queryClient = useQueryClient()
  
  // Router pour les redirections
  const router = useRouter()
  
  // État d'authentification
  const [user, setUser] = useState<any>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  
  // Hook pour vérifier la complétude du profil
  const { data: profileCompleteness, isLoading: isLoadingProfile } = useDriverProfileCompleteness(user?.id)
  const isProfileComplete = profileCompleteness?.is_complete || false
  
  // Récupérer l'utilisateur authentifié
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user) {
        console.log('✅ Utilisateur authentifié dans dashboard:', user)
        setUser(user)
      }
      setIsLoadingAuth(false)
    }
    getUser()
  }, [])
  
  // TanStack Query hooks for server state - seulement si user existe
  const { data: driverProfile } = useCurrentDriverProfile()
  const { data: availableRides = [], isLoading: isLoadingAvailableRides } = useAvailableRides()
  const { data: todayRides = [], isLoading: isLoadingTodayRides } = useScheduledRides()
  const { data: todayStats } = useCurrentDriverStats('today')
  
  // Zustand store for UI state
  const { isOnline, setIsOnline } = useDriverUIStore()
  
  // Setup realtime synchronization for current driver
  useCurrentDriverRealtime()
  
  // État local pour gérer les courses entre les appels API
  const [availableRidesLocal, setAvailableRidesLocal] = useState<RideRow[]>([])
  const [todayRidesLocal, setTodayRidesLocal] = useState<RideRow[]>([])
  const { toast } = useToast()
  
  // Use real data - STABLE REFERENCE STRATEGY
  const stableAvailableRides = useStableRides(availableRides)
  const stableTodayRides = useStableRides(todayRides)
  
  // Utilisez uniquement les données de l'API avec fallback local pour les mutations temporaires
  const currentAvailableRides = useMemo(() => {
    return stableAvailableRides?.length ? stableAvailableRides : availableRidesLocal
  }, [stableAvailableRides, availableRidesLocal])
  
  const currentTodayRides = useMemo(() => {
    return stableTodayRides?.length ? stableTodayRides : todayRidesLocal
  }, [stableTodayRides, todayRidesLocal])
  
  // Mettre à jour l'état local lorsque les données de l'API changent
  useEffect(() => {
    if (stableAvailableRides?.length) {
      setAvailableRidesLocal(stableAvailableRides)
    }
  }, [stableAvailableRides])
  
  useEffect(() => {
    if (stableTodayRides?.length) {
      setTodayRidesLocal(stableTodayRides)
    }
  }, [stableTodayRides])
  
  const currentStats = todayStats || mockStatsData.todayStats
  
  const toggleOnlineStatus = () => {
    // Vérifier si le profil est complet avant de passer en ligne
    if (!isProfileComplete && !isOnline) {
      toast({
        variant: "destructive", 
        title: "Profil incomplet",
        description: "Vous devez compléter votre profil à 100% pour passer en ligne"
      })
      router.push('/driver-portal/profile-setup')
      return
    }
    
    setIsOnline(!isOnline)
    
    // Nouvel état après changement
    const newOnlineState = !isOnline
    
    toast({
      variant: newOnlineState ? "success" : "destructive",
      title: newOnlineState ? "En ligne" : "Hors ligne",
      description: newOnlineState ? "Vous êtes maintenant disponible pour recevoir des courses" : "Vous ne recevrez plus de nouvelles courses"
    })
  }

  const handleCompleteProfile = () => {
    console.log("Redirection vers profil")
  }

  // Mutations TanStack Query pour les opérations de course
  const acceptRideMutation = useAcceptRide()
  const startRideMutation = useStartRide()
  const completeRideMutation = useCompleteRide()
  
  const handleAcceptRide = useCallback((rideId: string) => {
    const ride = currentAvailableRides.find(r => r.id === rideId)
    const isScheduledRide = ride?.status === 'scheduled'
    
    // Règles de cohérence pour accepter une course
    if (!isProfileComplete) {
      toast({
        variant: "destructive",
        title: "Profil incomplet", 
        description: "Vous devez compléter votre profil pour accepter des courses"
      })
      router.push('/driver-portal/profile-setup')
      return
    }
    
    if (!isScheduledRide && !isOnline) {
      toast({
        variant: "destructive",
        title: "Statut hors ligne",
        description: "Vous devez être en ligne pour accepter des courses immédiates"
      })
      return
    }
    
    // Optimistic UI update
    const acceptedRide = currentAvailableRides.find(r => r.id === rideId)
    if (acceptedRide && user?.id) {
      setAvailableRidesLocal(prev => prev.filter(r => r.id !== rideId))
      setTodayRidesLocal(prev => [...prev, { ...acceptedRide, status: "scheduled", driver_id: user.id }])
      
      // Exécution de la mutation TanStack Query
      acceptRideMutation.mutate({ rideId, driverId: user.id })
    }
  }, [currentAvailableRides, isProfileComplete, isOnline, toast, router, user, acceptRideMutation])

  const handleDeclineRide = useCallback((rideId: string) => {
    // Mise à jour optimiste de l'UI
    setAvailableRidesLocal(prev => prev.filter(r => r.id !== rideId))
    
    toast({
      variant: "destructive",
      title: "Course refusée",
      description: "Une nouvelle course sera proposée sous peu"
    })
    
    // TODO: Implémenter useDeclineRide dans useRides.ts et l'utiliser ici
    // useDeclineRide.mutate({ rideId, driverId: user?.id })
    
    // Pour l'instant, on rafraîchit simplement les courses disponibles
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: rideKeys.available(user?.id) })
    }, 500)
  }, [toast, user?.id, queryClient])

  const handleStartRide = useCallback((rideId: string) => {
    // Mise à jour optimiste de l'UI
    setTodayRidesLocal(prev => 
      prev.map(ride =>
        ride.id === rideId 
          ? { ...ride, status: "in-progress" }
          : ride
      )
    )
    
    // Exécution de la mutation TanStack Query
    if (user?.id) {
      startRideMutation.mutate(rideId)
    }
  }, [startRideMutation, user?.id, setTodayRidesLocal])
  
  const handleCompleteRide = useCallback((rideId: string) => {
    // Mise à jour optimiste de l'UI
    setTodayRidesLocal(prev => prev.filter(ride => ride.id !== rideId))
    
    toast({
      variant: "success",
      title: "Course terminée",
      description: "Merci pour votre service !"
    })
    
    // Exécution de la mutation TanStack Query
    if (user?.id) {
      completeRideMutation.mutate({ rideId, finalPrice: undefined })
    }
  }, [completeRideMutation, user?.id, setTodayRidesLocal, toast])

  // Composant wrapper pour conditionner l'affichage des courses
  const AvailableRidesWithProfileCheck = () => {
    if (!user) return <div className="text-center py-8 text-white">Connexion...</div>
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Courses disponibles</h3>
          {currentAvailableRides.length > 0 && (
            <Badge className="bg-blue-600">
              {currentAvailableRides.length}
            </Badge>
          )}
        </div>
        
        {/* Vérification profil avec composant de blocage */}
        <ProfileCheckWrapper userId={user.id}>
          
          {currentAvailableRides.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
              <p className="text-neutral-400">Aucune course disponible</p>
              <p className="text-sm text-neutral-500 mt-1">
                {isProfileComplete 
                  ? (isOnline ? "Nouvelles courses bientôt..." : "Passez en ligne pour voir plus de courses")
                  : "Complétez votre profil pour voir les courses"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {isLoadingAvailableRides ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Recherche de courses disponibles...</p>
                </div>
              ) : currentAvailableRides.map((ride) => (
                <EnhancedAvailableRideCard
                  key={ride.id}
                  ride={ride}
                  onAccept={handleAcceptRide}
                  onDecline={handleDeclineRide}
                  isProfileComplete={isProfileComplete}
                  isOnline={isOnline}
                />
              ))}
              
              {!isLoadingAvailableRides && currentAvailableRides.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Aucune course disponible pour le moment</p>
                  <p className="text-sm">Restez en ligne pour recevoir de nouvelles propositions</p>
                </div>
              )}
            </div>
          )}
        </ProfileCheckWrapper>
      </div>
    )
  }
  
  // Composant de vérification profil
  const ProfileCheckWrapper = ({ userId, children }: { userId: string, children: React.ReactNode }) => {
    const { data: completeness, isLoading } = useDriverProfileCompleteness(userId)
    
    if (isLoading) {
      return <div className="text-center py-4 text-white">Vérification du profil...</div>
    }
    
    if (!completeness?.is_complete) {
      return (
        <div className="p-4">
          <ProfileAlert 
            userId={userId}
            onCompleteProfile={() => router.push('/driver-portal/profile-setup')}
          />
        </div>
      )
    }
    
    return <>{children}</>
  }
  
  // Composant enhanced pour les courses avec logique de cohérence
  const EnhancedAvailableRideCard = ({ 
    ride, 
    onAccept, 
    onDecline, 
    isProfileComplete, 
    isOnline 
  }: { 
    ride: RideRow
    onAccept: (id: string) => void
    onDecline: (id: string) => void
    isProfileComplete: boolean
    isOnline: boolean
  }) => {
    const isScheduledRide = ride.status === 'scheduled'
    const canAccept = isProfileComplete && (isOnline || isScheduledRide)
    
    return (
      <div className="relative">
        <AvailableRideCard
          ride={ride}
          onAccept={canAccept ? onAccept : () => {}}
          onDecline={onDecline}
        />
        
        {/* Overlay de blocage si conditions non remplies */}
        {!canAccept && (
          <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-md text-xs text-center">
              {!isProfileComplete ? (
                <span className="text-orange-700 font-medium">Profil incomplet</span>
              ) : !isOnline && !isScheduledRide ? (
                <span className="text-blue-700 font-medium">Passez en ligne</span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Contenu des onglets modernisés
  const tabsContent = [
    {
      id: "stats",
      label: "Aujourd'hui",
      content: (
        <div className="space-y-4">
          <StatsIsland
            todayStats={currentStats}
            weekStats={mockStatsData.weekStats}
            monthStats={mockStatsData.monthStats}
          />
        </div>
      )
    },
    {
      id: "available",
      label: "Disponibles",
      content: <AvailableRidesWithProfileCheck />
    },
    {
      id: "scheduled",
      label: "Prochaines",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Mes prochaines courses</h3>
            {currentTodayRides.length > 0 && (
              <Badge className="bg-green-600">
                {currentTodayRides.length}
              </Badge>
            )}
          </div>
          
          {currentTodayRides.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
              <p className="text-neutral-400">Aucune course programmée</p>
              <p className="text-sm text-neutral-500 mt-1">
                Acceptez des courses pour les voir ici
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {isLoadingTodayRides ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Chargement des courses planifiées...</p>
                </div>
              ) : currentTodayRides.map((ride) => (
                <div key={ride.id} className="relative">
                  <TodayRideCard
                    ride={ride}
                    onStart={isProfileComplete ? handleStartRide : () => {}}
                    onComplete={isProfileComplete ? handleCompleteRide : () => {}}
                    onNavigate={(id) => console.log(`Navigation vers ${id}`)}
                  />
                  
                  {/* Overlay si profil incomplet */}
                  {!isProfileComplete && (
                    <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
                      <div className="bg-orange-500/90 backdrop-blur-sm px-3 py-2 rounded-md text-xs text-white text-center">
                        <span className="font-medium">Complétez votre profil pour gérer cette course</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }
  ]

  // Mémoriser les props de la carte pour éviter les re-renders - STABLE REFERENCE STRATEGY
  const mapRides = useStableMapRides(currentAvailableRides, isOnline)
  
  // État pour la course sélectionnée
  const [selectedRide, setSelectedRide] = useState<RideRow | null>(null)
  
  // Gestion des clics sur les courses sur la carte
  const handleRideSelect = useCallback((ride: RideRow | null) => {
    console.log('🎯 Course sélectionnée:', ride?.id || 'none')
    setSelectedRide(ride)
  }, [])
  
  // Gestionnaire d'acceptation de course sur la carte
  const handleRideAcceptFromMap = useCallback((ride: RideRow) => {
    console.log('🚗 Acceptation de course depuis la carte:', ride.id)
    handleAcceptRide(ride.id)
    setSelectedRide(null)
  }, [handleAcceptRide])

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Carte principale - plein écran avec géolocalisation - Background absolu */}
      <div className="absolute inset-0 z-0">
        <MapLibreWrapper
          availableRides={mapRides}
          selectedRide={selectedRide}
          isOnline={isOnline}
          onRideSelect={handleRideSelect}
          onRideAccept={handleRideAcceptFromMap}
        />
      </div>

      {/* Bottom Sheet amélioré avec gestion gestuelle */}
      <BottomSheet
        minHeight={120}
        maxHeight={viewportHeight * 0.85}
        defaultHeight={200}
      >
        {/* Notification profil global - UNE SEULE SOURCE DE VÉRITÉ */}
        {!isLoadingAuth && user && (
          <div className="p-4">
            <ProfileAlert 
              userId={user.id}
              onCompleteProfile={() => router.push('/driver-portal/profile-setup')}
            />
          </div>
        )}
        
        {/* Bannière de statut avec bouton en haut du bottom sheet */}
        <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800/50 px-4 pt-2 pb-3">
          <Button
            variant="outline"
            onClick={toggleOnlineStatus}
            disabled={!isProfileComplete && !isOnline}
            className={cn(
              "w-full transition-all duration-300 border-2 py-2 h-auto",
              !isProfileComplete && !isOnline && "opacity-50 cursor-not-allowed",
              isOnline 
                ? "bg-green-500/10 border-green-500/30 text-green-100 hover:bg-green-500/20" 
                : "bg-red-500/10 border-red-500/30 text-red-100 hover:bg-red-500/20"
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <div className={cn(
                  "h-3 w-3 rounded-full mr-2 animate-pulse",
                  isOnline ? "bg-green-400" : "bg-red-400"
                )} />
                <span className="font-medium">
                  {isOnline ? "Disponible" : "Indisponible"}
                </span>
              </div>
              <span className="text-sm opacity-80">
                {isOnline ? "Passer hors ligne" : "Passer en ligne"}
              </span>
            </div>
          </Button>
        </div>
        <SwipeableTabs
          tabs={tabsContent}
          defaultTab="available"
        />
      </BottomSheet>
    </div>
  )
}