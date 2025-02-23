import { useCallback } from "react";
import { VehicleType, getVehicleTypes } from "@/lib/vehicle";
import { Badge } from "@/components/ui/badge";

interface SimpleVehicleSelectionProps {
  selectedType: VehicleType | null;
  onSelect: (type: VehicleType) => void;
  className?: string;
}

export default function SimpleVehicleSelection({
  selectedType,
  onSelect,
  className = "",
}: SimpleVehicleSelectionProps) {
  const vehicleTypes = getVehicleTypes();

  const getVehicleLabel = useCallback((type: VehicleType) => {
    switch (type) {
      case "STANDARD":
        return "Berline Standard";
      case "PREMIUM":
        return "Berline Confort";
      case "ELECTRIC":
        return "Berline Electrique";
      case "VAN":
        return "Van/Minibus";
      default:
        return type;
    }
  }, []);

  const getVehicleDescription = useCallback((type: VehicleType) => {
    switch (type) {
      case "STANDARD":
        return "Idéal pour 1-4 personnes, confort et efficacité";
      case "PREMIUM":
        return "Expérience premium, service haut de gamme";
      case "ELECTRIC":
        return "Voyagez en toute tranquilité avec notre flotte de véhicules électriques";
      case "VAN":
        return "Parfait pour les groupes de 5-8 personnes";
      default:
        return "";
    }
  }, []);

  return (
    <div className={`grid gap-4 ${className}`}>
      {vehicleTypes.map((type) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className={`p-4 border rounded-lg transition-all ${
            selectedType === type
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-primary/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">{getVehicleLabel(type)}</h3>
            <Badge variant={selectedType === type ? "default" : "outline"}>
              {type}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            {getVehicleDescription(type)}
          </p>
        </button>
      ))}
    </div>
  );
}
