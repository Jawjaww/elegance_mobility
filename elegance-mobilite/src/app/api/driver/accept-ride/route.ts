import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const acceptRideSchema = z.object({
  rideId: z.string().uuid(),
});

async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: true,
        storageKey: 'elegance-auth'
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Pas de modification de cookies dans les API routes
        }
      }
    }
  );
}

/**
 * POST /api/driver/accept-ride
 * Permet à un chauffeur authentifié d'accepter une course
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const driverId = user.id;

    // Parser et valider le body
    const body = await request.json();
    const validation = acceptRideSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { rideId } = validation.data;

    // Vérifier que l'utilisateur est bien un chauffeur
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, is_active, is_online")
      .eq("id", driverId)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { error: "Compte chauffeur non trouvé" },
        { status: 403 }
      );
    }

    if (!driver.is_active) {
      return NextResponse.json(
        { error: "Compte chauffeur inactif" },
        { status: 403 }
      );
    }

    // Appeler la fonction SQL accept_ride
    const { data: result, error: rpcError } = await supabase.rpc("accept_ride", {
      p_ride_id: rideId,
      p_driver_id: driverId,
    });

    if (rpcError) {
      console.error("[accept-ride] RPC error:", rpcError);
      return NextResponse.json(
        { error: "Erreur lors de l'acceptation", details: rpcError.message },
        { status: 500 }
      );
    }

    // La fonction retourne un JSON avec success: true/false
    if (!result.success) {
      return NextResponse.json(
        { error: result.error, details: result },
        { status: 409 } // Conflict si déjà prise
      );
    }

    return NextResponse.json({
      success: true,
      rideId: result.ride_id,
      status: result.status,
      acceptedAt: result.accepted_at,
    });

  } catch (error) {
    console.error("[accept-ride] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
