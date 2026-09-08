"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2 } from "lucide-react";
import {
  exchangeAuthLinkCode,
  hasActiveSession,
  resolveOtpType,
  verifyAuthLinkToken,
  watchAuthSession,
} from "@/lib/auth/auth-link-verification";
import { resolvePostAuthRedirect } from "@/lib/auth/auth-link-handler";
import { AuthFormShell } from "@/components/landing/AuthFormShell";
import { LANDING_CTA } from "@/components/landing/landingSurface";

type VerifyState = "loading" | "success" | "error" | "pending";

const INVALID_CONFIRM_MESSAGE =
  "Le lien de confirmation est invalide ou a expiré. Demandez un nouvel email.";

async function completeEmailVerification(input: {
  token: string | null;
  code: string | null;
  otpType: ReturnType<typeof resolveOtpType>;
}): Promise<"session" | "error" | "continue"> {
  const { token, code, otpType } = input;

  if (token && otpType) {
    const result = await verifyAuthLinkToken(token, otpType, INVALID_CONFIRM_MESSAGE);
    if (result.status === "session") return "session";
    if (result.status === "error") return "error";
  }

  if (code) {
    const result = await exchangeAuthLinkCode(
      code,
      INVALID_CONFIRM_MESSAGE,
      INVALID_CONFIRM_MESSAGE,
    );
    if (result.status === "session") return "session";
    if (result.status === "error") return "error";
  }

  if (await hasActiveSession()) return "session";
  return "continue";
}

export default function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const finish = (nextState: VerifyState, nextMessage?: string) => {
      if (cancelled) return;
      setState(nextState);
      if (nextMessage) setMessage(nextMessage);
    };

    const run = async () => {
      const typeParam = searchParams?.get("type") ?? null;
      const nextParam = searchParams?.get("next") ?? null;
      const redirectPath = resolvePostAuthRedirect(typeParam, nextParam);
      const token =
        searchParams?.get("token_hash") ?? searchParams?.get("token") ?? null;
      const code = searchParams?.get("code") ?? null;

      if (typeParam === "recovery") {
        const qs = searchParams?.toString() ?? "type=recovery";
        router.replace(`/auth/update-password?${qs}`);
        return;
      }

      const outcome = await completeEmailVerification({
        token,
        code,
        otpType: resolveOtpType(typeParam),
      });

      if (outcome === "session") {
        finish("success");
        router.replace(redirectPath);
        return;
      }
      if (outcome === "error") {
        finish("error", INVALID_CONFIRM_MESSAGE);
        return;
      }

      unsubscribe = watchAuthSession(() => {
        finish("success");
        router.replace(redirectPath);
      });

      if (!token && !code) {
        finish(
          "pending",
          "Ouvrez le lien reçu par email sur cet appareil, ou demandez un nouvel email depuis la page d'inscription.",
        );
      }
    };

    void run();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [router, searchParams]);

  if (state === "loading") {
    return (
      <AuthFormShell
        kicker="Compte"
        title="Vérification de l'email"
        description="Validation du lien en cours…"
      >
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      </AuthFormShell>
    );
  }

  if (state === "success") {
    return (
      <AuthFormShell
        kicker="Compte"
        title="Email confirmé"
        description="Redirection en cours…"
      >
        <div className="flex justify-center py-4">
          <CheckCircle className="h-8 w-8 text-blue-400" />
        </div>
      </AuthFormShell>
    );
  }

  if (state === "error") {
    return (
      <AuthFormShell kicker="Compte" title="Confirmation impossible">
        <div className="space-y-4">
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <Button asChild className={`w-full ${LANDING_CTA}`}>
            <Link href="/auth/signup">Retour à l&apos;inscription</Link>
          </Button>
        </div>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      kicker="Compte"
      title="Confirmez votre email"
      description="Cliquez sur le lien reçu par email pour activer votre compte."
    >
      <div className="space-y-4">
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          asChild
          variant="outline"
          className="w-full border-blue-400/30 text-white hover:bg-blue-500/15"
        >
          <Link href="/auth/login">Aller à la connexion</Link>
        </Button>
      </div>
    </AuthFormShell>
  );
}
