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
import { useAuth } from "@/lib/auth/useAuth";
import { LoadingSpinner } from "../ui/loading-spinner";
import { supabase } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ 
  open, 
  onClose, 
  onSuccess, 
  defaultTab = "login" 
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const { login, register } = useAuth();

  // Réinitialiser les erreurs quand le modal s'ouvre/se ferme
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
      // Vérifier si l'email a été confirmé
      const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({
        filters: {
          email: email
        }
      });

      // Si l'email existe mais n'est pas confirmé, afficher un message spécifique
      if (!userError && users && users.length > 0 && !users[0].email_confirmed_at) {
        setError("Email non confirmé. Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.");
        setLoading(false);
        return;
      }

      // Tentative de connexion
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Gérer les erreurs spécifiques avec des messages plus clairs
        if (error.message.includes('Email not confirmed')) {
          setError("Votre email n'a pas été confirmé. Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.");
        } else if (error.message.includes('Invalid login credentials')) {
          setError("Email ou mot de passe incorrect.");
        } else if (error.message.includes('Invalid email')) {
          setError("Format d'email invalide.");
        } else {
          console.error("Erreur de connexion détaillée:", error);
          setError(error.message || "Erreur de connexion");
        }
        return;
      }

      // Mettre à jour le stockage local pour gérer la redirection
      if (window.location.pathname.includes('reservation/confirmation')) {
        localStorage.setItem('authRedirectTo', window.location.pathname);
      }

      // En cas de réussite
      setError("");
      onSuccess?.();
    } catch (error) {
      console.error("Erreur inattendue:", error);
      setError("Une erreur système est survenue. Veuillez réessayer plus tard.");
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
      // Utiliser l'API directe de Supabase pour l'inscription
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/auth/callback`, // URL de redirection après confirmation d'email
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

      // Si l'inscription est réussie mais l'utilisateur doit confirmer son email
      if (data?.user && !data?.session) {
        // Afficher un message plus utile avec des instructions détaillées
        alert("Un email de confirmation a été envoyé à " + email + ". Veuillez vérifier votre boîte de réception ainsi que vos dossiers spam/indésirables. Vous devez valider votre email avant de pouvoir vous connecter.");
        onClose();
        return;
      }

      // Une fois l'utilisateur créé, insérer dans la table users
      if (data?.user) {
        try {
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              { 
                id: data.user.id,
                role: 'client',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]);
          
          if (insertError) {
            console.error("Erreur lors de l'insertion utilisateur:", insertError);
            // Continuer malgré l'erreur car l'utilisateur est créé
          }
        } catch (dbError) {
          console.error("Exception lors de l'insertion:", dbError);
        }

        setError("");
        onSuccess?.();
      } else {
        setError("Erreur lors de la création du compte. Veuillez réessayer.");
      }
    } catch (error: any) {
      console.error("Exception non gérée:", error);
      setError("Une erreur inattendue s'est produite. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour renvoyer l'email de vérification - améliorer avec retour visuel
  const handleResendVerification = async () => {
    if (!email) {
      setError("Veuillez saisir votre adresse email");
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Email envoyé avec succès",
        description: "Veuillez vérifier votre boîte de réception et cliquer sur le lien de confirmation.",
        duration: 5000,
      });

      // Afficher un message directement dans le formulaire aussi
      setError("Email de vérification envoyé! Vérifiez votre boîte mail (et les spams)");
    } catch (error: any) {
      console.error("Erreur lors du renvoi de l'email:", error);
      setError(error.message || "Impossible de renvoyer l'email de vérification.");
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

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white border-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Connexion requise</DialogTitle>
          <DialogDescription className="text-gray-400">
            Connectez-vous ou créez un compte pour finaliser votre réservation
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
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
              
              {error && error.includes("vérifier votre email") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleResendVerification}
                  disabled={loading}
                >
                  Renvoyer l'email de vérification
                </Button>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out rounded-md" 
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
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : "Créer un compte"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
