import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  inspectSupabasePublicEnv,
  normalizeAnonKey,
} from "@/lib/utils/supabase-env-check";

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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
    const anonKey = normalizeAnonKey(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    );
    const envReport = inspectSupabasePublicEnv(supabaseUrl, anonKey);

    if (!envReport.ok) {
      console.warn("[api/auth/login] Invalid Supabase env", envReport);
      return res.status(503).json({
        error:
          envReport.message ??
          "Configuration Supabase invalide sur ce déploiement.",
        supabaseEnv: {
          urlHost: envReport.urlHost,
          keyProjectRef: envReport.keyProjectRef,
          refsMatch: envReport.refsMatch,
          jwtSegmentCount: envReport.jwtSegmentCount,
          anonKeyLength: envReport.anonKeyLength,
        },
      });
    }

    // Password sign-in uses the anon key (service role is not required here).
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
      },
    });

    console.debug("[api/auth/login] signInWithPassword for", email);
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn("[api/auth/login] signInWithPassword error", error);
      const invalidApiKey =
        /invalid api key|invalid jwt/i.test(error.message ?? "") ||
        error.status === 401;
      return res.status(invalidApiKey ? 503 : 401).json({
        error: invalidApiKey
          ? (envReport.message ??
            "Clé Supabase invalide sur ce déploiement (Vercel).")
          : error.message || "Authentication failed",
        detail: {
          message: error.message,
          status: error.status,
          name: error.name,
        },
        supabaseEnv: invalidApiKey
          ? {
              urlHost: envReport.urlHost,
              keyProjectRef: envReport.keyProjectRef,
              jwtSegmentCount: envReport.jwtSegmentCount,
              anonKeyLength: envReport.anonKeyLength,
            }
          : undefined,
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
