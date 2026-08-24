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

const personalInfoSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  phone: z
    .string()
    .min(10, "Le numéro de téléphone doit contenir au moins 10 caractères"),
});

type PersonalInfoForm = z.infer<typeof personalInfoSchema>;

export default function PersonalInfoPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<PersonalInfoForm>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  const onSubmit = async (data: PersonalInfoForm) => {
    try {
      const result = await updateProfile({
        userId: "current",
        phone: data.phone,
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
        description: "Vos informations personnelles ont été mises à jour",
      });

      router.push("/my-account");
    } catch {
      toast({
        title: "Erreur",
        description:
          "Une erreur est survenue lors de la mise à jour de vos informations",
        variant: "destructive",
      });
    }
  };

  return (
    <div className={ACCOUNT_PAGE}>
      <AccountPageHeader
        title="Informations personnelles"
        description="Nom, téléphone"
        backHref="/my-account"
      />

      <Card className={cn(ACCOUNT_CARD, "p-5 sm:p-6")}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-neutral-300">Nom complet</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jean Dupont"
                      className={ACCOUNT_INPUT}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-neutral-300">
                    Numéro de téléphone
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+33 6 12 34 56 78"
                      className={ACCOUNT_INPUT}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-1">
              <Button type="submit" className={ACCOUNT_CTA}>
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
