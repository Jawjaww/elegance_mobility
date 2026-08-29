"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/database/client";
import { useToast } from "@/hooks/useToast";
import {
  exchangeAuthLinkCode,
  verifyAuthLinkToken,
  waitForActiveSession,
  watchAuthSession,
} from "@/lib/auth/auth-link-verification";

type RecoveryState = "loading" | "ready" | "error";

const INVALID_RECOVERY_MESSAGE =
  "Le lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.";

const CODE_VERIFIER_MESSAGE =
  "Le lien PKCE n'a pas pu être validé (code_verifier manquant). Demandez un nouveau lien depuis https://elegance-mobility.vercel.app/auth/forgot-password, puis ouvrez l'email dans ce même navigateur (pas l'aperçu Outlook / Gmail).";

function parseHashTokens(): {
  access_token: string;
  refresh_token: string;
} | null {
  if (typeof window === "undefined" || !window.location.hash.includes("access_token")) {
    return null;
  }
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const access_token = hash.get("access_token");
  const refresh_token = hash.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

type RecoveryOutcome =
  | { status: "session" }
  | { status: "error"; message: string }
  | { status: "continue" };

async function tryHashSession(): Promise<boolean> {
  const hashTokens = parseHashTokens();
  if (!hashTokens) return false;
  const { error } = await supabase.auth.setSession(hashTokens);
  return !error;
}

async function tryTokenOrCode(input: {
  token: string | null;
  code: string | null;
}): Promise<RecoveryOutcome> {
  const { token, code } = input;

  if (token) {
    const result = await verifyAuthLinkToken(
      token,
      "recovery",
      INVALID_RECOVERY_MESSAGE,
    );
    if (result.status === "session") return { status: "session" };
    if (result.status === "error") {
      return { status: "error", message: result.message };
    }
  }

  if (!code) return { status: "continue" };

  const result = await exchangeAuthLinkCode(
    code,
    INVALID_RECOVERY_MESSAGE,
    CODE_VERIFIER_MESSAGE,
  );
  if (result.status === "session") return { status: "session" };
  if (result.status === "error") {
    if (await waitForActiveSession(4, 150)) return { status: "session" };
    return { status: "error", message: result.message };
  }
  return { status: "continue" };
}

async function resolveRecoverySession(input: {
  token: string | null;
  code: string | null;
}): Promise<RecoveryOutcome> {
  if (await tryHashSession()) return { status: "session" };

  // detectSessionInUrl may already have exchanged the code on client init.
  if (await waitForActiveSession(4, 100)) return { status: "session" };

  const fromLink = await tryTokenOrCode(input);
  if (fromLink.status !== "continue") return fromLink;

  if (await waitForActiveSession(2, 100)) return { status: "session" };
  return { status: "continue" };
}

export default function UpdatePasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("loading");
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const fail = (message: string) => {
      if (cancelled) return;
      setRecoveryState("error");
      setError(message);
    };

    const ready = () => {
      if (cancelled) return;
      setRecoveryState("ready");
      setError("");
    };

    const run = async () => {
      const token =
        searchParams?.get("token_hash") ?? searchParams?.get("token") ?? null;
      const code = searchParams?.get("code") ?? null;
      const type = searchParams?.get("type") ?? null;

      const outcome = await resolveRecoverySession({ token, code });
      if (outcome.status === "session") {
        ready();
        return;
      }
      if (outcome.status === "error") {
        fail(outcome.message);
        return;
      }

      unsubscribe = watchAuthSession(ready, true);

      if (!token && !code && type !== "recovery" && !window.location.hash.includes("access_token")) {
        fail(
          "Utilisez le lien reçu par email, ou demandez une réinitialisation ci-dessous.",
        );
      }
    };

    void run();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (recoveryState !== "ready") {
      setError(
        "Session invalide. Cliquez à nouveau sur le lien reçu par email.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(
          updateError.message || "Impossible de mettre à jour le mot de passe.",
        );
        return;
      }

      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été modifié avec succès.",
      });

      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (recoveryState === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nouveau mot de passe</CardTitle>
          <CardDescription>Vérification du lien en cours…</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe sécurisé
        </CardDescription>
      </CardHeader>

      <CardContent>
        {recoveryState === "error" && error ? (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
            <div className="mt-2">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-primary hover:underline"
              >
                Demander un lien de réinitialisation
              </Link>
            </div>
          </div>
        ) : null}

        {recoveryState === "ready" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Au moins 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Répétez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Mise à jour en cours…" : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        ) : null}

        <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="block hover:text-primary">
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
