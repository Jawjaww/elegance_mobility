"use client";

import { useEffect, useRef } from "react";
import { runAuthLinkHandler } from "@/lib/auth/auth-link-handler";

/** Global handler for Supabase magic links landing on Site URL (e.g. "/"). */
export function AuthLinkHandler() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void runAuthLinkHandler();
  }, []);

  return null;
}
