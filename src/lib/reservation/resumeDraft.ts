/**
 * Une nouvelle réservation part d'un brouillon **vide** ; seul un retour explicite dans le tunnel
 * relit le brouillon persisté.
 *
 * Le store `reservation-store` (localStorage) n'était jamais effacé : les options d'une course
 * précédente restaient cochées et étaient recopiées dans la suivante. Mesuré sur le cloud :
 * 217 courses portaient exactement les deux mêmes options sans que le client les ait choisies.
 *
 * Trois reprises légitimes :
 *  - `?modify=1`  — « Modifier » depuis l'écran de confirmation ;
 *  - `?rebook=1`  — le lien de re-réservation d'une course passée (le préremplissage suit) ;
 *  - un identifiant d'édition en cours (édition d'une réservation existante).
 *
 * Tout le reste — l'arrivée depuis la page d'accueil, « Nouvelle réservation », le bouton
 * Réserver — commence propre.
 */
export interface ReservationDraftResumeInput {
  /** Valeur du paramètre d'URL `modify`. */
  modify: string | null;
  /** Valeur du paramètre d'URL `rebook`. */
  rebook: string | null;
  /** `currentEditingReservationId` dans `localStorage`, ou `null`. */
  editingId: string | null;
}

export function shouldResumeReservationDraft({
  modify,
  rebook,
  editingId,
}: ReservationDraftResumeInput): boolean {
  return modify === "1" || rebook === "1" || editingId !== null;
}
