/**
 * Le choix du mode de paiement, à la réservation (F-01 amont).
 *
 * Ce que le client a le droit de choisir dépend d'un **réglage** de politique
 * (`online_payment_enabled`), éteint tant qu'aucun prestataire de paiement n'est configuré :
 * proposer « payer en ligne » sans pouvoir débiter ferait croire au client qu'il a payé, et le
 * chauffeur partirait sans réclamer (D-17, D-21).
 *
 * Cette logique vit hors du composant pour être testable : elle décide ce qu'on promet au client.
 */

export type BookingPaymentMethod = "cash" | "card";

export interface PaymentChoiceContext {
  /** Le réglage de politique : le paiement en ligne est-il ouvert ? */
  onlineEnabled: boolean;
}

export const PAYMENT_METHOD_LABELS: Record<BookingPaymentMethod, string> = {
  cash: "Espèces à bord",
  card: "Payer en ligne",
};

export const ONLINE_PAYMENT_DISABLED_NOTICE =
  "Le paiement en ligne n'est pas encore ouvert : vous réglerez directement au chauffeur.";

/**
 * Ce que le tunnel a le droit de proposer, dans l'ordre d'affichage.
 */
export function availablePaymentMethods(
  context: PaymentChoiceContext,
): BookingPaymentMethod[] {
  return context.onlineEnabled ? ["cash", "card"] : ["cash"];
}

/**
 * Le mode qui sera réellement enregistré sur la course.
 *
 * Un choix devenu indisponible (le réglage a été éteint, ou l'état vient d'un ancien écran)
 * retombe sur les espèces : on n'enregistre **jamais** un mode qu'on ne propose pas, sinon le
 * chauffeur verrait une carte à encaisser sur une course que personne ne débitera.
 */
export function resolvePaymentMethod(
  selected: BookingPaymentMethod | null | undefined,
  context: PaymentChoiceContext,
): BookingPaymentMethod {
  const available = availablePaymentMethods(context);
  if (selected && available.includes(selected)) return selected;
  return "cash";
}

/**
 * La phrase qui accompagne le choix — elle dit au client ce qui va se passer, sans rien promettre.
 */
export function paymentMethodNotice(
  method: BookingPaymentMethod,
  context: PaymentChoiceContext,
): string {
  if (!context.onlineEnabled) return ONLINE_PAYMENT_DISABLED_NOTICE;

  if (method === "card") {
    return "Vous serez débité en ligne : le chauffeur n'aura rien à encaisser.";
  }

  return "Vous réglerez directement au chauffeur à la fin de la course.";
}
