"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUserRole as getAppRole } from "@/lib/utils/auth-helpers";
import { useToast } from "@/hooks/useToast";
import { type AppRole } from "@/lib/utils/roles";

interface LoginFormProps {
  onSuccess?: () => void;
}

function loginErrorMessage(
  status: number,
  loginJson: { error?: string; detail?: unknown },
): string {
  const detail = loginJson?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail && typeof detail === "object") {
    const d = detail as { msg?: string; message?: string };
    if (d.msg) return d.msg;
    if (d.message) return d.message;
  }
  if (typeof loginJson?.error === "string" && loginJson.error.trim()) {
    return loginJson.error;
  }
  if (status === 401) {
    return "Email ou mot de passe incorrect.";
  }
  if (status === 429) {
    return "Trop de tentatives. Réessayez dans quelques minutes.";
  }
  return "La connexion a échoué. Réessayez plus tard.";
}

export function LoginForm({ onSuccess }: Readonly<LoginFormProps> = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const from = searchParams?.get("from");
  const redirectTo = searchParams?.get("redirectTo");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      let loginResp: Response | null = null;
      let loginJson: { error?: string; detail?: unknown; session?: unknown; user?: unknown } =
        {};
      try {
        loginResp = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
      } catch {
        setFormError(
          "Impossible de joindre le service d'authentification. Vérifiez votre connexion.",
        );
        return;
      }

      try {
        loginJson = await loginResp.json();
      } catch {
        loginJson = {};
      }

      if (!loginResp.ok) {
        setFormError(loginErrorMessage(loginResp.status, loginJson));
        return;
      }

      // Dispatch session to ClientProviders which centralise l'appel à setSession
      const session = loginJson.session as
        | { access_token?: string; refresh_token?: string }
        | undefined;
      if (session?.access_token && session?.refresh_token) {
        try {
          window.dispatchEvent(
            new CustomEvent("elegance:setSession", {
              detail: session,
            }),
          );
        } catch {
          /* ignore dispatch errors */
        }
      }

      const freshUser = loginJson.user || null;
      const userRole = getAppRole(freshUser as Parameters<typeof getAppRole>[0]) as AppRole;

      // Seuls les admins et super admins ne peuvent pas se connecter sur la page login normale
      if (
        (userRole === "app_admin" || userRole === "app_super_admin") &&
        from !== "admin"
      ) {
        setFormError(
          "Veuillez utiliser la page de connexion administrateur.",
        );
        return;
      }

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      });

      if (onSuccess) {
        onSuccess();
        return;
      }

      let redirectPath = redirectTo || "/my-account";

      if (!redirectTo && from) {
        const isDriverDenied = from === "driver" && userRole !== "app_driver";
        const isAdminDenied =
          from === "admin" &&
          !["app_admin", "app_super_admin"].includes(userRole);
        if (isDriverDenied || isAdminDenied) {
          setFormError("Accès non autorisé pour ce portail.");
          return;
        }
        if (from === "driver") redirectPath = "/driver-portal/dashboard";
        else if (from === "admin") redirectPath = "/backoffice-portal";
        else redirectPath = "/my-account";
      }

      router.push(redirectPath);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Une erreur est survenue";
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
          aria-invalid={Boolean(formError)}
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
            aria-invalid={Boolean(formError)}
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

      {formError && (
        <p
          role="alert"
          className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300"
        >
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Connexion en cours..." : "Se connecter"}
      </Button>
    </form>
  );
}
