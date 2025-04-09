"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

export default function AdminLoginForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Gérer les erreurs de redirection
  const error = searchParams?.get("error") || null;
  const errorMessage =
    error === "admin_only"
      ? "Cette section est réservée aux administrateurs."
      : error === "invalid_credentials"
      ? "Email ou mot de passe incorrect."
      : error === "session_expired"
      ? "Votre session a expiré. Veuillez vous reconnecter."
      : error
      ? "Une erreur d'authentification s'est produite."
      : "";
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.preventDefault();
    setIsLoading(true);
    
    // Utiliser l'action serveur adminLogin
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    
    // La redirection sera gérée par l'action serveur si succès
    const response = await fetch('/api/auth/admin', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      toast({
        title: "Erreur de connexion",
        description: data.error || "Vérifiez vos identifiants et réessayez.",
      variant: "destructive",
    });
    // No success toast needed here, redirection handles success case
    // The API route handles redirection on success
  }
  
  setIsLoading(false);
  };
  
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold text-white">Administration</h2>
        <p className="mt-2 text-neutral-400">
          Connectez-vous à l'espace administration
        </p>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-900/50 text-red-300 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleLogin} className="mt-8 space-y-6">
        <div className="space-y-4 rounded-md">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-neutral-200">
              Email administrateur
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 bg-neutral-800 border-neutral-700"
              autoComplete="username"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-neutral-200">
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 bg-neutral-800 border-neutral-700"
              autoComplete="current-password"
              required
            />
          </div>
        </div>
        
        <div>
          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isLoading}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </div>
      </form>
    </div>
  );
}
