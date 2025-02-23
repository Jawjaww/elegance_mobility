import { Database } from '@/lib/database.types'
import DriverCard from './driver-card'

type Driver = Database['public']['Tables']['drivers']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']

interface DriversGridProps {
  drivers: Driver[]
  vehicles: Record<string, Vehicle>
  onEdit?: (driver: Driver) => void
  onDelete?: (driver: Driver) => void
  className?: string
}

export default function DriversGrid({
  drivers,
  vehicles,
  onEdit,
  onDelete,
  className = '',
}: DriversGridProps) {
  if (!drivers.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Aucun chauffeur trouvé
      </div>
    )
  }

  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {drivers.map((driver) => (
        <DriverCard
          key={driver.id}
          driver={driver}
          vehicle={driver.vehicle_id ? vehicles[driver.vehicle_id] : null}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}