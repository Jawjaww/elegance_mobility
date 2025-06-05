import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type UiStatus } from "@/lib/services/statusService";

interface StatusBadgeProps {
  status: UiStatus | string;
  className?: string;
  size?: "default" | "sm" | "lg";
  showDetailed?: boolean; // Option pour afficher les labels détaillés (pour les sélecteurs)
}

export function StatusBadge({ 
  status, 
  className = "", 
  size = "default",
  showDetailed = false 
}: StatusBadgeProps) {
  // Normaliser le statut pour correspondre aux types UiStatus
  let normalizedStatus: UiStatus;
  
  // Conversion des statuts de base de données vers UI
  switch (status) {
    case 'client-canceled':
      normalizedStatus = 'clientCanceled';
      break;
    case 'driver-canceled':
      normalizedStatus = 'driverCanceled';
      break;
    case 'admin-canceled':
      normalizedStatus = 'adminCanceled';
      break;
    case 'no-show':
      normalizedStatus = 'noShow';
      break;
    case 'in-progress':
      normalizedStatus = 'inProgress';
      break;
    case 'scheduled':
      normalizedStatus = 'accepted';
      break;
    default:
      normalizedStatus = status as UiStatus;
  }
  
  // Mapper à une variante de badge
  let variant: string;
  
  switch (normalizedStatus) {
    case 'pending':
      variant = "pending";
      break;
    case 'accepted':
      variant = "accepted";
      break;
    case 'inProgress':
      variant = "inProgress";
      break;
    case 'completed':
      variant = "completed";
      break;
    case 'noShow':
      variant = "noShow"; // noShow a maintenant sa propre variante violette
      break;
    case 'delayed':
      variant = "delayed"; // delayed a maintenant sa propre variante amber
      break;
    case 'clientCanceled':
    case 'driverCanceled':
    case 'adminCanceled':
      variant = "canceled";
      break;
    default:
      variant = "default";
  }

  // Gérer l'affichage du label
  let displayLabel;
  
  if (['clientCanceled', 'driverCanceled', 'adminCanceled'].includes(normalizedStatus)) {
    // Pour les annulations, utiliser showDetailed pour décider du niveau de détail
    if (showDetailed) {
      displayLabel = STATUS_LABELS[normalizedStatus] || "Annulée";
    } else {
      displayLabel = "Annulée";
    }
  } else {
    // Pour les autres statuts, toujours afficher le label complet
    displayLabel = STATUS_LABELS[normalizedStatus] || 
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
