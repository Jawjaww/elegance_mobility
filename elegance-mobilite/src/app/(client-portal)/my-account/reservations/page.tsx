import { redirect } from "next/navigation";
import ReservationsClient from "./reservations-client";
import { getServerUser } from "@/lib/database/server";
import { getAppRole } from "@/lib/types/common.types";

export default async function ReservationsPage() {
  const user = await getServerUser();
  
  if (!user || !['app_customer', 'app_admin', 'app_super_admin'].includes(getAppRole(user) || '')) {
    redirect("/auth/login?redirectTo=/my-account/reservations");
  }
  
  return <ReservationsClient user={user} />;
}
