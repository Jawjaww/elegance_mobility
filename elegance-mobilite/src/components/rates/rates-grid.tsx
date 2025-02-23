import { Database } from '@/lib/database.types'
import RateCard from './rate-card'

type Rate = Database['public']['Tables']['rates']['Row']

interface RatesGridProps {
  rates: Rate[]
  onEdit?: (rate: Rate) => void
  onDelete?: (rate: Rate) => void
  className?: string
}

export default function RatesGrid({
  rates,
  onEdit,
  onDelete,
  className = '',
}: RatesGridProps) {
  if (!rates.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Aucun tarif trouvé
      </div>
    )
  }

  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {rates.map((rate) => (
        <RateCard
          key={rate.id}
          rate={rate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}