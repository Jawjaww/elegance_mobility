"use client";

import { Button } from "@/components/ui/button";
import {
  availablePaymentMethods,
  PAYMENT_METHOD_LABELS,
  paymentMethodNotice,
  type BookingPaymentMethod,
  type PaymentChoiceContext,
} from "@/lib/reservation/paymentChoice";

/**
 * Le choix du mode de paiement, au moment de confirmer (F-01 amont).
 *
 * Ce que le client peut choisir dépend du réglage `online_payment_enabled`, et la phrase sous les
 * boutons dit toujours ce qui va se passer. Quand le paiement en ligne est fermé, un seul bouton
 * s'affiche **avec l'explication** : un bouton grisé sans raison laisse le client chercher, une
 * phrase lui dit pourquoi.
 */
export function PaymentMethodChoice({
  value,
  onChange,
  context,
}: Readonly<{
  value: BookingPaymentMethod;
  onChange: (method: BookingPaymentMethod) => void;
  context: PaymentChoiceContext;
}>) {
  const methods = availablePaymentMethods(context);

  return (
    <div className="w-full rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-semibold text-neutral-900">Paiement</p>
      <div className="mt-3 flex gap-2">
        {methods.map((method) => {
          const active = method === value;
          return (
            <Button
              key={method}
              type="button"
              variant={active ? "default" : "outline"}
              aria-pressed={active}
              onClick={() => onChange(method)}
              className="min-h-11 flex-1"
            >
              {PAYMENT_METHOD_LABELS[method]}
            </Button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        {paymentMethodNotice(value, context)}
      </p>
    </div>
  );
}
