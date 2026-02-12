import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { Database } from "../../lib/types/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Rate = Database["public"]["Tables"]["rates"]["Row"];
type RateInsert = Database["public"]["Tables"]["rates"]["Insert"];
type VehicleType = Database["public"]["Enums"]["vehicle_type_enum"];

// Valeurs directes depuis database.types.ts (source de vérité Supabase)
import { VEHICLE_TYPES as RUNTIME_VEHICLE_TYPES } from '@/lib/utils/vehicle';
// RUNTIME_VEHICLE_TYPES is declared `as const` in utils; cast it into the tuple shape z.enum expects
const VEHICLE_TYPES = RUNTIME_VEHICLE_TYPES as unknown as [string, ...string[]];

const rateSchema = z.object({
  vehicle_type: z.enum(VEHICLE_TYPES),
  price_per_km: z.number().min(0),
  base_price: z.number().min(0),
});

type RateFormValues = z.infer<typeof rateSchema>;

interface RateFormProps {
  initialData?: Rate;
  onSubmit: (data: RateInsert) => Promise<void>;
  onCancel: () => void;
}

export default function RateForm({
  initialData,
  onSubmit,
  onCancel,
}: Readonly<RateFormProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: initialData || {
      vehicle_type: "STANDARD",
      price_per_km: 0,
      base_price: 0,
    },
  });

  const selectedVehicleType = watch("vehicle_type");

  const handleVehicleTypeChange = (value: string) => {
    setValue("vehicle_type", value as VehicleType);
  };

  const onFormSubmit = async (data: RateFormValues) => {
    try {
      setIsSubmitting(true);
      // data.vehicle_type is validated by zod, but cast to RateInsert to satisfy API signature
      await onSubmit(data as unknown as RateInsert);
    } finally {
      setIsSubmitting(false);
    }
  };

  let submitLabel = "Créer";
  if (isSubmitting) submitLabel = "Enregistrement...";
  else if (initialData) submitLabel = "Mettre à jour";

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
              {VEHICLE_TYPES.map((type) => (
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
            {...register("price_per_km", { valueAsNumber: true })}
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
            {...register("base_price", { valueAsNumber: true })}
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
