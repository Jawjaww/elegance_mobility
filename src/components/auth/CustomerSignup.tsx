"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, User, Lock, ArrowRight, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/database/client";
import { useToast } from "@/hooks/useToast";
import { supabaseAuthErrorMessage, getSupabasePublicConfigError } from "@/lib/utils/supabase-public-config";
import type { SupabaseEnvReport } from "@/lib/utils/supabase-env-check";
import { ButtonLoading } from "@/components/ui/loading";

interface CustomerFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export default function CustomerSignup() {
  const [formData, setFormData] = useState<CustomerFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deployConfigError, setDeployConfigError] = useState<string | null>(null);
  const configError = getSupabasePublicConfigError() ?? deployConfigError;

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    void fetch("/api/health/supabase")
      .then((res) => res.json() as Promise<SupabaseEnvReport>)
      .then((report) => {
        if (!report.ok && report.message) {
          setDeployConfigError(report.message);
        }
      })
      .catch(() => {
        /* ignore — build-time check still applies */
      });
  }, []);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName
    ) {
      toast({
        title: "Erreur",
        description: "Tous les champs sont obligatoires",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            portal_type: "customer",
            full_name: `${formData.firstName} ${formData.lastName}`,
            first_name: formData.firstName,
            last_name: formData.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/verify-email?type=email_confirmation&next=/client-portal/dashboard`,
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Compte existant",
            description: "Un compte existe déjà avec cette adresse email",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data.user) setSuccess(true);
    } catch (error: unknown) {
      toast({
        title: "Erreur",
        description: supabaseAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Votre compte client a été créé avec succès.
          </p>
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Un email de confirmation a été envoyé à{" "}
            <strong>{formData.email}</strong>. Cliquez sur le lien pour activer
            votre compte.
          </AlertDescription>
        </Alert>

        <Button
          variant="outline"
          onClick={() => router.push("/auth/login")}
          className="w-full"
        >
          Aller à la connexion
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {configError ? (
        <Alert variant="destructive">
          <AlertDescription>{configError}</AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Votre prénom"
                className="pl-10"
                disabled={loading}
                autoComplete="given-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Votre nom"
                className="pl-10"
                disabled={loading}
                autoComplete="family-name"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="votre@email.com"
              className="pl-10"
              disabled={loading}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="Votre mot de passe"
              className="pl-10"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              placeholder="Confirmez votre mot de passe"
              className="pl-10"
              disabled={loading}
              autoComplete="new-password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || !!configError}>
          {loading ? (
            <ButtonLoading />
          ) : (
            <span className="flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              Créer mon compte
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      <div className="text-center space-y-2 text-sm text-muted-foreground">
        <p>
          Déjà un compte ?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Se connecter
          </Link>
        </p>
        <p>
          Vous êtes chauffeur ?{" "}
          <Link
            href="/auth/signup/driver"
            className="font-medium text-primary hover:underline"
          >
            Inscription chauffeur
          </Link>
        </p>
      </div>
    </div>
  );
}
