"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateProfile } from "@/lib/services/profileService";
import { useToast } from "@/hooks/useToast";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  rideUpdates: z.boolean(),
  promotionalEmails: z.boolean(),
});

type NotificationsForm = z.infer<typeof notificationsSchema>;

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<NotificationsForm>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: true,
      rideUpdates: true,
      promotionalEmails: false,
    },
  });

  const onSubmit = async (data: NotificationsForm) => {
    try {
      const result = await updateProfile({
        userId: "current",
        user_metadata: {
          notification_preferences: data,
        },
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
        description: "Vos préférences de notification ont été mises à jour",
      });

      router.push("/my-account");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de vos préférences",
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
        <h1 className="text-2xl font-bold">Préférences de notification</h1>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Notifications par email</FormLabel>
                    <FormDescription>
                      Recevoir des notifications par email pour vos réservations
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="smsNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Notifications SMS</FormLabel>
                    <FormDescription>
                      Recevoir des notifications SMS pour les mises à jour importantes
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rideUpdates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Mises à jour des courses</FormLabel>
                    <FormDescription>
                      Recevoir des notifications sur le statut de vos courses
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="promotionalEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Emails promotionnels</FormLabel>
                    <FormDescription>
                      Recevoir des offres spéciales et des actualités
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit">
                Enregistrer les préférences
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}