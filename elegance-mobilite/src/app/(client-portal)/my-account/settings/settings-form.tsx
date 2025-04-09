"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthUser } from "@/lib/types/auth.types";
import { updateProfile } from "@/lib/services/profileService";

interface SettingsFormProps {
  user: AuthUser;
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.user_metadata?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await updateProfile({
        name,
        email,
        phone,
        userId: user.id
      });
      
      if (result?.error) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profil mis à jour",
          description: "Vos informations ont été mises à jour avec succès.",
        });
        router.refresh();
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour:", err);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour du profil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les nouveaux mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Utiliser le service pour changer le mot de passe
      const result = await updateProfile({
        currentPassword,
        newPassword,
        userId: user.id
      });
      
      if (result?.error) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Mot de passe mis à jour",
          description: "Votre mot de passe a été modifié avec succès.",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      console.error("Erreur lors du changement de mot de passe:", err);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors du changement de mot de passe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-neutral-200">
                  Nom complet
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 bg-neutral-800 border-neutral-700"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="text-sm font-medium text-neutral-200">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-neutral-800 border-neutral-700"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-neutral-200">
                  Téléphone
                </label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 bg-neutral-800 border-neutral-700"
                />
              </div>
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader>
          <CardTitle>Changer de mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="text-sm font-medium text-neutral-200">
                  Mot de passe actuel
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 bg-neutral-800 border-neutral-700"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="text-sm font-medium text-neutral-200">
                  Nouveau mot de passe
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 bg-neutral-800 border-neutral-700"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-200">
                  Confirmer le nouveau mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 bg-neutral-800 border-neutral-700"
                  required
                />
              </div>
            </div>
            
            <Button type="submit" variant="outline" disabled={isLoading}>
              {isLoading ? "Modification..." : "Modifier le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}