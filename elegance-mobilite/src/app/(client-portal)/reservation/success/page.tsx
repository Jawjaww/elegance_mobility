"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, ChevronRight, Clock, MapPin, Car, CalendarDays, Sparkles } from 'lucide-react';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { useRouter } from 'next/navigation';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ReservationSuccessPage() {
  const router = useRouter();
  const { reset, ...reservation } = useReservationStore();
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  // Nettoyer le store après affichage
  useEffect(() => {
    // On retarde le nettoyage pour s'assurer que les données sont affichées
    const cleanup = setTimeout(() => {
      reset();
    }, 1000);

    return () => clearTimeout(cleanup);
  }, [reset]);
  
  useEffect(() => {
    if (!reservation?.departure) {
      router.push('/reservation');
      return;
    }
    
    if (reservation.pickupDateTime) {
      try {
        setFormattedDate(format(reservation.pickupDateTime, "EEEE d MMMM yyyy", { locale: fr }));
        setFormattedTime(format(reservation.pickupDateTime, "HH'h'mm", { locale: fr }));
      } catch (error) {
        console.error("Erreur lors du formatage de la date:", error);
        setFormattedDate(String(reservation.pickupDateTime));
        setFormattedTime("");
      }
    }
  }, [reservation, router]);

  return (
    <div className="container max-w-3xl py-12 px-4 mb-20">
      <div className="text-center mb-12 space-y-4">
        <div 
          className="inline-flex items-center justify-center bg-green-600/20 rounded-full p-4 animate-in zoom-in-50 duration-500"
        >
          <Sparkles className="h-10 w-10 text-green-500" />
        </div>
        <h1 
          className="text-3xl font-bold text-neutral-100 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150"
        >
          Réservation confirmée !
        </h1>
        <p className="text-neutral-400 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          Votre réservation a été enregistrée avec succès ✨ <br />
          <span className="mt-2 block text-sm">Un email de confirmation vous a été envoyé</span>
        </p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
        <CardHeader className="border-b border-neutral-800 bg-neutral-950/50">
          <h2 className="text-lg font-semibold text-neutral-100">Détails de votre trajet</h2>
        </CardHeader>
        <CardContent className="space-y-6 py-6">
          <div className="space-y-1">
            <p className="text-sm text-neutral-400">Date et heure de prise en charge</p>
            <div className="flex items-start gap-2">
              <CalendarDays className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-neutral-100">{formattedDate} {formattedTime ? ` à ${formattedTime}` : ''}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-neutral-400">Départ</p>
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-neutral-100">{reservation.departure?.display_name}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-neutral-400">Destination</p>
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-neutral-100">{reservation.destination?.display_name}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-neutral-400">Véhicule</p>
            <div className="flex items-start gap-2">
              <Car className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-neutral-100">
                {reservation.selectedVehicle === "STANDARD" ? "Berline Premium" : "Van de Luxe"}
              </p>
            </div>
          </div>

          {reservation.selectedOptions?.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-neutral-800">
              <p className="text-sm text-neutral-400">Options sélectionnées</p>
              <div className="grid gap-2">
                {reservation.selectedOptions.map((option) => (
                  <div key={option} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-500" />
                    <p className="text-neutral-100">
                      {option === "accueil" ? "Accueil personnalisé" : "Boissons fraîches"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(reservation.distance || reservation.duration) && (
            <div className="pt-4 mt-2 border-t border-neutral-800">
              <div className="grid gap-2">
                {reservation.distance && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">Distance estimée</span>
                    <span className="text-neutral-100">{reservation.distance} km</span>
                  </div>
                )}
                {reservation.duration && (
                  <div className="flex justify-between">
                    <span className="text-sm text-neutral-400">Durée estimée</span>
                    <span className="text-neutral-100">{reservation.duration} min</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
        <Link href="/my-account/reservations" className="flex-1">
          <Button variant="outline" className="w-full border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700">
            Voir mes réservations
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/reservation" className="flex-1">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700">
            Nouvelle réservation
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
