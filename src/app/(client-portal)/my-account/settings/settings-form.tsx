"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProfile } from "@/lib/services/profileService";
import { User } from "@supabase/supabase-js";
import {
  ACCOUNT_CARD,
  ACCOUNT_CTA,
  ACCOUNT_INPUT,
} from "@/components/account/accountUi";
import { cn } from "@/lib/utils";

interface SettingsFormProps {
  user: User;
  initialData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

export default function SettingsForm({ user, initialData }: SettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(initialData.first_name);
  const [lastName, setLastName] = useState(initialData.last_name);
  const [email, setEmail] = useState(initialData.email);
  const [phone, setPhone] = useState(initialData.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await updateProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        userId: user.id,
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
        description:
          "Une erreur s'est produite lors de la mise à jour du profil.",
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
      const result = await updateProfile({
        currentPassword,
        newPassword,
        userId: user.id,
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
        description:
          "Une erreur s'est produite lors du changement de mot de passe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className={cn(ACCOUNT_CARD, "border-blue-500/15")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-neutral-100">
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium text-neutral-300"
                >
                  Prénom
                </label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={ACCOUNT_INPUT}
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium text-neutral-300"
                >
                  Nom
                </label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={ACCOUNT_INPUT}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-neutral-300"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={ACCOUNT_INPUT}
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="text-sm font-medium text-neutral-300"
              >
                Téléphone
              </label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={ACCOUNT_INPUT}
              />
            </div>

            <Button type="submit" disabled={isLoading} className={ACCOUNT_CTA}>
              {isLoading
                ? "Enregistrement..."
                : "Enregistrer les modifications"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className={cn(ACCOUNT_CARD, "border-blue-500/15")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-neutral-100">
            Mot de passe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label
                htmlFor="currentPassword"
                className="text-sm font-medium text-neutral-300"
              >
                Mot de passe actuel
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={ACCOUNT_INPUT}
                required
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="text-sm font-medium text-neutral-300"
              >
                Nouveau mot de passe
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={ACCOUNT_INPUT}
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-neutral-300"
              >
                Confirmer le nouveau mot de passe
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={ACCOUNT_INPUT}
                required
              />
            </div>

            <Button
              type="submit"
              variant="outline"
              disabled={isLoading}
              className="border-blue-500/30 text-neutral-100 hover:bg-blue-500/10"
            >
              {isLoading ? "Modification..." : "Modifier le mot de passe"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
