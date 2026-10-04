import type { Database } from "@/lib/types/database.types";

export type RideStatus = Database["public"]["Enums"]["ride_status"];

/**
 * Statuts sur lesquels `_cancel_ride_core` accepte une annulation.
 *
 * Miroir volontaire du SQL (migration `20261003190000_operator_ride_actions.sql`) : le serveur
 * reste l'autorité, ces listes ne servent qu'à ne pas afficher un bouton qui échouera. Le test
 * `__tests__/rideActions.test.ts` les fige pour qu'une divergence se voie ici plutôt qu'en
 * production.
 */
export const OPERATOR_CANCELLABLE_STATUSES: RideStatus[] = [
  "pending",
  "scheduled",
  "in-progress",
  "delayed",
  "no-show",
];

/**
 * Statuts sur lesquels `_reassign_ride_core` accepte une réaffectation.
 *
 * Plus étroite que l'annulation à dessein : une course déjà en cours ou terminée ne se
 * réaffecte pas.
 */
export const OPERATOR_REASSIGNABLE_STATUSES: RideStatus[] = [
  "pending",
  "scheduled",
  "delayed",
];

export function canOperatorCancel(status: RideStatus | null | undefined): boolean {
  return Boolean(status) && OPERATOR_CANCELLABLE_STATUSES.includes(status as RideStatus);
}

export function canOperatorReassign(status: RideStatus | null | undefined): boolean {
  return Boolean(status) && OPERATOR_REASSIGNABLE_STATUSES.includes(status as RideStatus);
}

/**
 * Libellés d'affichage. Le type est `Record<RideStatus, string>` et non un objet partiel : si
 * l'enum gagne une valeur, TypeScript refuse la compilation ici plutôt que d'afficher `undefined`
 * dans une liste. Un test énumère aussi l'enum pour attraper le cas où le type serait élargi.
 */
export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  pending: "En attente",
  scheduled: "Planifiée",
  "in-progress": "En cours",
  completed: "Terminée",
  "client-canceled": "Annulée par le client",
  "driver-canceled": "Annulée par le chauffeur",
  "admin-canceled": "Annulée",
  "no-show": "Client absent",
  delayed: "Retardée",
};

export function rideStatusLabel(status: RideStatus | null | undefined): string {
  if (!status) return "—";
  return RIDE_STATUS_LABELS[status] ?? status;
}
