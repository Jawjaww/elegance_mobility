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
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

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
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de votre email",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/my-account">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Modifier l&apos;adresse email</h1>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nouvelle adresse email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="nouvelle@email.com" 
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
                  <FormLabel>Mot de passe actuel</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Entrez votre mot de passe actuel" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit">
                Mettre à jour l&apos;email
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}