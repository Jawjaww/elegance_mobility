import { Badge } from "@/components/ui/badge";

type ReservationStatus = 'pending' | 'accepted' | 'canceled' | 'completed' | 'inProgress' | string;

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  className?: string;
}

const statusMap: Record<string, { label: string, variant: string }> = {
  pending: { label: "En attente", variant: "pending" },
  accepted: { label: "Accepté", variant: "accepted" },
  canceled: { label: "Annulé", variant: "canceled" },
  completed: { label: "Terminé", variant: "completed" },
  inProgress: { label: "En cours", variant: "inProgress" },
};

export function ReservationStatusBadge({ status, className }: ReservationStatusBadgeProps) {
  // Vérification de sécurité
  if (!status) {
    console.warn("Status non défini dans ReservationStatusBadge");
    return null;
  }

  // Normaliser le statut (en minuscules et sans espace)
  const normalizedStatus = status.toString().toLowerCase().replace(/\s+/g, '');
  
  // Obtenir les informations du statut ou utiliser un fallback
  const statusInfo = statusMap[normalizedStatus] || { 
    label: status.toString().charAt(0).toUpperCase() + status.toString().slice(1).toLowerCase(), 
    variant: "default"
  };
  
  // Ajouter certaines classes supplémentaires pour s'assurer que le badge est visible
  return (
    <Badge 
      variant={statusInfo.variant as any}
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${className || ''}`}
    >
      {statusInfo.label}
    </Badge>
  );
}
