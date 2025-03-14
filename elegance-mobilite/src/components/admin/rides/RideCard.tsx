"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useDriversStore } from "@/lib/driversStore"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Clock, 
  User, 
  Car, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle 
} from "lucide-react"

const statusConfig = {
  pending: { color: "bg-yellow-500/20 text-yellow-500", icon: Clock },
  "in-progress": { color: "bg-blue-500/20 text-blue-500", icon: CheckCircle2 },
  completed: { color: "bg-green-500/20 text-green-500", icon: CheckCircle2 },
  canceled: { color: "bg-red-500/20 text-red-500", icon: XCircle },
}

interface RideCardProps {
  ride: {
    id: string
    clientName: string
    pickupAddress: string
    dropoffAddress: string
    status: keyof typeof statusConfig
    driverId: string | null
    createdAt: string
  }
  onAssignDriver: (rideId: string) => void
  onAssignVehicle: (rideId: string) => void
}

export function RideCard({ ride, onAssignDriver, onAssignVehicle }: RideCardProps) {
  const { drivers } = useDriversStore()
  const driver = drivers.find(d => d.id === ride.driverId)
  const StatusIcon = statusConfig[ride.status]?.icon || AlertCircle

  return (
    <Card className="w-full bg-gray-800/40 border-gray-700 text-white">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-col">
          <CardTitle className="text-xl font-bold">{ride.clientName}</CardTitle>
          <CardDescription className="text-gray-400 mt-1">
            {format(new Date(ride.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}
          </CardDescription>
        </div>
        <Badge 
          variant="secondary" 
          className={`${statusConfig[ride.status]?.color} ml-auto`}
        >
          <StatusIcon className="w-4 h-4 mr-1" />
          {ride.status === "in-progress" ? "En cours" :
           ride.status === "pending" ? "En attente" :
           ride.status === "completed" ? "Terminée" : "Annulée"}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-300">Départ: {ride.pickupAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-300">Arrivée: {ride.dropoffAddress}</span>
          </div>
        </div>

        {driver && (
          <div className="flex items-center gap-2 mt-4">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-300">
              Chauffeur: {driver.first_name} {driver.last_name}
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!ride.driverId && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-gray-700 hover:bg-gray-700"
              onClick={() => onAssignDriver(ride.id)}
            >
              <User className="w-4 h-4 mr-2" />
              Assigner un chauffeur
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-gray-700 hover:bg-gray-700"
              onClick={() => onAssignVehicle(ride.id)}
            >
              <Car className="w-4 h-4 mr-2" />
              Assigner un véhicule
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
