"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateProfile } from "@/lib/services/profileService";
import { useToast } from "@/hooks/useToast";
import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import {
  ACCOUNT_CARD,
  ACCOUNT_CTA,
  ACCOUNT_INPUT,
  ACCOUNT_PAGE,
} from "@/components/account/accountUi";
import { cn } from "@/lib/utils";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule et un chiffre",
      ),
    confirmPassword: z
      .string()
      .min(1, "La confirmation du mot de passe est requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export default function PasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: PasswordForm) => {
    try {
      const result = await updateProfile({
        userId: "current",
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (result.error) {
        toast({
          title: "Erreur",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Succès",
        description: "Votre mot de passe a été mis à jour",
      });

      router.push("/my-account");
    } catch {
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue lors de la mise à jour de votre mot de passe",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={ACCOUNT_PAGE}>
      <AccountPageHeader
        title="Mot de passe"
        description="Changer votre mot de passe"
        backHref="/my-account"
      />

      <Card className={cn(ACCOUNT_CARD, "p-5 sm:p-6")}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-300">
                    Mot de passe actuel
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Entrez votre mot de passe actuel"
                      className={ACCOUNT_INPUT}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-300">
                    Nouveau mot de passe
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Entrez votre nouveau mot de passe"
                      className={ACCOUNT_INPUT}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-300">
                    Confirmer le nouveau mot de passe
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirmez votre nouveau mot de passe"
                      className={ACCOUNT_INPUT}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-1">
              <Button type="submit" className={ACCOUNT_CTA}>
                Mettre à jour le mot de passe
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
