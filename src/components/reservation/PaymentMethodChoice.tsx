"use client";

import { cn } from "@/lib/utils";
import {
  availablePaymentMethods,
  ONLINE_PAYMENT_DISABLED_INLINE_HINT,
  PAYMENT_METHOD_LABELS,
  paymentMethodNotice,
  type BookingPaymentMethod,
  type PaymentChoiceContext,
} from "@/lib/reservation/paymentChoice";

const SUMMARY_SHELL =
  "rounded-2xl border border-blue-500/15 bg-neutral-800/40";

/**
 * Payment method at confirm time (F-01 upstream).
 *
 * Styling matches {@link PriceSummaryBar} on the same screen. When online payment is off, a
 * single row replaces a toggle and the long policy sentence stays off-screen (sr-only) so the
 * summary bar does not grow by a full text line.
 */
export function PaymentMethodChoice({
  value,
  onChange,
  context,
  embedded = false,
  showTopSeparator = false,
}: Readonly<{
  value: BookingPaymentMethod;
  onChange: (method: BookingPaymentMethod) => void;
  context: PaymentChoiceContext;
  /** Nested inside the price summary shell — no second card. */
  embedded?: boolean;
  /** Divider above payment when stacked under the price row. */
  showTopSeparator?: boolean;
}>) {
  const methods = availablePaymentMethods(context);
  const notice = paymentMethodNotice(value, context);
  const cashOnly = methods.length === 1;

  return (
    <div
      className={cn(
        embedded ? "px-4 py-2 sm:px-6 sm:py-2.5" : "px-4 py-2.5 sm:px-6 sm:py-3",
        embedded
          ? showTopSeparator && "border-t border-white/[0.08]"
          : SUMMARY_SHELL,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 items-baseline justify-between gap-x-4 gap-y-0.5",
          !cashOnly && "flex-col sm:flex-row sm:items-center",
        )}
      >
        <p className="text-xs text-neutral-400 sm:shrink-0">Paiement</p>

        {cashOnly ? (
          <p className="text-right text-sm font-medium text-white sm:text-right">
            {PAYMENT_METHOD_LABELS.cash}
            <span className="font-normal text-neutral-500">
              {" "}
              · {ONLINE_PAYMENT_DISABLED_INLINE_HINT}
            </span>
            <span className="sr-only">. {notice}</span>
          </p>
        ) : (
          <div className="flex w-full gap-2 sm:w-auto sm:min-w-[16rem]">
            {methods.map((method) => {
              const active = method === value;
              return (
                <button
                  key={method}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange(method)}
                  className={cn(
                    "min-h-9 flex-1 rounded-lg border px-3 text-sm font-medium transition-colors",
                    active
                      ? "border-blue-400/50 bg-blue-500/20 text-white"
                      : "border-blue-400/25 bg-transparent text-neutral-300 hover:bg-blue-500/10 hover:text-white",
                  )}
                >
                  {PAYMENT_METHOD_LABELS[method]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {!cashOnly ? (
        <p className="mt-1.5 text-[11px] leading-snug text-neutral-500 sm:text-right">
          {notice}
        </p>
      ) : null}
    </div>
  );
}

export { SUMMARY_SHELL as confirmationSummaryShell };
