"use client";

import { Suspense } from "react";
import VerifyEmailContent from "./VerifyEmailContent";
import {
  AuthFormShell,
  AuthLoadingSpinner,
} from "@/components/landing/AuthFormShell";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthFormShell
          kicker="Compte"
          title="Vérification de l'email"
          description="Chargement…"
        >
          <AuthLoadingSpinner />
        </AuthFormShell>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
