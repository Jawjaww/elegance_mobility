import React from "react";

interface SimpleStatusBadgeProps {
  status: string;
  className?: string;
}

// Map des styles CSS pour chaque statut avec des couleurs plus contrastées
const statusStyles: Record<string, { bg: string, text: string }> = {
  pending: { bg: "bg-amber-600", text: "text-amber-100" },
  accepted: { bg: "bg-green-600", text: "text-green-100" },
  canceled: { bg: "bg-red-600", text: "text-red-100" },
  completed: { bg: "bg-blue-600", text: "text-blue-100" },
  inProgress: { bg: "bg-purple-600", text: "text-purple-100" },
};

// Map des libellés pour chaque statut
const statusLabels: Record<string, string> = {
  pending: "En attente",
  accepted: "Accepté",
  canceled: "Annulé",
  completed: "Terminé",
  inProgress: "En cours",
};

export function SimpleStatusBadge({ status, className = "" }: SimpleStatusBadgeProps) {
  // Vérifier si le statut est valide
  if (!status) {
    return (
      <span className="inline-flex rounded-md px-3 py-1 text-xs font-medium bg-gray-500 text-white">
        Inconnu
      </span>
    );
  }

  // Normaliser le statut pour la correspondance
  const normalizedStatus = status.toString().toLowerCase().replace(/\s+/g, '');
  
  // Obtenir style et libellé
  const style = statusStyles[normalizedStatus] || { bg: "bg-gray-500", text: "text-white" };
  const label = statusLabels[normalizedStatus] || status;
  
  // Afficher le badge avec les styles appropriés
  return (
    <span className={`inline-flex rounded-md px-3 py-1 text-xs font-medium ${style.bg} ${style.text} ${className}`}>
      {label}
    </span>
  );
}
