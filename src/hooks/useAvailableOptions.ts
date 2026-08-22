"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listAvailableOptions,
  type CatalogOption,
} from "@/lib/services/optionsCatalogService";

export function useAvailableOptions() {
  const [options, setOptions] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listAvailableOptions();
      setOptions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger les options",
      );
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { options, loading, error, reload };
}
