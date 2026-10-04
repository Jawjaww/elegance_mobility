"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/database/client";

/**
 * La flotte de l'appelant, lue depuis `operator_members`.
 *
 * Lecture directe de la table plutôt que de la RPC `get_current_operator_id()` : la politique
 * `operator_members_self_select` n'expose que sa propre ligne (vérifié au tour OP-04), donc le
 * filtre `user_id` est la lecture attendue, pas un contournement — et la page n'a pas à dépendre
 * de l'exposition PostgREST d'une fonction.
 */
export interface OperatorTenant {
  operatorId: string;
  role: string;
}

export function useOperatorTenant() {
  const [tenant, setTenant] = useState<OperatorTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Session introuvable. Reconnectez-vous.");
        return;
      }

      const { data, error: readError } = await supabase
        .from("operator_members")
        .select("operator_id, role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (readError) throw new Error(readError.message);

      setTenant(data ? { operatorId: data.operator_id, role: data.role } : null);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Lecture du rattachement impossible.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { tenant, loading, error, reload: load };
}
