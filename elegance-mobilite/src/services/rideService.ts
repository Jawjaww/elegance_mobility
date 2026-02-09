import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

/**
 * Accepte une course en utilisant le client Supabase côté navigateur.
 * Utilisable dans un contexte Tauri (pas de cookies serveur).
 */
export const acceptRide = async (rideId: string) => {
  const supabase = createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw userError ?? new Error("Utilisateur non authentifié");
  }

  const driverId = user.id;

  // Utiliser la fonction SQL `accept_ride` côté DB pour respecter la logique
  // serveur (conflits, vérifications, historique, ...) — garde la même
  // signature que l'implémentation server-side.
  const { data, error } = await supabase.rpc("accept_ride", {
    p_ride_id: rideId,
    p_driver_id: driverId,
  });

  if (error) throw error;
  // La fonction retourne typiquement un objet JSON { success, error?, ride_id?, status?, accepted_at? }
  return data;
};

export default acceptRide;
