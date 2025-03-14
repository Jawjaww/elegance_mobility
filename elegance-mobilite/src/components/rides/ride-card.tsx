import { Database } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2Icon, TrashIcon, MapIcon } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type Ride = Database['public']['Tables']['rides']['Row']
type Driver = Database['public']['Tables']['drivers']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

interface RideCardProps {
  ride: Ride
  driver?: Driver
  vehicle?: Vehicle
  onEdit?: (ride: Ride) => void
  onDelete?: (ride: Ride) => void
  onViewMap?: (ride: Ride) => void
}

export default function RideCard({
  ride,
  driver,
  vehicle,
  onEdit,
  onDelete,
  onViewMap,
}: RideCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  const formatDateTime = (date: string) => {
    return format(new Date(date), "d MMMM yyyy 'à' HH:mm", { locale: fr })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      confirmed: 'default',
      canceled: 'destructive',
    }
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      canceled: 'Annulée',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>{labels[status]}</Badge>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Course #{ride.id.slice(0, 8)}
        </CardTitle>
        {getStatusBadge(ride.status)}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Date</p>
            <p className="text-sm">{formatDateTime(ride.pickup_time)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">De</p>
            <p className="text-sm">{ride.pickup_address}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">À</p>
            <p className="text-sm">{ride.dropoff_address}</p>
          </div>
          {driver && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Chauffeur
              </p>
              <p className="text-sm">{driver.name}</p>
            </div>
          )}
          {vehicle && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Véhicule
              </p>
              <p className="text-sm">
                {vehicle.vehicle_model} - {vehicle.license_plate}
              </p>
            </div>
          )}
          {ride.estimated_price && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Prix estimé
              </p>
              <p className="text-2xl font-bold">
                {formatPrice(ride.estimated_price)}
              </p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {onViewMap && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onViewMap(ride)}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                Carte
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit(ride)}
              >
                <Edit2Icon className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onDelete(ride)}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}