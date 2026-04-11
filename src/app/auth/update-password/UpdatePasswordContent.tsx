"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/database/client";
import { useToast } from "@/hooks/useToast";

export default function UpdatePasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const checkRecovery = async () => {
      if (!searchParams) return;

      console.log("🔍 Vérification update-password (recovery)");
      console.log("🔍 URL complète:", window.location.href);

      const token = searchParams.get("token");
      const code = searchParams.get("code");
      const type = searchParams.get("type");

      console.log("🔍 Params:", { token: !!token, code: !!code, type });

      if (type !== "recovery") {
        setError(
          "Lien de réinitialisation invalide. Veuillez redemander un lien.",
        );
        return;
      }

      // Prefer token (verifyOtp) when available
      if (token) {
        try {
          console.log("🔍 Tentative verifyOtp avec token...");
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "recovery",
          });

          if (error) {
            console.error("❌ Erreur verifyOtp:", error);
            setError(
              "Le lien de réinitialisation est invalide ou a expiré. Veuillez redemander un lien.",
            );
            return;
          }

          if (data?.session) {
            console.log("✅ Session créée via verifyOtp:", !!data.session);
            setIsValidSession(true);
            return;
          }
        } catch (err) {
          console.error("💥 Erreur lors de la vérification OTP:", err);
          setError(
            "Une erreur est survenue lors de la vérification du lien. Veuillez réessayer.",
          );
          return;
        }
      }

      // Fallback: try code (PKCE) flow but show helpful message when code_verifier is missing
      if (code) {
        try {
          console.log("🔍 Tentative exchangeCodeForSession avec code...");
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            const msg = error?.message || "";
            console.error("❌ Erreur exchangeCodeForSession:", error);
            if (
              msg.includes("code verifier") ||
              msg.includes("code_verifier")
            ) {
              setError(
                "Ce lien doit être ouvert dans le même navigateur que celui utilisé pour demander la réinitialisation. Veuillez redemander un lien si besoin.",
              );
            } else {
              setError(
                "Le lien de réinitialisation est invalide ou a expiré. Veuillez redemander un lien.",
              );
            }
            return;
          }

          if (data?.session) {
            console.log(
              "✅ Session créée via exchangeCodeForSession:",
              !!data.session,
            );
            setIsValidSession(true);
            return;
          }
        } catch (err) {
          console.error("💥 Erreur lors de l'échange du code:", err);
          setError(
            "Une erreur est survenue lors de la vérification du lien. Veuillez réessayer.",
          );
          return;
        }
      }

      console.log("❌ Aucun token/code de réinitialisation valide trouvé");
      setError(
        "Lien de réinitialisation invalide ou expiré. Veuillez redemander un lien de réinitialisation.",
      );
    };

    checkRecovery();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (!isValidSession) {
      setError(
        "Session invalide. Veuillez cliquer à nouveau sur le lien de réinitialisation.",
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log(
        "🔍 Tentative de mise à jour du mot de passe pour la session actuelle...",
      );
      const { data, error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("❌ Erreur updateUser:", error);
        setError(
          error.message || "Impossible de mettre à jour le mot de passe.",
        );
      } else {
        toast({
          title: "Mot de passe mis à jour",
          description: "Votre mot de passe a été modifié avec succès.",
        });

        setTimeout(() => {
          router.push("/auth/login");
        }, 1200);
      }
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau mot de passe</CardTitle>
        <CardDescription>
          Choisissez un nouveau mot de passe sécurisé
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!isValidSession && error && (
          <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
            {error}
            <div className="mt-2">
              <Link
                href="/auth/forgot-password"
                className="font-medium text-primary hover:underline"
              >
                Redemander un lien de réinitialisation
              </Link>
            </div>
          </div>
        )}

        {isValidSession && (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  suppressHydrationWarning
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmer le mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Répétez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  suppressHydrationWarning
                />
              </div>

              <Button
                className="btn-gradient text-white w-full"
                type="submit"
                disabled={isLoading}
              >
                {isLoading
                  ? "Mise à jour en cours..."
                  : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          </>
        )}

        <div className="mt-6 text-center space-y-2">
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground hover:text-primary block"
          >
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
