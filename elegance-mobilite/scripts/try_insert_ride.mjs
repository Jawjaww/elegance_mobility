import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config({ path: "./.env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON) {
  console.error("Missing SUPABASE_URL or ANON key in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON, {
  auth: { persistSession: false },
});

async function run() {
  // Sign in
  const { data: signData, error: signError } =
    await supabase.auth.signInWithPassword({
      email: "testbot1@elegance-mobilite.local",
      password: "password123",
    });
  if (signError) {
    console.error("Sign-in error:", signError);
    process.exit(1);
  }

  const accessToken = signData?.session?.access_token;
  console.log("Got token length:", accessToken?.length || 0);

  // Create a client that includes the user's access token in headers
  const authed = createClient(SUPABASE_URL, ANON, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: ANON,
      },
    },
  });

  const newRide = {
    user_id: signData.user.id,
    pickup_address: "Test Start",
    pickup_lat: 48.8566,
    pickup_lon: 2.3522,
    dropoff_address: "Test End",
    dropoff_lat: 48.86,
    dropoff_lon: 2.33,
    pickup_time: new Date().toISOString(),
    vehicle_type: "STANDARD",
    options: [],
    distance: 10,
    duration: 900,
  };

  const { data, error } = await authed
    .from("rides")
    .insert(newRide)
    .select()
    .maybeSingle();
  console.log("Insert result data:", data);
  console.log("Insert result error:", error);
}

run().catch((e) => {
  console.error("Unexpected exception:", e);
  process.exit(1);
});
