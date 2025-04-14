"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/lib/database/client";
import { useToast } from "@/hooks/useToast";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: "login" | "register";
  title?: string;
  description?: string;
  embedded?: boolean;
}

export function AuthModal({ 
  open, 
  onClose, 
  onSuccess, 
  defaultTab = "login",
  title = "Connexion requise",
  description = "Connectez-vous ou créez un compte pour continuer",
  embedded = false
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setError("Votre email n'a pas été confirmé. Veuillez vérifier votre boîte de réception.");
        } else if (error.message.includes('Invalid login credentials')) {
          setError("Email ou mot de passe incorrect.");
        } else {
          setError(error.message || "Erreur de connexion");
        }
        return;
      }

      if (data.session) {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté.",
          variant: "default",
        });
        onSuccess?.();
        !embedded && onClose();
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name || !email || !password) {
      setError("Tous les champs sont obligatoires");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          setError("Cet email est déjà utilisé. Essayez de vous connecter.");
        } else {
          setError(signUpError.message || "Erreur lors de l'inscription");
        }
        return;
      }

      if (data?.user && !data?.session) {
        toast({
          title: "Inscription réussie",
          description: "Un email de confirmation a été envoyé. Veuillez vérifier votre boîte de réception.",
          variant: "default",
        });
        !embedded && onClose();
        return;
      }

      if (data?.session) {
        toast({
          title: "Compte créé avec succès",
          description: "Vous êtes maintenant connecté.",
          variant: "default",
        });
        onSuccess?.();
        !embedded && onClose();
      }
    } catch (error: any) {
      console.error("Erreur lors de l'inscription:", error);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setError("");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    resetForm();
  };

  const Content = (
    <>
      <div className="mb-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700" 
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : "Se connecter"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Mot de passe</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="bg-neutral-800 border-neutral-700"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700" 
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : "Créer un compte"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );

  if (embedded) {
    return Content;
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white border-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>
        {Content}
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
