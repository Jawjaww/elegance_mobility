"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore";

export default function TodayRidesPage() {
  const router = useRouter();
  const { setSelectedDate, setViewMode, setSelectedStatus } =
    useUnifiedRidesStore();

  useEffect(() => {
    setSelectedDate(new Date());
    setViewMode("day");
    setSelectedStatus("all");
    router.replace("/backoffice-portal/rides");
  }, [router, setSelectedDate, setViewMode, setSelectedStatus]);

  return null;
}
