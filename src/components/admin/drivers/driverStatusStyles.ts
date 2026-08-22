import type { Database } from "@/lib/types/database.types";

type DriverStatus = Database["public"]["Enums"]["driver_status"];

export const driverStatusColors: Record<DriverStatus, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  inactive: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
  pending_validation: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  suspended: "bg-red-500/20 text-red-400 border-red-500/30",
  on_vacation: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  incomplete: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  draft: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  pending_review: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export const driverStatusLabels: Record<DriverStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  pending_validation: "En attente de validation",
  suspended: "Suspendu",
  on_vacation: "En congé",
  incomplete: "Dossier incomplet",
  draft: "Brouillon",
  rejected: "Rejeté",
  pending_review: "En révision",
};

export const docStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  pending_temp: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  approved: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

export const docStatusLabels: Record<string, string> = {
  pending: "En attente",
  pending_temp: "En attente (temp.)",
  approved: "Approuvé",
  rejected: "Rejeté",
};
