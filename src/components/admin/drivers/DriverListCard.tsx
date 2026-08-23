"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  FolderOpen,
  IdCard,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import {
  driverStatusColors,
  driverStatusLabels,
} from "@/components/admin/drivers/driverStatusStyles";
import {
  driverDisplayName,
  vehicleSummaryLabel,
  type DriverWithVehicle,
} from "@/lib/drivers/adminDrivers";
import { CopyableRef } from "@/components/admin/CopyableRef";

type DriverListCardProps = Readonly<{
  driver: DriverWithVehicle;
}>;

function InfoRow({
  icon: Icon,
  label,
  value,
}: Readonly<{
  icon: typeof Phone;
  label: string;
  value: string;
}>) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500 mt-0.5" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-neutral-500">
          {label}
        </p>
        <p className="text-sm text-neutral-200 truncate">{value}</p>
      </div>
    </div>
  );
}

export function DriverListCard({ driver }: DriverListCardProps) {
  const name = driverDisplayName(driver);
  const vehicleLabel = vehicleSummaryLabel(driver.current_vehicle);
  const licenseExpiry = driver.driving_license_expiry_date
    ? format(new Date(driver.driving_license_expiry_date), "dd MMM yyyy", {
        locale: fr,
      })
    : null;

  return (
    <Card className="overflow-hidden border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition-all w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <User className="h-5 w-5 text-blue-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base sm:text-lg text-white truncate">
                {name}
              </h3>
              {driver.phone ? (
                <p className="text-xs sm:text-sm text-neutral-400 truncate">
                  {driver.phone}
                </p>
              ) : null}
            </div>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs ${driverStatusColors[driver.status]}`}
          >
            {driverStatusLabels[driver.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {driver.phone ? (
            <InfoRow icon={Phone} label="Téléphone" value={driver.phone} />
          ) : null}
          {vehicleLabel ? (
            <InfoRow icon={Car} label="Véhicule actuel" value={vehicleLabel} />
          ) : null}
          {driver.driving_license_number ? (
            <InfoRow
              icon={IdCard}
              label={
                licenseExpiry
                  ? `Permis · exp. ${licenseExpiry}`
                  : "Permis de conduire"
              }
              value={driver.driving_license_number}
            />
          ) : null}
          {driver.address_line1 ? (
            <InfoRow icon={MapPin} label="Adresse" value={driver.address_line1} />
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
            asChild
          >
            <Link href={`/backoffice-portal/drivers/${driver.id}/documents`}>
              <FolderOpen className="h-3.5 w-3.5 mr-2" aria-hidden />
              Dossier & documents
            </Link>
          </Button>
          <div className="flex items-center gap-2 shrink-0">
            {driver.current_vehicle?.license_plate ? (
              <CopyableRef
                value={driver.current_vehicle.license_plate}
                label={driver.current_vehicle.license_plate}
                toastTitle="Plaque copiée"
                className="text-emerald-500/80 hover:text-emerald-400"
              />
            ) : null}
            <CopyableRef value={driver.id} toastTitle="ID chauffeur copié" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
