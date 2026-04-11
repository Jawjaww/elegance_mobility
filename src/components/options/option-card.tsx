import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit2Icon, TrashIcon } from 'lucide-react'

interface Option {
  id: string
  name: string
  description: string
  price: number
  available: boolean
}

interface OptionCardProps {
  option: Option
  onEdit?: (option: Option) => void
  onDelete?: (option: Option) => void
}

export default function OptionCard({
  option,
  onEdit,
  onDelete,
}: OptionCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price)
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{option.name}</CardTitle>
        <Badge
          variant={option.available ? 'default' : 'secondary'}
          className="font-normal"
        >
          {option.available ? 'Disponible' : 'Indisponible'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Prix</p>
            <p className="text-2xl font-bold">{formatPrice(option.price)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Description
            </p>
            <p className="text-sm">{option.description}</p>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-2 pt-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit(option)}
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
                  onClick={() => onDelete(option)}
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