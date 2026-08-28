"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useToast } from "@/hooks/useToast";
import {
  adminPortalRequiredError,
  dispatchLoginSession,
  getLoginUserRole,
  postLoginRequest,
  resolveLoginRedirectPath,
} from "@/lib/auth/login-form-helpers";

interface LoginFormProps {
  onSuccess?: () => void;
}

function loginErrorMessage(
  status: number,
  loginJson: {
    error?: string;
    detail?: unknown;
    supabaseEnv?: { jwtSegmentCount?: number; anonKeyLength?: number };
  },
): string {
  if (status === 503 && typeof loginJson?.error === "string" && loginJson.error.trim()) {
    return loginJson.error;
  }
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

      const result = await postLoginRequest(email, password);
      if (!result.ok) {
        if (result.networkError) {
          setFormError(
            "Impossible de joindre le service d'authentification. Vérifiez votre connexion.",
          );
          return;
        }
        setFormError(loginErrorMessage(result.status, result.json));
        return;
      }

      dispatchLoginSession(result.json.session);

      const userRole = getLoginUserRole(result.json.user);
      const adminError = adminPortalRequiredError(userRole, from);
      if (adminError) {
        setFormError(adminError);
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

      const redirect = resolveLoginRedirectPath({ redirectTo, from, userRole });
      if ("error" in redirect) {
        setFormError(redirect.error);
        return;
      }

      router.push(redirect.path);
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

      <div className="text-right">
        <Link
          href="/auth/forgot-password"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          Mot de passe oublié ?
        </Link>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Connexion en cours..." : "Se connecter"}
      </Button>
    </form>
  );
}
