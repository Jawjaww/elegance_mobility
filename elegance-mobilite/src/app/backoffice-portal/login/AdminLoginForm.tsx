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
      const loginResp = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginJson = await loginResp.json().catch(() => ({}));
      if (!loginResp.ok) {
        throw new Error(loginJson?.error || 'Authentication failed');
      }

      console.debug('[AdminLogin] /api/auth/login result', loginJson);

      const userRole = (loginJson.user as any)?.app_metadata?.role as AppRole;

      if (!['app_admin', 'app_super_admin'].includes(userRole)) {
        throw new Error('Accès réservé aux administrateurs');
      }

      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      });

      // Redirection vers le dashboard admin (sans refresh pour éviter les boucles)
        // Synchroniser la session côté serveur (cookies HttpOnly)
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
              console.debug('[AdminLogin] /api/auth/session result', resp.status, resp.ok);
              // Dev fallback: if server-side cookie sync failed, write non-HttpOnly cookies
              if (!resp.ok && typeof window !== 'undefined') {
                try {
                  const maxAge = session?.expires_in ?? 3600;
                  document.cookie = `sb-access-token=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
                  document.cookie = `sb-refresh-token=${encodeURIComponent(session.refresh_token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
                  console.debug('[AdminLogin] Wrote fallback cookies (dev)');
                } catch (e) {
                  console.warn('AdminLogin fallback cookie write failed', e);
                }
              }
            } catch (e) {
              console.warn('Failed to sync session to server cookies', e);
            }
          }
        } catch (e) {
          console.warn('Failed to get session after sign in', e);
        }

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
