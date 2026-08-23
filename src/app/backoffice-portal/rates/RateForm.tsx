"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit } from "lucide-react";
import type { Rate } from "@/lib/services/pricingService";

const VEHICLE_TYPES = ["STANDARD", "PREMIUM", "VAN", "ELECTRIC"] as const;

interface RateFormProps {
  onSubmit: (rate: Rate) => Promise<void>;
  initialData?: Rate;
  mode?: "create" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RateForm({
  onSubmit,
  initialData,
  mode = "create",
  open: controlledOpen,
  onOpenChange,
}: Readonly<RateFormProps>) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  };
  const [formData, setFormData] = useState<Partial<Rate>>(
    initialData || {
      vehicleType: "STANDARD",
      pricePerKm: 0,
      basePrice: 0,
      minPrice: 0,
    },
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setFormData(
        initialData || {
          vehicleType: "STANDARD",
          pricePerKm: 0,
          basePrice: 0,
          minPrice: 0,
        },
      );
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (
        !formData.vehicleType ||
        formData.pricePerKm == null ||
        formData.basePrice == null
      ) {
        throw new Error("Tous les champs sont requis");
      }

      setSaving(true);
      await onSubmit({
        vehicleType: formData.vehicleType,
        pricePerKm: Number(formData.pricePerKm),
        basePrice: Number(formData.basePrice),
        minPrice: Number(formData.minPrice ?? 0),
      });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  };

  const submitLabel = (() => {
    if (saving) return "…";
    if (mode === "create") return "Créer";
    return "Enregistrer";
  })();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {mode === "create" ? (
        <DialogTrigger asChild>
          <Button size="sm">Ajouter un tarif</Button>
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-neutral-700 hover:bg-neutral-800"
          >
            <Edit className="w-3.5 h-3.5 mr-2" aria-hidden />
            Modifier
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-neutral-100 border-neutral-700">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nouveau tarif" : "Modifier le tarif"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid w-full gap-2">
            <Label htmlFor="vehicleType">Type de véhicule</Label>
            {mode === "edit" ? (
              <Input
                id="vehicleType"
                value={formData.vehicleType}
                disabled
                className="bg-neutral-800 border-neutral-700"
              />
            ) : (
              <Select
                value={formData.vehicleType}
                onValueChange={(v) =>
                  setFormData({ ...formData, vehicleType: v })
                }
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid w-full gap-2">
            <Label htmlFor="basePrice">Prix de base (€)</Label>
            <Input
              id="basePrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.basePrice ?? 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  basePrice: Number.parseFloat(e.target.value),
                })
              }
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="grid w-full gap-2">
            <Label htmlFor="pricePerKm">Prix par km (€)</Label>
            <Input
              id="pricePerKm"
              type="number"
              step="0.01"
              min="0"
              value={formData.pricePerKm ?? 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricePerKm: Number.parseFloat(e.target.value),
                })
              }
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          <div className="grid w-full gap-2">
            <Label htmlFor="minPrice">Prix minimum (€)</Label>
            <Input
              id="minPrice"
              type="number"
              step="0.01"
              min="0"
              value={formData.minPrice ?? 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  minPrice: Number.parseFloat(e.target.value),
                })
              }
              className="bg-neutral-800 border-neutral-700"
            />
          </div>

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
