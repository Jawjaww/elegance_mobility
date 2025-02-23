import { Database } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2Icon, TrashIcon, CarIcon } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Driver = Database['public']['Tables']['drivers']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

interface DriverCardProps {
  driver: Driver
  vehicle?: Vehicle | null
  onEdit?: (driver: Driver) => void
  onDelete?: (driver: Driver) => void
}

export default function DriverCard({
  driver,
  vehicle,
  onEdit,
  onDelete,
}: DriverCardProps) {
  const getDriverInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const getVehicleLabel = (type: string) => {
    switch (type) {
      case 'STANDARD':
        return 'Berline Standard'
      case 'LUXURY':
        return 'Berline Luxe'
      case 'VAN':
        return 'Van/Minibus'
      default:
        return type
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start space-y-0 pb-2">
        <div className="flex flex-1 items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={driver.avatar_url || undefined} />
            <AvatarFallback>{getDriverInitials(driver.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base font-medium">{driver.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{driver.phone}</p>
          </div>
        </div>
        <Badge
          variant={driver.status === 'active' ? 'default' : 'secondary'}
          className="ml-auto"
        >
          {driver.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {vehicle && (
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <CarIcon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {getVehicleLabel(vehicle.vehicle_type)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {vehicle.vehicle_model} - {vehicle.license_plate}
                </p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{driver.email}</p>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-2 pt-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(driver)}
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
                  onClick={() => onDelete(driver)}
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}