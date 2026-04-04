"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/database/client";
import { useToast } from "@/hooks/useToast";
import { type AppRole } from "@/lib/types/common.types";

export function DriverLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = ((formData.get("email") as string) || "").trim();
      const password = ((formData.get("password") as string) || "").trim();

      // Use server-side login proxy to avoid CORS and set HttpOnly cookies
      const loginResp = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginJson = await loginResp.json().catch(() => ({}));
      if (!loginResp.ok) {
        console.error('DriverLoginForm: /api/auth/login error', loginJson);
        throw new Error(loginJson?.error || 'Authentication failed');
      }

      console.debug('[DriverLogin] /api/auth/login result', loginJson);

      const userRole = (loginJson.user as any)?.app_metadata?.role || (loginJson.user as any)?.raw_app_meta_data?.role;

      if (userRole !== 'app_driver') {
        throw new Error('Accès réservé aux chauffeurs partenaires');
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans votre espace chauffeur",
      });

      // Attendre que Supabase ait établi la session, puis récupérer la session
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = (sessionData as any)?.session;
        if (session?.access_token && session?.refresh_token) {
          try {
            const resp = await fetch('/api/auth/session', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_in: session.expires_in,
              }),
            });
            console.debug('[DriverLogin] /api/auth/session result', resp.status, resp.ok);
            if (!resp.ok && typeof window !== 'undefined') {
              try {
                const maxAge = session?.expires_in ?? 3600;
                document.cookie = `sb-access-token=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
                document.cookie = `sb-refresh-token=${encodeURIComponent(session.refresh_token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
                console.debug('[DriverLogin] Wrote fallback cookies (dev)');
              } catch (e) {
                console.warn('DriverLogin fallback cookie write failed', e);
              }
            }
          } catch (e) {
            console.warn('Failed to sync session to server cookies', e);
          }
        }
      } catch (e) {
        console.warn('Failed to get session after sign in', e);
      }

      // Redirection complète vers le portail chauffeur
      window.location.href = "/driver-portal/dashboard";
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
          placeholder="chauffeur@exemple.com"
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
