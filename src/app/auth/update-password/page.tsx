"use client";

import { Suspense } from "react";
import UpdatePasswordContent from "./UpdatePasswordContent";
import {
  AuthFormShell,
  AuthLoadingSpinner,
} from "@/components/landing/AuthFormShell";

export default function UpdatePasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthFormShell
          kicker="Compte"
          title="Nouveau mot de passe"
          description="Chargement…"
        >
          <AuthLoadingSpinner />
        </AuthFormShell>
      }
    >
      <UpdatePasswordContent />
    </Suspense>
  );
}
