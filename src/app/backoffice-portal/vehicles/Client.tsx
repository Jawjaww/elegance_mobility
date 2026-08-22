"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/useToast";
import { VehicleList } from "@/components/admin/vehicles/VehicleList";
import { VehicleFilters } from "@/components/admin/vehicles/VehicleFilters";
import {
  getAllVehicles,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
  type VehicleType,
} from "@/lib/vehicle";

const VEHICLE_TYPES: VehicleType[] = [
  "STANDARD",
  "PREMIUM",
  "VAN",
  "ELECTRIC",
];

export default function VehiclesPage() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<VehicleType | "all">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    license_plate: "",
    vehicle_type: "STANDARD" as VehicleType,
    color: "",
    seats: 4,
    validation_status: "pending",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllVehicles();
      setVehicles(data ?? []);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error
            ? err.message
            : "Impossible de charger les véhicules",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesType =
        typeFilter === "all" || v.vehicle_type === typeFilter;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        v.license_plate?.toLowerCase().includes(q) ||
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [vehicles, typeFilter, search]);

  const openEdit = (vehicle: Vehicle) => {
    setEditing(vehicle);
    setForm({
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
      license_plate: vehicle.license_plate ?? "",
      vehicle_type: (vehicle.vehicle_type as VehicleType) ?? "STANDARD",
      color: vehicle.color ?? "",
      seats: vehicle.seats ?? 4,
      validation_status: vehicle.validation_status ?? "pending",
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await updateVehicle(editing.id, {
        make: form.make,
        model: form.model,
        license_plate: form.license_plate,
        vehicle_type: form.vehicle_type,
        color: form.color || null,
        seats: form.seats,
        validation_status: form.validation_status,
        updated_at: new Date().toISOString(),
      });
      toast({ title: "Véhicule mis à jour" });
      setEditing(null);
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Échec de la mise à jour",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (
      !globalThis.confirm(
        `Supprimer le véhicule ${vehicle.make} ${vehicle.model} (${vehicle.license_plate}) ?`,
      )
    ) {
      return;
    }
    try {
      await deleteVehicle(vehicle.id);
      toast({ title: "Véhicule supprimé" });
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Échec de la suppression",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-100">Véhicules</h2>
        <p className="text-neutral-400 text-sm mt-1">
          Liste et gestion des véhicules enregistrés
        </p>
      </div>

      <VehicleFilters
        onFilterChange={({ type, search: s }) => {
          if (type) setTypeFilter(type);
          if (s !== undefined) setSearch(s);
        }}
      />

      <VehicleList
        vehicles={filtered}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-[480px] bg-neutral-900 text-neutral-100 border-neutral-700">
          <DialogHeader>
            <DialogTitle>Modifier le véhicule</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="make">Marque</Label>
                <Input
                  id="make"
                  value={form.make}
                  onChange={(e) => setForm({ ...form, make: e.target.value })}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modèle</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">Plaque</Label>
              <Input
                id="plate"
                value={form.license_plate}
                onChange={(e) =>
                  setForm({ ...form, license_plate: e.target.value })
                }
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.vehicle_type}
                  onValueChange={(v) =>
                    setForm({ ...form, vehicle_type: v as VehicleType })
                  }
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut validation</Label>
                <Select
                  value={form.validation_status}
                  onValueChange={(v) =>
                    setForm({ ...form, validation_status: v })
                  }
                >
                  <SelectTrigger className="bg-neutral-800 border-neutral-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">pending</SelectItem>
                    <SelectItem value="approved">approved</SelectItem>
                    <SelectItem value="rejected">rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <Input
                  id="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seats">Places</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  value={form.seats}
                  onChange={(e) =>
                    setForm({ ...form, seats: Number(e.target.value) || 4 })
                  }
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
