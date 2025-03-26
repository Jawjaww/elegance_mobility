"use client";

import { useState, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/lib/auth/useAuth";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo") || "/";

  // Log à l'initialisation du composant avec les noms corrects des fonctions
  useEffect(() => {
    console.log("[SUPABASE_DEBUG] Hook useAuth complet:", auth);
    console.log("[SUPABASE_DEBUG] Structure useAuth:", {
      signIn: typeof auth.signIn,
      signUp: typeof auth.signUp,
      user: auth.user ? "exists" : "null",
      signOut: typeof auth.signOut,
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
    });

    // Vérifier si le client Supabase est disponible globalement
    if (typeof window !== "undefined") {
      console.log("[SUPABASE_DEBUG] Client Supabase global:", {
        exists: !!(window as any).supabase,
      });

      // Si Supabase existe en global, tester sa fonctionnalité
      if ((window as any).supabase) {
        try {
          (window as any).supabase.auth.getSession().then((result: any) => {
            console.log("[SUPABASE_DEBUG] Test getSession:", {
              success: !!result,
              data: result.data,
              error: result.error,
              hasSession: !!result.data?.session,
            });
          });
        } catch (e) {
          console.error("[SUPABASE_DEBUG] Erreur lors du test Supabase:", e);
        }
      }
    }
  }, [auth]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    console.log("[SUPABASE_DEBUG] Tentative de connexion:", {
      email,
      passwordLength: password.length,
    });
    console.log("[SUPABASE_DEBUG] Fonction signIn:", auth.signIn);

    setError("");
    setLoading(true);

    try {
      console.log("[SUPABASE_DEBUG] Appel de signIn...");
      const success = await auth.signIn(email, password);
      console.log("[SUPABASE_DEBUG] Résultat signIn:", success);
      console.log("[SUPABASE_DEBUG] État auth après signIn:", {
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
      });

      if (success && !success.error) {
        console.log(
          "[SUPABASE_DEBUG] Connexion réussie, redirection vers:",
          redirectTo
        );

        // Forcer un rafraîchissement de l'état d'authentification
        if (auth.getCurrentUser) {
          console.log(
            "[SUPABASE_DEBUG] Tentative de rafraîchissement manuel de l'utilisateur..."
          );
          try {
            await auth.getCurrentUser();
            console.log("[SUPABASE_DEBUG] Utilisateur rafraîchi:", auth.user);
          } catch (refreshError) {
            console.error(
              "[SUPABASE_DEBUG] Erreur lors du rafraîchissement de l'utilisateur:",
              refreshError
            );
          }
        }

        // Attendre un peu pour que le contexte d'authentification se mette à jour
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Vérifier l'état d'authentification avant de rediriger
        console.log("[SUPABASE_DEBUG] État final avant redirection:", {
          user: auth.user,
          isAuthenticated: auth.isAuthenticated,
        });

        if (typeof window !== "undefined") {
          // Forcer un rafraîchissement complet de la page pour s'assurer que tout est synchronisé
          window.location.href = redirectTo;
        } else {
          router.push(redirectTo);
        }
      } else {
        console.error("[SUPABASE_DEBUG] Connexion échouée:", success);
        setError(
          success.error?.message ||
            "Identifiants incorrects. Veuillez réessayer."
        );

        // Essayer une connexion directe avec Supabase si disponible (pour débogage)
        if (typeof window !== "undefined" && (window as any).supabase) {
          try {
            console.log("[SUPABASE_DEBUG] Test connexion directe Supabase");
            const { data, error } = await (
              window as any
            ).supabase.auth.signInWithPassword({
              email,
              password,
            });

            console.log("[SUPABASE_DEBUG] Résultat connexion directe:", {
              success: !!data?.user,
              user: data?.user
                ? {
                    id: data.user.id,
                    email: data.user.email,
                  }
                : null,
              error: error
                ? {
                    message: error.message,
                    code: error.code,
                    status: error.status,
                  }
                : null,
            });
          } catch (directError) {
            console.error(
              "[SUPABASE_DEBUG] Erreur connexion directe:",
              directError
            );
          }
        }
      }
    } catch (error: any) {
      console.error("[SUPABASE_DEBUG] Exception lors de la connexion:", error);
      console.log("[SUPABASE_DEBUG] Détails de l'erreur:", {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        stack: error?.stack?.slice(0, 500), // Limiter la longueur du stack
      });

      setError("Erreur de connexion. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    console.log("[SUPABASE_DEBUG] Tentative d'inscription:", {
      email,
      name,
      passwordLength: password.length,
    });
    console.log("[SUPABASE_DEBUG] Fonction signUp:", auth.signUp);

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
      console.log("[SUPABASE_DEBUG] Appel de signUp...");
      const success = await auth.signUp(email, password, { name });
      console.log("[SUPABASE_DEBUG] Résultat signUp:", success);
      console.log("[SUPABASE_DEBUG] État auth après signUp:", {
        user: auth.user,
        isAuthenticated: auth.isAuthenticated,
        isLoading: auth.isLoading,
      });

      if (success && !success.error) {
        console.log(
          "[SUPABASE_DEBUG] Inscription réussie, redirection vers:",
          redirectTo
        );

        // Forcer un rafraîchissement de l'état d'authentification
        if (auth.getCurrentUser) {
          console.log(
            "[SUPABASE_DEBUG] Tentative de rafraîchissement manuel de l'utilisateur..."
          );
          try {
            await auth.getCurrentUser();
            console.log("[SUPABASE_DEBUG] Utilisateur rafraîchi:", auth.user);
          } catch (refreshError) {
            console.error(
              "[SUPABASE_DEBUG] Erreur lors du rafraîchissement de l'utilisateur:",
              refreshError
            );
          }
        }

        // Attendre un peu pour que le contexte d'authentification se mette à jour
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Vérifier l'état d'authentification avant de rediriger
        console.log("[SUPABASE_DEBUG] État final avant redirection:", {
          user: auth.user,
          isAuthenticated: auth.isAuthenticated,
        });

        if (typeof window !== "undefined") {
          // Forcer un rafraîchissement complet de la page pour s'assurer que tout est synchronisé
          window.location.href = redirectTo;
        } else {
          router.push(redirectTo);
        }
      } else {
        console.error("[SUPABASE_DEBUG] Inscription échouée:", success);
        setError(
          success.error?.message ||
            "Erreur lors de l'inscription. Veuillez réessayer."
        );

        // Essayer une inscription directe avec Supabase si disponible (pour débogage)
        if (typeof window !== "undefined" && (window as any).supabase) {
          try {
            console.log("[SUPABASE_DEBUG] Test inscription directe Supabase");
            const { data, error } = await (window as any).supabase.auth.signUp({
              email,
              password,
              options: {
                data: { name },
              },
            });

            console.log("[SUPABASE_DEBUG] Résultat inscription directe:", {
              success: !!data?.user,
              user: data?.user
                ? {
                    id: data.user.id,
                    email: data.user.email,
                    emailConfirmed: !!data.user.email_confirmed_at,
                  }
                : null,
              error: error
                ? {
                    message: error.message,
                    code: error.code,
                    status: error.status,
                  }
                : null,
              session: data?.session ? "exists" : "null",
            });
          } catch (directError) {
            console.error(
              "[SUPABASE_DEBUG] Erreur inscription directe:",
              directError
            );
          }
        }
      }
    } catch (error: any) {
      console.error("[SUPABASE_DEBUG] Exception lors de l'inscription:", error);
      console.log("[SUPABASE_DEBUG] Détails de l'erreur:", {
        message: error?.message,
        name: error?.name,
        code: error?.code,
        stack: error?.stack?.slice(0, 500), // Limiter la longueur du stack
      });

      setError("Erreur d'inscription. Veuillez réessayer plus tard.");
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-md">
        <Card className="border-neutral-800 bg-neutral-900 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Mon compte
            </CardTitle>
            <CardDescription className="text-neutral-400 text-center">
              Connectez-vous ou créez un compte pour gérer vos réservations
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                resetForm();
              }}
            >
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

                  {error && (
                    <div className="bg-red-900/30 text-red-400 p-3 rounded-md flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}

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
          </CardContent>

          <CardFooter className="flex justify-center">
            <Link
              href="/"
              className="text-neutral-400 text-sm hover:text-neutral-300 transition-colors"
            >
              Retour à l'accueil
            </Link>

            {/* Bouton caché pour forcer une vérification directe Supabase (uniquement en dev) */}
            {process.env.NODE_ENV !== "production" && (
              <button
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    (window as any).supabase
                  ) {
                    console.log(
                      "[SUPABASE_DEBUG] ---- Vérification manuelle ----"
                    );
                    (window as any).supabase.auth
                      .getSession()
                      .then((result: any) => {
                        console.log("[SUPABASE_DEBUG] Session actuelle:", {
                          hasSession: !!result.data?.session,
                          user: result.data?.session?.user
                            ? {
                                id: result.data.session.user.id,
                                email: result.data.session.user.email,
                                role: result.data.session.user.role,
                              }
                            : null,
                          error: result.error,
                        });
                      });
                  }
                }}
                className="invisible"
              />
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
