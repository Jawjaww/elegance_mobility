import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { VehicleType, getVehicleTypes } from '@/lib/vehicle'
import { Database } from '@/lib/types/common.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Rate = Database['public']['Tables']['rates']['Row']
type RateInsert = Database['public']['Tables']['rates']['Insert']

const rateSchema = z.object({
  vehicle_type: z.enum(['STANDARD', 'LUXURY', 'VAN'] as const),
  price_per_km: z.number().min(0),
  base_price: z.number().min(0),
})

type RateFormValues = z.infer<typeof rateSchema>

interface RateFormProps {
  initialData?: Rate
  onSubmit: (data: RateInsert) => Promise<void>
  onCancel: () => void
}

export default function RateForm({
  initialData,
  onSubmit,
  onCancel,
}: RateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const vehicleTypes = getVehicleTypes()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: initialData || {
      vehicle_type: 'STANDARD',
      price_per_km: 0,
      base_price: 0,
    },
  })

  const selectedVehicleType = watch('vehicle_type')

  const handleVehicleTypeChange = (value: string) => {
    setValue('vehicle_type', value as VehicleType)
  }

  const onFormSubmit = async (data: RateFormValues) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="vehicle_type">Type de véhicule</Label>
          <Select
            value={selectedVehicleType}
            onValueChange={handleVehicleTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vehicle_type && (
            <p className="text-sm text-red-500 mt-1">
              {errors.vehicle_type.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="price_per_km">Prix par kilomètre (€)</Label>
          <Input
            id="price_per_km"
            type="number"
            step="0.01"
            {...register('price_per_km', { valueAsNumber: true })}
          />
          {errors.price_per_km && (
            <p className="text-sm text-red-500 mt-1">
              {errors.price_per_km.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="base_price">Prix de base (€)</Label>
          <Input
            id="base_price"
            type="number"
            step="0.01"
            {...register('base_price', { valueAsNumber: true })}
          />
          {errors.base_price && (
            <p className="text-sm text-red-500 mt-1">
              {errors.base_price.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Enregistrement...'
            : initialData
            ? 'Mettre à jour'
            : 'Créer'}
        </Button>
      </div>
    </form>
  )
}