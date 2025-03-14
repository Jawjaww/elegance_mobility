'use client'

import { useEffect, useState } from "react"
import { LoadingSpinner } from "../../../components/ui/loading-spinner"
import { Card, CardContent } from "../../../components/ui/card"
import { useUnifiedRidesStore } from "../../../lib/stores/unifiedRidesStore"
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert"
import { AlertCircle, CalendarClock, MapPin, UserCheck, Clock, WifiOff } from "lucide-react"
import { Badge } from "../../../components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ScrollArea } from "../../../components/ui/scroll-area"

type Ride = {
  id: string
  pickup_address: string
  dropoff_address: string
  scheduled_time: string
  status: string
  driver?: {
    first_name: string
    last_name: string
  }
}

const statusColors = {
  unassigned: "bg-gray-500",
  pending: "bg-yellow-500",
  "in-progress": "bg-blue-500",
  completed: "bg-green-500",
  canceled: "bg-red-500",
}

const statusLabels = {
  unassigned: "Non assignée",
  pending: "En attente",
  "in-progress": "En cours",
  completed: "Terminée",
  canceled: "Annulée",
}

type ErrorType = {
  message: string
  type: 'network' | 'server' | 'unknown'
  retry?: () => void
}

export function RidesList() {
  const { selectedDate, selectedStatus, driverFilter } = useUnifiedRidesStore()
  const [rides, setRides] = useState<Ride[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ErrorType | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  const fetchRides = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedDate) {
        const date = new Date(selectedDate)
        const formattedDate = date.toISOString().split('T')[0]
        params.append('date', formattedDate)
      }
      if (selectedStatus) params.append('status', selectedStatus)
      if (driverFilter) params.append('driverId', driverFilter)

      const response = await fetch(`/api/rides?${params}`)

      if (!response.ok) {
        // Gestion des différents codes d'erreur HTTP
        if (response.status === 404) {
          throw new Error('Service non trouvé')
        }
        if (response.status === 401) {
          throw new Error('Non autorisé - Veuillez vous reconnecter')
        }
        if (response.status >= 500) {
          throw new Error('Erreur serveur - Veuillez réessayer plus tard')
        }
        throw new Error('Erreur lors de la récupération des courses')
      }

      const data = await response.json()
      setRides(data.rides)
      setRetryCount(0) // Réinitialiser le compteur en cas de succès
    } catch (err) {
      const isNetworkError = err instanceof TypeError && err.message === 'Failed to fetch'
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      
      setError({
        message: errorMessage,
        type: isNetworkError ? 'network' : err instanceof Error && err.message.includes('serveur') ? 'server' : 'unknown',
        retry: retryCount < MAX_RETRIES ? () => {
          setRetryCount(prev => prev + 1)
          fetchRides()
        } : undefined
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRides()
  }, [selectedDate, selectedStatus, driverFilter])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 h-[200px]">
        <LoadingSpinner size="lg" className="border-blue-500" />
        <p className="text-gray-400 animate-pulse">Chargement des courses...</p>
      </div>
    )
  }

  if (error) {
    const errorIcons = {
      network: <WifiOff className="h-4 w-4" />,
      server: <AlertCircle className="h-4 w-4" />,
      unknown: <AlertCircle className="h-4 w-4" />
    }

    return (
      <Alert variant="destructive" className="flex flex-col items-start gap-2">
        {errorIcons[error.type]}
        <AlertTitle>
          {error.type === 'network' ? 'Erreur de connexion' :
           error.type === 'server' ? 'Erreur serveur' : 'Erreur'}
        </AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{error.message}</p>
          {error.retry && (
            <button
              onClick={error.retry}
              className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Réessayer ({MAX_RETRIES - retryCount} tentatives restantes)
            </button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (rides.length === 0) {
    return (
      <Alert className="bg-gray-800/40 border-gray-700 text-gray-300">
        <CalendarClock className="h-4 w-4" />
        <AlertTitle>Aucune course aujourd&apos;hui</AlertTitle>
        <AlertDescription>
          Il n&apos;y a pas de courses correspondant aux critères sélectionnés.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <ScrollArea className="h-[calc(100vh-250px)]">
      <div className="space-y-4 pr-4">
        {rides.map((ride) => (
          <Card key={ride.id} className="bg-gray-800/40 border-gray-700 hover:bg-gray-800/60 transition-colors">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={`${statusColors[ride.status as keyof typeof statusColors]}`}>
                  {statusLabels[ride.status as keyof typeof statusLabels]}
                </Badge>
                <span className="text-sm text-gray-400">
                  {format(new Date(ride.scheduled_time), "HH'h'mm", { locale: fr })}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Prise en charge</p>
                    <p className="text-sm text-gray-400">{ride.pickup_address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-200">Destination</p>
                    <p className="text-sm text-gray-400">{ride.dropoff_address}</p>
                  </div>
                </div>

                {ride.driver && (
                  <div className="flex items-center gap-2 pt-1">
                    <UserCheck className="h-4 w-4 text-blue-400" />
                    <p className="text-sm text-gray-400">
                      {ride.driver.first_name} {ride.driver.last_name}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  )
}
