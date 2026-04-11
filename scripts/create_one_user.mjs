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

const email =
  process.argv[2] || `testuser_${Date.now()}@elegance-mobilite.local`;
const password = process.argv[3] || "password123";
const role = process.argv[4] || "app_customer";
const firstName = process.argv[5] || "Test";
const lastName = process.argv[6] || "User";

async function run() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName },
      raw_app_meta_data: { role },
    });
    if (error) {
      console.error("Error creating user:", error.message || error);
      process.exit(1);
    }
    console.log("Created user:", data);
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
}

run();
