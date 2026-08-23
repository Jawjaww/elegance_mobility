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
import { Switch } from "@/components/ui/switch";
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
import { useDriversStore } from "@/lib/stores/driversStore";
import { formatPersonName } from "@/lib/rides/rideCancelLabels";
import {
  getAllVehicles,
  updateVehicle,
  deleteVehicle,
  syncVehicleDriverAssignment,
  type VehicleWithDriver,
  type VehicleType,
} from "@/lib/vehicle";

const VEHICLE_TYPES: VehicleType[] = [
  "STANDARD",
  "PREMIUM",
  "VAN",
  "ELECTRIC",
];

const UNASSIGNED_DRIVER = "__none__";

function driverOptionLabel(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  phone: string | null | undefined,
): string {
  const name = formatPersonName(firstName, lastName);
  const trimmedPhone = phone?.trim();
  if (trimmedPhone && name !== "—") return `${name} · ${trimmedPhone}`;
  return name;
}

export default function VehiclesPage() {
  const { toast } = useToast();
  const { drivers, fetchDrivers } = useDriversStore();
  const [vehicles, setVehicles] = useState<VehicleWithDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<VehicleType | "all">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<VehicleWithDriver | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    license_plate: "",
    vehicle_type: "STANDARD" as VehicleType,
    color: "",
    seats: 4,
    validation_status: "pending",
    driver_id: UNASSIGNED_DRIVER,
    is_primary: false,
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
    fetchDrivers();
  }, [load, fetchDrivers]);

  const sortedDrivers = useMemo(
    () =>
      [...drivers].sort((a, b) =>
        driverOptionLabel(a.first_name, a.last_name, a.phone).localeCompare(
          driverOptionLabel(b.first_name, b.last_name, b.phone),
          "fr",
        ),
      ),
    [drivers],
  );

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesType =
        typeFilter === "all" || v.vehicle_type === typeFilter;
      const q = search.trim().toLowerCase();
      const driverName = v.driver
        ? driverOptionLabel(
            v.driver.first_name,
            v.driver.last_name,
            v.driver.phone,
          ).toLowerCase()
        : "";
      const matchesSearch =
        !q ||
        v.license_plate?.toLowerCase().includes(q) ||
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        driverName.includes(q);
      return matchesType && matchesSearch;
    });
  }, [vehicles, typeFilter, search]);

  const openEdit = (vehicle: VehicleWithDriver) => {
    setEditing(vehicle);
    setForm({
      make: vehicle.make ?? "",
      model: vehicle.model ?? "",
      license_plate: vehicle.license_plate ?? "",
      vehicle_type: (vehicle.vehicle_type as VehicleType) ?? "STANDARD",
      color: vehicle.color ?? "",
      seats: vehicle.seats ?? 4,
      validation_status: vehicle.validation_status ?? "pending",
      driver_id: vehicle.driver_id ?? UNASSIGNED_DRIVER,
      is_primary: Boolean(vehicle.is_primary),
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    const driverId =
      form.driver_id === UNASSIGNED_DRIVER ? null : form.driver_id;

    if (form.is_primary && !driverId) {
      toast({
        variant: "destructive",
        title: "Chauffeur requis",
        description:
          "Assignez un chauffeur pour définir ce véhicule comme principal.",
      });
      return;
    }

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
        driver_id: driverId,
        is_primary: driverId ? form.is_primary : false,
        updated_at: new Date().toISOString(),
      });

      await syncVehicleDriverAssignment(
        editing.id,
        driverId,
        Boolean(driverId && form.is_primary),
      );

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

  const handleDelete = async (vehicle: VehicleWithDriver) => {
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
            <div className="space-y-2">
              <Label>Chauffeur assigné</Label>
              <Select
                value={form.driver_id}
                onValueChange={(v) =>
                  setForm({
                    ...form,
                    driver_id: v,
                    is_primary: v === UNASSIGNED_DRIVER ? false : form.is_primary,
                  })
                }
              >
                <SelectTrigger className="bg-neutral-800 border-neutral-700">
                  <SelectValue placeholder="Sélectionner un chauffeur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_DRIVER}>
                    Non assigné
                  </SelectItem>
                  {sortedDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driverOptionLabel(
                        driver.first_name,
                        driver.last_name,
                        driver.phone,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border border-neutral-700 bg-neutral-800/50 px-3 py-2.5">
              <div className="space-y-0.5">
                <Label htmlFor="is-primary" className="text-sm">
                  Véhicule principal du chauffeur
                </Label>
                <p className="text-xs text-neutral-400">
                  Définit aussi le véhicule actuellement utilisé par le
                  chauffeur.
                </p>
              </div>
              <Switch
                id="is-primary"
                checked={form.is_primary}
                disabled={form.driver_id === UNASSIGNED_DRIVER}
                onCheckedChange={(checked) =>
                  setForm({ ...form, is_primary: checked })
                }
              />
            </div>

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
