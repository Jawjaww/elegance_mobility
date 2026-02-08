"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/database/client";
import { getAppRole } from "@/lib/types/common.types";
import { useToast } from "@/hooks/useToast";
import { type AppRole } from "@/lib/types/common.types";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const from = searchParams?.get("from");
  const redirectTo = searchParams?.get("redirectTo");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          throw new Error(
            "Votre email n'a pas été confirmé. Veuillez vérifier votre boîte de réception.",
          );
        }
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email ou mot de passe incorrect.");
        }
        throw error;
      }

      // Récupérer l'utilisateur frais pour obtenir app_metadata complet
      const {
        data: { user: freshUser },
      } = await supabase.auth.getUser();

      // Vérification typée du rôle (via helper centralisé)
      const userRole = getAppRole(freshUser as any) as AppRole;

      // Seuls les admins et super admins ne peuvent pas se connecter sur la page login normale
      // Ils doivent utiliser la page login admin
      if (
        (userRole === "app_admin" || userRole === "app_super_admin") &&
        from !== "admin"
      ) {
        await supabase.auth.signOut();
        throw new Error(
          "Veuillez utiliser la page de connexion administrateur",
        );
      }

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      });

      // Si onSuccess est fourni, l'appeler (pour les modals inline)
      if (onSuccess) {
        onSuccess();
        return;
      }

      // Redirection basée sur le rôle ou redirectTo
      let redirectPath = redirectTo || "/my-account";

      // Si pas de redirectTo spécifique, utiliser le rôle
      if (!redirectTo && from) {
        // Vérifier que la redirection est autorisée pour le rôle
        if (
          (from === "driver" && userRole !== "app_driver") ||
          (from === "admin" &&
            !["app_admin", "app_super_admin"].includes(userRole))
        ) {
          throw new Error("Accès non autorisé pour ce portail");
        }
        redirectPath =
          from === "driver"
            ? "/driver-portal/dashboard"
            : from === "admin"
              ? "/backoffice-portal"
              : "/my-account";
      }

      await router.push(redirectPath);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error?.message || "Une erreur est survenue",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="exemple@email.com"
          required
          autoComplete="email"
          disabled={isLoading}
          suppressHydrationWarning
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <div className="flex items-center">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            disabled={isLoading}
            suppressHydrationWarning
          />
          <button
            type="button"
            aria-label={
              showPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            onClick={() => setShowPassword((s) => !s)}
            className="ml-2 text-neutral-300 hover:text-white"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Connexion en cours..." : "Se connecter"}
      </Button>
    </form>
  );
}
