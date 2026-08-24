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

const emailSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
});

type EmailForm = z.infer<typeof emailSchema>;

export default function EmailPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      currentPassword: "",
    },
  });

  const onSubmit = async (data: EmailForm) => {
    try {
      const result = await updateProfile({
        userId: "current",
        email: data.email,
        currentPassword: data.currentPassword,
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
        description: "Un email de confirmation vous a été envoyé",
      });

      router.push("/my-account");
    } catch {
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue lors de la mise à jour de votre email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={ACCOUNT_PAGE}>
      <AccountPageHeader
        title="Adresse email"
        description="Modifier votre email"
        backHref="/my-account"
      />

      <Card className={cn(ACCOUNT_CARD, "p-5 sm:p-6")}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-neutral-300">
                    Nouvelle adresse email
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="nouvelle@email.com"
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

            <div className="flex justify-end pt-1">
              <Button type="submit" className={ACCOUNT_CTA}>
                Mettre à jour l&apos;email
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
