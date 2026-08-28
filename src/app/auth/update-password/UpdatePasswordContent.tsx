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
  hasActiveSession,
  verifyAuthLinkToken,
  watchAuthSession,
} from "@/lib/auth/auth-link-verification";

type RecoveryState = "loading" | "ready" | "error";

const INVALID_RECOVERY_MESSAGE =
  "Le lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.";
const CODE_VERIFIER_MESSAGE =
  "Ouvrez ce lien dans le même navigateur que celui utilisé pour la demande de réinitialisation.";

async function resolveRecoverySession(input: {
  token: string | null;
  code: string | null;
}): Promise<"session" | "error" | "continue"> {
  const { token, code } = input;

  if (token) {
    const result = await verifyAuthLinkToken(
      token,
      "recovery",
      INVALID_RECOVERY_MESSAGE,
    );
    if (result.status === "session") return "session";
    if (result.status === "error") return "error";
  }

  if (code) {
    const result = await exchangeAuthLinkCode(
      code,
      INVALID_RECOVERY_MESSAGE,
      CODE_VERIFIER_MESSAGE,
    );
    if (result.status === "session") return "session";
    if (result.status === "error") return "error";
  }

  if (await hasActiveSession()) return "session";
  return "continue";
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
        searchParams?.get("token_hash") ?? searchParams?.get("token");
      const code = searchParams?.get("code");
      const type = searchParams?.get("type");

      const outcome = await resolveRecoverySession({ token, code });
      if (outcome === "session") {
        ready();
        return;
      }
      if (outcome === "error") {
        fail(INVALID_RECOVERY_MESSAGE);
        return;
      }

      unsubscribe = watchAuthSession(ready, true);

      if (!token && !code && type !== "recovery") {
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
