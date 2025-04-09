import { getServerUser } from "@/lib/database/server";
import { redirect } from "next/navigation";
import ReservationsClient from "./reservations-client";

// Interface pour les réservations
interface Reservation {
  id: string;
  pickup_time: string;
  pickup_address: string;
  dropoff_address: string;
  vehicle_type?: string;
  status: string;
  estimated_price?: number | null;
  distance?: number | null;
  duration?: number | null;
  created_at: string;
  user_id: string;
}

export default async function ReservationsPage() {
  // Utiliser getServerUser au lieu de useAuth
  const user = await getServerUser();
  
  // Rediriger vers la page de connexion si non authentifié
  if (!user) {
    redirect("/login");
  }
  
  return <ReservationsClient user={user} />;
}
