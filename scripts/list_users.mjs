import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env.local" });

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function run() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("Error listing users:", error.message || error);
      process.exit(1);
    }
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
}

run();
