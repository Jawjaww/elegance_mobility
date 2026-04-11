#!/usr/bin/env node
/*
  Integration test script for `accept_ride` RPC against local Supabase.

  Usage:
    SUPABASE_URL=http://localhost:54321 SUPABASE_SERVICE_ROLE_KEY=your_service_key node scripts/test-accept-ride.js

  Or set env vars `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` beforehand.
*/

const { createClient } = require("@supabase/supabase-js");

async function main() {
  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  console.log("Looking for a pending ride and an active driver...");

  const { data: rides, error: ridesError } = await supabase
    .from("rides")
    .select("id")
    .eq("status", "pending")
    .limit(1);

  if (ridesError) {
    console.error("Error fetching rides:", ridesError);
    process.exit(1);
  }

  const { data: drivers, error: driversError } = await supabase
    .from("drivers")
    .select("id")
    .eq("is_active", true)
    .limit(1);

  if (driversError) {
    console.error("Error fetching drivers:", driversError);
    process.exit(1);
  }

  if (!rides || rides.length === 0) {
    console.error("No pending rides found in the database");
    process.exit(1);
  }

  if (!drivers || drivers.length === 0) {
    console.error("No active drivers found in the database");
    process.exit(1);
  }

  const rideId = rides[0].id;
  const driverId = drivers[0].id;

  console.log("Attempting RPC accept_ride with", { rideId, driverId });

  const { data, error } = await supabase.rpc("accept_ride", {
    p_ride_id: rideId,
    p_driver_id: driverId,
  });

  if (error) {
    console.error("RPC error:", error);
    process.exit(1);
  }

  console.log("RPC result:", JSON.stringify(data, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
