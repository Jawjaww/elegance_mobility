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

const userId = process.argv[2];
const newPassword = process.argv[3] || "password123";

if (!userId) {
  console.error(
    "Usage: node scripts/reset_password.mjs <user-id> [newPassword]",
  );
  process.exit(1);
}

async function run() {
  try {
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
      email_confirm: true,
    });
    if (error) {
      console.error("Error updating user:", error.message || error);
      process.exit(1);
    }
    console.log("Updated user:", data.id);
  } catch (e) {
    console.error("Exception:", e.message || e);
    process.exit(1);
  }
}

run();
