import { CustomerGuard } from "@/components/auth/RoleGuard";
import ReservationsClient from "./reservations-client";
import { getServerUser } from "@/lib/database/server";

// import type { Database } from "@/lib/types/database.types";
// type Reservation = Database["public"]["Tables"]["rides"]["Row"];

export default async function ReservationsPage() {
  const user = await getServerUser();
  
  return (
    <CustomerGuard>
      <ReservationsClient user={user!} />
    </CustomerGuard>
  );
}
