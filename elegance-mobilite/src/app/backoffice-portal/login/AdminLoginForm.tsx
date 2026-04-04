"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/database/client";
import { useToast } from "@/hooks/useToast";
import { type AppRole } from "@/lib/types/common.types";

export function AdminLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      // Use server-side login proxy to avoid CORS and set HttpOnly cookies
      let loginResp: Response | null = null;
      let loginJson: any = {};
      try {
        loginResp = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } catch (networkErr: any) {
        console.error(
          "[AdminLogin] Network error calling /api/auth/login",
          networkErr,
        );
        toast({
          variant: "destructive",
          title: "Erreur réseau",
          description:
            "Impossible de joindre le service d'authentification. Veuillez réessayer.",
        });
        setIsLoading(false);
        return;
      }

      try {
        loginJson = await loginResp.json();
      } catch (e) {
        loginJson = {};
      }

      if (!loginResp.ok) {
        console.error(
          "[AdminLogin] /api/auth/login returned error",
          loginResp.status,
          loginJson,
        );
        const detailMsg = (() => {
          const d = loginJson?.detail;
          if (!d) return undefined;
          if (typeof d === "string") return d;
          if (d?.msg) return d.msg;
          if (d?.message) return d.message;
          try {
            return JSON.stringify(d);
          } catch (e) {
            return String(d);
          }
        })();
        toast({
          variant: "destructive",
          title: loginJson?.error || "Échec d'authentification",
          description:
            detailMsg || "Vérifiez vos identifiants ou réessayez plus tard.",
        });
        setIsLoading(false);
        return;
      }

      console.debug("[AdminLogin] /api/auth/login result", loginJson);

      // Dispatch an event with the session so ClientProviders (centralisé)
      // applique la session côté client. ClientProviders est le seul endroit
      // qui appelle supabase.auth.setSession.
      if (
        loginJson?.session?.access_token &&
        loginJson?.session?.refresh_token
      ) {
        try {
          window.dispatchEvent(
            new CustomEvent("elegance:setSession", {
              detail: loginJson.session,
            }),
          );
          console.debug("[AdminLogin] Dispatched elegance:setSession event");
        } catch (e) {
          console.warn("[AdminLogin] Failed to dispatch setSession event", e);
        }
      }

      const userRole = (loginJson.user as any)?.app_metadata?.role as AppRole;

      if (!["app_admin", "app_super_admin"].includes(userRole)) {
        throw new Error("Accès réservé aux administrateurs");
      }

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      });

      // Redirection vers le dashboard admin
      router.push("/backoffice-portal/dashboard");
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
          placeholder="admin@exemple.com"
          required
          autoComplete="email"
          disabled={isLoading}
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
