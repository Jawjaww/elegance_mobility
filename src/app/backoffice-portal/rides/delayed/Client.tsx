"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore";

export default function DelayedRidesPage() {
  const router = useRouter();
  const { setSelectedStatus } = useUnifiedRidesStore();

  useEffect(() => {
    setSelectedStatus("delayed");
    router.replace("/backoffice-portal/rides?filter=delayed");
  }, [router, setSelectedStatus]);

  return null;
}
