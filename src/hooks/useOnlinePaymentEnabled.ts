"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/database/client";

/**
 * Policy flag for « En ligne ». Defaults to false: a failed read must not offer a charge
 * the platform cannot take.
 */
export function useOnlinePaymentEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await supabase
        .from("ride_fee_policies")
        .select("online_payment_enabled")
        .eq("scope_kind", "platform")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        setEnabled(data?.online_payment_enabled === true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return enabled;
}
