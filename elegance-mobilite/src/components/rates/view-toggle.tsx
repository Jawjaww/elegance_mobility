import { Button } from '@/components/ui/button'
import { GridIcon, TableIcon } from 'lucide-react'
import { RatesView } from '@/hooks/useRatesView'

interface ViewToggleProps {
  view: RatesView
  onToggle: () => void
  className?: string
}

export default function ViewToggle({
  view,
  onToggle,
  className = '',
}: ViewToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={className}
      title={`Basculer en vue ${view === 'grid' ? 'tableau' : 'grille'}`}
    >
      {view === 'grid' ? (
        <TableIcon className="h-4 w-4" aria-label="Vue tableau" />
      ) : (
        <GridIcon className="h-4 w-4" aria-label="Vue grille" />
      )}
    </Button>
  )
}