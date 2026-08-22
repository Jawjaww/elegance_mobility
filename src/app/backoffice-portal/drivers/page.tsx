import { Suspense } from "react";
import { DriversManagement } from "@/components/admin/drivers/DriversManagement";

function DriversLoading() {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
    </div>
  );
}

export default async function AdminDriversPage() {
  return (
    <Suspense fallback={<DriversLoading />}>
      <DriversManagement />
    </Suspense>
  );
}
