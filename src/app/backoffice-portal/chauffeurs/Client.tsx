"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChauffeursPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/backoffice-portal/drivers");
  }, [router]);

  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}
