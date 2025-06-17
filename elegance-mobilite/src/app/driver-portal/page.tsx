'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ProfileAlert } from "@/components/drivers/ProfileAlert"
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
import { useDriver } from "@/contexts/DriverContext"
import { cn } from "@/lib/utils"
import type { Database } from "@/lib/types/database.types"

type RideRow = Database["public"]["Tables"]["rides"]["Row"]

// Mock data - à remplacer par de vraies données Supabase
const mockProfile = {
  isComplete: false,
  missingFields: ['Permis de conduire', 'Assurance véhicule', 'Photo de profil']
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
  const [availableRides, setAvailableRides] = useState(mockAvailableRides)
  const [todayRides, setTodayRides] = useState(mockTodayRides)
  const { toast } = useToast()
  const { isOnline, todayStats, setTodayStats, toggleOnlineStatus } = useDriver()

  const handleCompleteProfile = () => {
    console.log("Redirection vers profil")
  }

  const handleAcceptRide = (rideId: string) => {
    toast({
      variant: "success",
      title: "Course acceptée",
      description: "La course a été ajoutée à votre planning"
    })
    
    const acceptedRide = availableRides.find(r => r.id === rideId)
    if (acceptedRide) {
      setAvailableRides(prev => prev.filter(r => r.id !== rideId))
      setTodayRides(prev => [...prev, { ...acceptedRide, status: "scheduled", driver_id: "current-driver" }])
      
      // Mettre à jour les statistiques
      setTodayStats({
        ...todayStats,
        rides: todayStats.rides + 1,
        earnings: todayStats.earnings + (acceptedRide.estimated_price || 0)
      })
    }
  }

  const handleDeclineRide = (rideId: string) => {
    setAvailableRides(prev => prev.filter(r => r.id !== rideId))
    toast({
      variant: "destructive",
      title: "Course refusée",
      description: "Une nouvelle course sera proposée sous peu"
    })
  }

  const handleStartRide = (rideId: string) => {
    setTodayRides(prev => 
      prev.map(ride => 
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
  }

  const handleCompleteRide = (rideId: string) => {
    setTodayRides(prev => 
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
  }

  // Contenu des onglets modernisés
  const tabsContent = [
    {
      id: "stats",
      label: "Aujourd'hui",
      content: (
        <div className="space-y-4">
          <StatsIsland
            todayStats={todayStats}
            weekStats={mockStatsData.weekStats}
            monthStats={mockStatsData.monthStats}
          />
        </div>
      )
    },
    {
      id: "available",
      label: "Disponibles",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Courses disponibles</h3>
            {availableRides.length > 0 && (
              <Badge className="bg-blue-600">
                {availableRides.length}
              </Badge>
            )}
          </div>
          
          {availableRides.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
              <p className="text-neutral-400">Aucune course disponible</p>
              <p className="text-sm text-neutral-500 mt-1">
                {isOnline ? "Nouvelles courses bientôt..." : "Passez en ligne pour voir les courses"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {availableRides.map((ride) => (
                <AvailableRideCard
                  key={ride.id}
                  ride={ride}
                  onAccept={handleAcceptRide}
                  onDecline={handleDeclineRide}
                />
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      id: "scheduled",
      label: "Prochaines",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Mes prochaines courses</h3>
            {todayRides.length > 0 && (
              <Badge className="bg-green-600">
                {todayRides.length}
              </Badge>
            )}
          </div>
          
          {todayRides.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
              <p className="text-neutral-400">Aucune course programmée</p>
              <p className="text-sm text-neutral-500 mt-1">
                Acceptez des courses pour les voir ici
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayRides.map((ride) => (
                <TodayRideCard
                  key={ride.id}
                  ride={ride}
                  onStart={handleStartRide}
                  onComplete={handleCompleteRide}
                  onNavigate={(id) => console.log(`Navigation vers ${id}`)}
                />
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
        maxHeight={window.innerHeight * 0.85}
        defaultHeight={200}
        showProfileAlert={!mockProfile.isComplete}
        profileAlert={
          <ProfileAlert
            isProfileComplete={mockProfile.isComplete}
            missingFields={mockProfile.missingFields}
            onCompleteProfile={handleCompleteProfile}
          />
        }
      >
        {/* Bouton en ligne/hors ligne plus discret, placé au-dessus des tabs */}
        <div className="flex items-center justify-center mb-2 px-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleOnlineStatus}
            className={cn(
              "transition-all duration-300 border-2",
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
        <SwipeableTabs
          tabs={tabsContent}
          defaultTab="available"
        />
      </BottomSheet>
    </div>
  )
}
