import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/services/statusService";

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "default" | "sm" | "lg";
  showDetailedCancellation?: boolean; // Option pour afficher les détails d'annulation (admin only)
}

export function StatusBadge({ 
  status, 
  className = "", 
  size = "default",
  showDetailedCancellation = false 
}: StatusBadgeProps) {
  // Normaliser le statut (en minuscules et sans espace)
  const normalizedStatus = status?.toString().toLowerCase().replace(/\s+/g, '') || 'pending';
  
  // Mapper à une variante de badge
  let variant: string;
  
  // Simplifier l'interface - tous les types d'annulation sont juste "canceled"
  if (normalizedStatus.includes('canceled') || normalizedStatus.includes('cancelled')) {
    variant = "canceled"; // Utiliser une seule variante pour tous les types d'annulation
  } else {
    switch (normalizedStatus) {
      case 'pending':
        variant = "pending";
        break;
      case 'accepted':
      case 'scheduled':
        variant = "accepted";
        break;
      case 'inprogress':
      case 'in-progress':
      case 'in_progress':
        variant = "inProgress";
        break;
      case 'completed':
        variant = "completed";
        break;
      default:
        variant = "default";
    }
  }

  // Simplifier le label pour les annulations - afficher simplement "Annulée"
  let displayLabel;
  
  if (normalizedStatus.includes('canceled') || normalizedStatus.includes('cancelled')) {
    // Afficher les détails seulement si demandé (mode admin)
    displayLabel = showDetailedCancellation 
      ? STATUS_LABELS[normalizedStatus as keyof typeof STATUS_LABELS] || "Annulée"
      : "Annulée";
  } else {
    displayLabel = STATUS_LABELS[normalizedStatus as keyof typeof STATUS_LABELS] || 
                  (status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase());
  }
  
  return (
    <Badge 
      variant={variant as any}
      size={size}
      className={className}
    >
      {displayLabel}
    </Badge>
  );
}

// Pour compatibilité avec le code existant
export const SimpleStatusBadge = StatusBadge;
export const ReservationStatusBadge = StatusBadge;
