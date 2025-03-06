"use client";

import { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth/useAuth";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const { user, isAuthenticated, isLoading, updateProfile } = useAuth();
  const router = useRouter();
  
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    avatar_url: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Charger les données de l'utilisateur
  useEffect(() => {
    if (user) {
      setFormState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      const success = await updateProfile({
        name: formState.name,
        phone: formState.phone,
        avatar_url: formState.avatar_url,
      });
      
      if (success) {
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été mises à jour avec succès.",
        });
      } else {
        throw new Error("Erreur lors de la mise à jour du profil");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil. Veuillez réessayer plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-black text-white pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black text-white pt-20 pb-12">
        <div className="container max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Paramètres du compte</h1>
          
          <Card className="bg-neutral-900 border-neutral-800 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-20 w-20 border-2 border-neutral-800 bg-neutral-900">
                  {formState.avatar_url ? (
                    <AvatarImage src={formState.avatar_url} />
                  ) : null}
                  <AvatarFallback className="bg-neutral-900 text-2xl text-neutral-200">
                    {formState.name ? getInitials(formState.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* URL de l'avatar */}
              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL de l'avatar</Label>
                <Input
                  id="avatar_url"
                  name="avatar_url"
                  type="url"
                  placeholder="https://exemple.com/avatar.jpg"
                  value={formState.avatar_url}
                  onChange={handleChange}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
                <p className="text-xs text-neutral-400">
                  URL d'une image pour votre avatar (optionnel)
                </p>
              </div>
              
              {/* Nom complet */}
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  placeholder="Jean Dupont"
                  value={formState.name}
                  onChange={handleChange}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              
              {/* Email (non modifiable) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  disabled
                  value={formState.email}
                  className="bg-neutral-800 border-neutral-700 text-white opacity-70"
                />
                <p className="text-xs text-neutral-400">
                  L'adresse email ne peut pas être modifiée
                </p>
              </div>
              
              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={formState.phone}
                  onChange={handleChange}
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              
              {/* Bouton de soumission */}
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  "Enregistrer les modifications"
                )}
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}
