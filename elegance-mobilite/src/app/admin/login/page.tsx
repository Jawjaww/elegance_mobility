"use client";

import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Shield, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo") || "/admin";

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Vérifier que l'utilisateur est un administrateur
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || !profile || profile.role !== 'admin') {
          // Si l'utilisateur n'a pas le rôle admin, déconnecter et montrer une erreur
          await supabase.auth.signOut();
          setError("Accès non autorisé. Ce compte n'a pas les droits administrateur.");
          setLoading(false);
          return;
        }
      }

      // Rediriger vers le backoffice
      router.push(redirectTo);
    } catch (error: any) {
      setError(error.message || "Une erreur est survenue lors de la connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600/20 p-3 rounded-full">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <Card className="border-neutral-800 bg-neutral-900 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Administration
            </CardTitle>
            <CardDescription className="text-neutral-400 text-center">
              Connectez-vous pour accéder au backoffice
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              
              {error && (
                <div className="bg-red-900/30 text-red-400 p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out rounded-md" 
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : "Se connecter"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Link 
              href="/" 
              className="text-neutral-400 text-sm hover:text-neutral-300 transition-colors"
            >
              Retour au site
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
