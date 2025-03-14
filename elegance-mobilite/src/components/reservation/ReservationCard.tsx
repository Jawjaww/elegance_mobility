import { formatCurrency } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { formatDateTime } from "@/lib/utils/date-format";
import { Car, MapPin } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface ReservationCardProps {
  ride: {
    id: string;
    pickup_time: string;
    pickup_address: string;
    dropoff_address: string;
    vehicle_type?: string;
    status: string;
    estimated_price?: number | null;
    distance?: number | null;
    created_at: string;
  };
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDetails?: (id: string) => void;
}

export default function ReservationCard({
  ride,
  onEdit,
  onCancel,
  onDetails,
}: ReservationCardProps) {
  // S'assurer que l'ID de la réservation est défini
  if (!ride.id) {
    console.error("Réservation sans ID détectée", ride);
    return null;
  }

  // Formater la date et l'heure
  const formattedDateTime = formatDateTime(ride.pickup_time);

  // Fonction pour capitaliser la première lettre
  const capitalize = (str: string) => {
    return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
  };

  // Déterminer le type de trajet à afficher dans l'en-tête
  const getVehicleTypeDisplay = () => {
    if (!ride.vehicle_type) return "Trajet VTC";
    
    const vehicleType = ride.vehicle_type.toLowerCase();
    
    if (vehicleType.includes("van")) return "Trajet Van";
    if (vehicleType.includes("premium")) return "Trajet Premium";
    if (vehicleType.includes("standard")) return "Trajet Standard";
    
    // Capitaliser le type pour tout autre cas
    return `Trajet ${capitalize(vehicleType)}`;
  };

  return (
    <Card className="overflow-hidden border-neutral-800 bg-neutral-900">
      <CardHeader className="border-b border-neutral-800 bg-neutral-950/50 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-neutral-100">{getVehicleTypeDisplay()}</h3>
          </div>
          <StatusBadge status={ride.status} className="shadow-sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="text-sm">
          <p className="font-medium text-neutral-100">{formattedDateTime}</p>
        </div>

        <div className="space-y-3">
          <div className="flex">
            <div className="mr-2 flex flex-col items-center">
              {/* Remplacer les points colorés par des icônes */}
              <MapPin className="h-4 w-4 text-green-500" />
              <div className="h-10 w-0.5 bg-neutral-800"></div>
              <MapPin className="h-4 w-4 text-red-500" />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-400">Départ</p>
                <p className="text-sm text-neutral-100">{ride.pickup_address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-400">Destination</p>
                <p className="text-sm text-neutral-100">{ride.dropoff_address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Prix affiché directement sans le type de véhicule en doublon */}
        <div className="flex justify-end pt-2">
          <div className="text-lg font-semibold text-neutral-100">
            {ride.estimated_price
              ? formatCurrency(ride.estimated_price)
              : "Prix non défini"}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-neutral-800 bg-neutral-950/50 px-4 py-2">
        <div className="flex w-full justify-end gap-2">
          {onDetails && (
            <Button
              variant="outline"  // Changé de "ghost" à "outline" pour avoir un contour
              size="sm"
              className="h-8 px-3 text-xs bg-neutral-800 border-neutral-700 hover:bg-neutral-700 hover:text-neutral-100"  
              onClick={() => onDetails(ride.id)}
            >
              Détails
            </Button>
          )}
          {onEdit && ride.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs bg-blue-900/30 border-blue-600/50 text-blue-400 hover:bg-blue-900/50 hover:border-blue-500 hover:text-blue-300"  
              onClick={() => onEdit(ride.id)}
            >
              Modifier
            </Button>
          )}
          {onCancel && ride.status === 'pending' && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 px-3 text-xs bg-red-700/10 border-red-700/90 text-red-400 hover:bg-red-700/30 hover:border-red-500 hover:text-red-300"
              onClick={() => onCancel(ride.id)}
            >
              Annuler
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
