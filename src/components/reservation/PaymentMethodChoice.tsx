"use client";

import { Check, CreditCard, Euro } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RESERVATION_PICKER_CARD,
  RESERVATION_PICKER_CARD_SELECTED,
  RESERVATION_PICKER_ICON,
  RESERVATION_PICKER_ICON_SELECTED,
} from "@/components/landing/landingSurface";
import {
  availablePaymentMethods,
  ONLINE_PAYMENT_UNAVAILABLE_LABEL,
  PAYMENT_METHOD_LABELS,
  type BookingPaymentMethod,
  type PaymentChoiceContext,
} from "@/lib/reservation/paymentChoice";

const SUMMARY_SHELL =
  "rounded-2xl border border-blue-500/15 bg-neutral-800/40";

const DISPLAY_METHODS: ReadonlyArray<{
  id: BookingPaymentMethod;
  Icon: typeof Euro;
}> = [
  { id: "cash", Icon: Euro },
  { id: "card", Icon: CreditCard },
];

function paymentIconChrome(disabled: boolean, selected: boolean): string {
  if (disabled) return "border-neutral-800 bg-neutral-900";
  return selected ? RESERVATION_PICKER_ICON_SELECTED : RESERVATION_PICKER_ICON;
}

/**
 * Payment method on the vehicle step (F-01 upstream). Confirmation only records it.
 *
 * Two compact picker tiles — same chrome as reservation options. Online payment stays visible
 * when the policy is off: greyed, disabled, labelled Indisponible. A tap cannot write `card`.
 */
export function PaymentMethodChoice({
  value,
  onChange,
  context,
  embedded = false,
  showTopSeparator = false,
  className,
}: Readonly<{
  value: BookingPaymentMethod;
  onChange: (method: BookingPaymentMethod) => void;
  context: PaymentChoiceContext;
  /** Nested inside another shell — no second card. */
  embedded?: boolean;
  /** Divider above payment when stacked under another row. */
  showTopSeparator?: boolean;
  className?: string;
}>) {
  const offered = availablePaymentMethods(context);

  return (
    <fieldset
      className={cn(
        "m-0 w-full min-w-0 border-0 p-0",
        embedded ? "px-4 pb-3 pt-2 sm:px-6" : "px-4 py-2.5 sm:px-6 sm:py-3",
        embedded
          ? showTopSeparator && "border-t border-white/[0.08]"
          : SUMMARY_SHELL,
        className,
      )}
    >
      <legend className="mb-1.5 w-full px-0 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        Paiement
      </legend>
      <div className="grid w-full grid-cols-2 gap-2 md:max-w-sm">
        {DISPLAY_METHODS.map(({ id, Icon }) => {
          const disabled = !offered.includes(id);
          const selected = !disabled && id === value;

          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              aria-pressed={disabled ? undefined : selected}
              aria-disabled={disabled}
              aria-label={
                disabled
                  ? `${PAYMENT_METHOD_LABELS[id]}, ${ONLINE_PAYMENT_UNAVAILABLE_LABEL}`
                  : PAYMENT_METHOD_LABELS[id]
              }
              onClick={() => onChange(id)}
              className={cn(
                "relative flex min-h-0 items-center gap-2 rounded-xl border py-1.5 pl-2.5 text-left transition-all duration-200",
                selected ? "pr-6" : "pr-2.5",
                disabled &&
                  "cursor-not-allowed border-neutral-800 bg-neutral-900/50",
                !disabled && selected && RESERVATION_PICKER_CARD_SELECTED,
                !disabled && !selected && RESERVATION_PICKER_CARD,
              )}
            >
              {selected ? (
                <span
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white"
                  aria-hidden
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              ) : null}

              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border",
                  paymentIconChrome(disabled, selected),
                )}
              >
                <Icon
                  className={cn(
                    "h-3.5 w-3.5",
                    disabled ? "text-neutral-500" : "text-blue-400",
                  )}
                  aria-hidden
                />
              </span>

              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    disabled ? "text-neutral-500" : "text-white",
                  )}
                >
                  {PAYMENT_METHOD_LABELS[id]}
                </span>
                {disabled ? (
                  <span className="text-[10px] font-medium leading-tight text-neutral-500">
                    {ONLINE_PAYMENT_UNAVAILABLE_LABEL}
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
