import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock, MapPinIcon, UserCircle2 } from "lucide-react"
import { Button } from "../ui/button"
import { Card, CardContent, CardFooter } from "../ui/card"
import { Separator } from "../ui/separator"
import { StatusBadge } from "../reservation/StatusBadge"
import type { Ride } from "@/lib/types/common.types" // Utilisez Ride au lieu de DbRide

interface RideCardProps {
  ride: Ride
  editable?: boolean
  onDetailsClick?: (rideId: string) => void
  onAcceptClick?: (rideId: string) => void
}

export function RideCard({ ride, editable = false, onDetailsClick, onAcceptClick }: RideCardProps) {
  const formattedPickupTime = format(new Date(ride.pickup_time), "HH'h'mm", { locale: fr })
  
  return (
    <Card className="overflow-hidden dark:bg-gray-800/60 rounded-lg backdrop-blur-lg">
      <CardContent className="p-0">
        <div className="p-4 grid gap-3">
          <div className="flex items-center justify-between">
            <StatusBadge status={ride.status} />
            {ride.estimated_price && (
              <span className="text-sm font-semibold text-white">{ride.estimated_price.toFixed(2)} €</span>
            )}
          </div>
          
          <div className="flex items-center text-sm">
            <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
            <span className="text-gray-200">
              {format(new Date(ride.pickup_time), "EEEE d MMMM", { locale: fr })}
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            <span className="text-gray-200">{formattedPickupTime}</span>
          </div>
          
          <Separator className="bg-gray-700" />
          
          <div className="flex items-start text-sm">
            <MapPinIcon className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-white">{ride.pickup_address}</p>
            </div>
          </div>
          
          <div className="flex items-start text-sm">
            <MapPinIcon className="h-4 w-4 mr-2 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-white">{ride.dropoff_address}</p>
            </div>
          </div>
          
          {ride.user_id && (
            <div className="flex items-center text-sm">
              <UserCircle2 className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-gray-200">Client #{ride.user_id.substring(0, 8)}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between py-3 px-4 border-t border-gray-700 bg-gray-800/40">
        <Button variant="outline" className="text-xs h-8" onClick={() => onDetailsClick && onDetailsClick(ride.id)}>
          Détails
        </Button>
        
        {onAcceptClick && (
          <Button variant="default" className="text-xs h-8" onClick={() => onAcceptClick(ride.id)}>
            Accepter
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}