import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

// Proxy server-side pour login : échange email/password → tokens Supabase
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.warn("[api/auth/login] Missing SUPABASE config");
      return res.status(500).json({ error: "Supabase not configured" });
    }

    // Use official client to perform sign-in with password on the server side
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        // disable cookie storage on server
        persistSession: false,
      },
    });

    console.debug("[api/auth/login] signInWithPassword for", email);
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn("[api/auth/login] signInWithPassword error", error);
      return res.status(401).json({
        error: error.message || "Authentication failed",
        detail: error,
      });
    }

    const session = (data as any)?.session;
    if (!session) {
      console.warn(
        "[api/auth/login] no session in signInWithPassword response",
        data,
      );
      return res
        .status(500)
        .json({ error: "Invalid sign-in response", detail: data });
    }

    const user = (data as any)?.user || null;
    const sessionObj = (data as any)?.session || null;

    // Return session to the client so the browser can apply it (client-JWT flow)
    const payload: any = { success: true, user, session: sessionObj };

    return res.status(200).json(payload);
  } catch (err: any) {
    console.error("[api/auth/login] error", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
