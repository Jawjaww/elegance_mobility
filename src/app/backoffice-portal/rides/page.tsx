"use client";

import { Suspense } from "react";
import RidesClient from "./RidesClient";

function RidesFallback() {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}

export default function RidesPage() {
  return (
    <Suspense fallback={<RidesFallback />}>
      <RidesClient />
    </Suspense>
  );
}
