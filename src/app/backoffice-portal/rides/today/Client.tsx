"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { format } from "date-fns";
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore";

export default function TodayRidesPage() {
  const router = useRouter();
  const { setSelectedDate, setViewMode, setSelectedStatus } =
    useUnifiedRidesStore();

  useEffect(() => {
    const today = new Date();
    setSelectedDate(today);
    setViewMode("day");
    setSelectedStatus("all");
    router.replace(
      `/backoffice-portal/rides?view=day&date=${format(today, "yyyy-MM-dd")}`,
    );
  }, [router, setSelectedDate, setViewMode, setSelectedStatus]);

  return null;
}
