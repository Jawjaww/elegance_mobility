"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Loader2, Mail, XCircle } from "lucide-react";
import {
  exchangeAuthLinkCode,
  hasActiveSession,
  resolveOtpType,
  verifyAuthLinkToken,
  watchAuthSession,
} from "@/lib/auth/auth-link-verification";

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
      const nextPath = searchParams?.get("next") ?? "/auth/login";
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
        router.replace(nextPath);
        return;
      }
      if (outcome === "error") {
        finish("error", INVALID_CONFIRM_MESSAGE);
        return;
      }

      unsubscribe = watchAuthSession(() => {
        finish("success");
        router.replace(nextPath);
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Vérification de l&apos;email</CardTitle>
          <CardDescription>Validation du lien en cours…</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (state === "success") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Email confirmé
          </CardTitle>
          <CardDescription>Redirection en cours…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Confirmation impossible
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <Button asChild className="w-full">
            <Link href="/auth/signup">Retour à l&apos;inscription</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Confirmez votre email
        </CardTitle>
        <CardDescription>
          Cliquez sur le lien reçu par email pour activer votre compte.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/login">Aller à la connexion</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
