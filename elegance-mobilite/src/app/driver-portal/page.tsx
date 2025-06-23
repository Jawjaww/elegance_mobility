'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ProfileCompletionModal } from "@/components/drivers/ProfileCompletionModal"
import { supabase } from '@/lib/database/client'
import { ProfileAlert } from "@/components/drivers/ProfileAlert"
import { useDriverProfileCompleteness } from "@/hooks/useDriverProfileCompleteness"
import { StatsIsland } from "@/components/drivers/StatsIsland"
import { BottomSheet } from "@/components/drivers/BottomSheet"
import { SwipeableTabs } from "@/components/drivers/SwipeableTabs"
import { DriverMap } from "@/components/drivers/DriverMap"
import { AvailableRideCard } from "@/components/drivers/AvailableRideCard"
import { TodayRideCard } from "@/components/drivers/TodayRideCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { useDriverUIStore } from "@/stores/driverUIStore"
import { useDriverProfile, useAvailableRides, useScheduledRides, useDriverStats } from "@/hooks/queries"
import { useDriverRealtime } from "@/hooks/queries/useRealtime"
import { cn } from "@/lib/utils"
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

const mockAvailableRides: RideRow[] = [
  {
    id: "ride-1",
    pickup_time: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    pickup_address: "Gare de Lyon, 75012 Paris",
    pickup_lat: 48.8447,
    pickup_lon: 2.3738,
    dropoff_address: "Aéroport Charles de Gaulle, Terminal 2E",
    dropoff_lat: 49.0097,
    dropoff_lon: 2.5479,
    estimated_price: 4580,
    vehicle_type: "premium",
    status: "pending",
    user_id: "customer-1",
    driver_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    distance: null,
    duration: null,
    final_price: null,
    options: null,
    override_vehicle_id: null,
    pickup_notes: null,
    price: null
  },
  {
    id: "ride-2",
    pickup_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    pickup_address: "Place de la République, 75011 Paris",
    pickup_lat: 48.8676,
    pickup_lon: 2.3631,
    dropoff_address: "La Défense, 92400 Courbevoie",
    dropoff_lat: 48.8922,
    dropoff_lon: 2.2389,
    estimated_price: 2750,
    vehicle_type: "standard",
    status: "pending",
    user_id: "customer-2",
    driver_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    distance: null,
    duration: null,
    final_price: null,
    options: null,
    override_vehicle_id: null,
    pickup_notes: null,
    price: null
  }
]

const mockTodayRides: RideRow[] = [
  {
    id: "ride-today-1",
    pickup_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    pickup_address: "Hôtel Le Bristol, 112 Rue du Faubourg Saint-Honoré",
    pickup_lat: 48.8721,
    pickup_lon: 2.3165,
    dropoff_address: "Musée du Louvre, 99 Rue de Rivoli",
    dropoff_lat: 48.8606,
    dropoff_lon: 2.3376,
    estimated_price: 1850,
    vehicle_type: "premium",
    status: "scheduled",
    user_id: "customer-3",
    driver_id: "current-driver",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    distance: null,
    duration: null,
    final_price: null,
    options: null,
    override_vehicle_id: null,
    pickup_notes: null,
    price: null
  }
]

export default function DriverDashboard() {
  // Hook pour la hauteur de l'écran (SSR-safe)
  const viewportHeight = useViewportHeight()
  
  // État d'authentification
  const [user, setUser] = useState<any>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
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
  
  // Temporary driver ID - in real app, get from auth
  const driverId = user?.id || "temp-driver-id"
  
  // TanStack Query hooks for server state
  const { data: driverProfile } = useDriverProfile(driverId)
  const { data: availableRides = mockAvailableRides } = useAvailableRides(driverId)
  const { data: todayRides = mockTodayRides } = useScheduledRides(driverId)
  const { data: todayStats = mockStatsData.todayStats } = useDriverStats(driverId, 'today')
  
  // Zustand store for UI state
  const { isOnline, setIsOnline } = useDriverUIStore()
  
  // Setup realtime synchronization
  useDriverRealtime(driverId)
  
  // Legacy state (to be removed once fully migrated)
  const [availableRidesLocal, setAvailableRidesLocal] = useState(mockAvailableRides)
  const [todayRidesLocal, setTodayRidesLocal] = useState(mockTodayRides)
  const { toast } = useToast()
  
  // Use real data when available, fallback to mocks
  const currentAvailableRides = availableRides?.length ? availableRides : availableRidesLocal
  const currentTodayRides = todayRides?.length ? todayRides : todayRidesLocal
  const currentStats = todayStats || mockStatsData.todayStats
  
  const toggleOnlineStatus = () => {
    // Vérifier si le profil est complet avant de passer en ligne
    if (!isProfileComplete && !isOnline) {
      toast({
        variant: "destructive", 
        title: "Profil incomplet",
        description: "Vous devez compléter votre profil à 100% pour passer en ligne"
      })
      setShowProfileModal(true)
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

  const handleAcceptRide = (rideId: string) => {
    const ride = currentAvailableRides.find(r => r.id === rideId)
    const isScheduledRide = ride?.status === 'scheduled'
    
    // Règles de cohérence pour accepter une course
    if (!isProfileComplete) {
      toast({
        variant: "destructive",
        title: "Profil incomplet", 
        description: "Vous devez compléter votre profil pour accepter des courses"
      })
      setShowProfileModal(true)
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
    
    toast({
      variant: "success",
      title: "Course acceptée",
      description: "La course a été ajoutée à votre planning"
    })
    
    const acceptedRide = currentAvailableRides.find(r => r.id === rideId)
    if (acceptedRide) {
      setAvailableRidesLocal(prev => prev.filter(r => r.id !== rideId))
      setTodayRidesLocal(prev => [...prev, { ...acceptedRide, status: "scheduled", driver_id: "current-driver" }])
      
      // TODO: Replace with TanStack Query mutation
      // useAcceptRide.mutate({ rideId, driverId })
    }
  }

  const handleDeclineRide = (rideId: string) => {
    setAvailableRidesLocal(prev => prev.filter(r => r.id !== rideId))
    toast({
      variant: "destructive",
      title: "Course refusée",
      description: "Une nouvelle course sera proposée sous peu"
    })
    // TODO: Replace with TanStack Query mutation
    // useDeclineRide.mutate({ rideId, driverId })
  }

  const handleStartRide = (rideId: string) => {
    setTodayRidesLocal(prev =>      prev.map(ride =>
        ride.id === rideId 
          ? { ...ride, status: "in-progress" }
          : ride
      )
    )
    toast({
      variant: "success",
      title: "Course démarrée",
      description: "Bon voyage !"
    })
    // TODO: Replace with TanStack Query mutation
    // useStartRide.mutate({ rideId, driverId })
  }

  const handleCompleteRide = (rideId: string) => {
    setTodayRidesLocal(prev => 
      prev.map(ride => 
        ride.id === rideId 
          ? { ...ride, status: "completed" }
          : ride
      )
    )
    toast({
      variant: "success",
      title: "Course terminée",
      description: "Merci pour votre service !"
    })
    // TODO: Replace with TanStack Query mutation
    // useCompleteRide.mutate({ rideId, driverId })
  }

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
          {/* Notification de statut si profil complet mais hors ligne */}
          {isProfileComplete && !isOnline && currentAvailableRides.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center">
              <div className="flex justify-center mb-2">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-medium text-blue-800 mb-1">Vous êtes hors ligne</h4>
              <p className="text-xs text-blue-600">
                Passez en ligne pour accepter des courses immédiates ou consultez les courses planifiées
              </p>
            </div>
          )}
          
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
              {currentAvailableRides.map((ride) => (
                <EnhancedAvailableRideCard
                  key={ride.id}
                  ride={ride}
                  onAccept={handleAcceptRide}
                  onDecline={handleDeclineRide}
                  isProfileComplete={isProfileComplete}
                  isOnline={isOnline}
                />
              ))}
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
            onCompleteProfile={() => setShowProfileModal(true)}
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
              {currentTodayRides.map((ride) => (
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

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      {/* Carte principale - plein écran avec géolocalisation - Background absolu */}
      <DriverMap
        availableRides={isOnline ? availableRides : []}
        onAcceptRide={handleAcceptRide}
        onDeclineRide={handleDeclineRide}
      />

      {/* Bottom Sheet amélioré avec gestion gestuelle */}
      <BottomSheet
        minHeight={120}
        maxHeight={viewportHeight * 0.85}
        defaultHeight={200}
        showProfileAlert={false}
        profileAlert={null}
      >
        {/* Notification profil global - UNE SEULE SOURCE DE VÉRITÉ */}
        {!isLoadingAuth && user && (
          <>
            <div className="p-4">
              <ProfileAlert 
                userId={user.id}
                onCompleteProfile={() => setShowProfileModal(true)}
              />
            </div>
            
            <ProfileCompletionModal
              userId={user.id}
              isOpen={showProfileModal}
              onClose={() => setShowProfileModal(false)}
            />
          </>
        )}
        
        {/* Bouton en ligne/hors ligne plus discret, placé au-dessus des tabs */}
        <div className="flex items-center justify-center mb-2 px-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleOnlineStatus}
              disabled={!isProfileComplete && !isOnline}
              className={cn(
                "transition-all duration-300 border-2",
                !isProfileComplete && !isOnline && "opacity-50 cursor-not-allowed",
                isOnline 
                  ? "bg-green-500/20 border-green-500/50 text-green-100 hover:bg-green-500/30" 
                  : "bg-red-500/20 border-red-500/50 text-red-100 hover:bg-red-500/30"
              )}
            >
              <div className={cn(
                "h-2 w-2 rounded-full mr-2 animate-pulse",
                isOnline ? "bg-green-400" : "bg-red-400"
              )} />
              {isOnline ? "En ligne" : "Hors ligne"}
            </Button>
          </div>
        </div>
        <SwipeableTabs
          tabs={tabsContent}
          defaultTab="available"
        />
      </BottomSheet>
    </div>
  )
}