import OptionCard from './option-card'

interface Option {
  id: string
  name: string
  description: string
  price: number
  available: boolean
}

interface OptionsGridProps {
  options: Option[]
  onEdit?: (option: Option) => void
  onDelete?: (option: Option) => void
  className?: string
}

export default function OptionsGrid({
  options,
  onEdit,
  onDelete,
  className = '',
}: OptionsGridProps) {
  if (!options.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Aucune option trouvée
      </div>
    )
  }

  return (
    <div
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {options.map((option) => (
        <OptionCard
          key={option.id}
          option={option}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}