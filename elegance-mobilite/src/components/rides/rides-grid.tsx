import { Database } from '@/lib/types/database.types'
import RideCard from './ride-card'

type Ride = Database['public']['Tables']['rides']['Row']
type Driver = Database['public']['Tables']['drivers']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

interface RidesGridProps {
  rides: Ride[]
  drivers: Record<string, Driver>
  vehicles: Record<string, Vehicle>
  onEdit?: (ride: Ride) => void
  onDelete?: (ride: Ride) => void
  onViewMap?: (ride: Ride) => void
  className?: string
}

export default function RidesGrid({
  rides,
  drivers,
  vehicles,
  onEdit,
  onDelete,
  onViewMap,
  className = '',
}: RidesGridProps) {
  if (!rides.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Aucune course trouvée
      </div>
    )
  }

  const getVehicleForRide = (ride: Ride): Vehicle | undefined => {
    if (ride.override_vehicle_id) {
      return vehicles[ride.override_vehicle_id]
    }
    if (ride.driver_id && drivers[ride.driver_id]?.vehicle_id) {
      return vehicles[drivers[ride.driver_id].vehicle_id!]
    }
    return undefined
  }

  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {rides.map((ride) => (
        <RideCard
          key={ride.id}
          ride={ride}
          driver={ride.driver_id ? drivers[ride.driver_id] : undefined}
          vehicle={getVehicleForRide(ride)}
          onEdit={onEdit}
          onDelete={onDelete}
          onViewMap={onViewMap}
        />
      ))}
    </div>
  )
}