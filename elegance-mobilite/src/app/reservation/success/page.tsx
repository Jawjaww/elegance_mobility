"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Check, ChevronRight, CalendarIcon, MapPin, Car } from 'lucide-react';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { useRouter } from 'next/navigation';

export default function ReservationSuccessPage() {
  const router = useRouter();
  const reservation = useReservationStore();
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");
  
  useEffect(() => {
    if (!reservation?.departure) {
      // Rediriger vers la page de réservation si les données ne sont pas disponibles
      router.push('/reservation');
    }
    
    if (reservation.pickupDateTime) {
      try {
        // Formater la date en français pour une meilleure lisibilité
        const pickupDate = new Date(reservation.pickupDateTime);
        
        setFormattedDate(
          pickupDate.toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        );
        
        setFormattedTime(
          pickupDate.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        );
      } catch (error) {
        console.error("Erreur lors du formatage de la date:", error);
        // Fallback au format ISO en cas d'erreur
        setFormattedDate(String(reservation.pickupDateTime));
        setFormattedTime("");
      }
    }
  }, [reservation, router]);

  return (
    <div className="container max-w-3xl py-12 px-4">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center bg-green-600/20 rounded-full p-4 mb-4">
          <Check className="h-10 w-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-100 mb-2">Réservation confirmée !</h1>
        <p className="text-neutral-400 max-w-lg mx-auto">
          Votre réservation a été enregistrée avec succès. Vous recevrez un email de confirmation dans quelques instants.
        </p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800 mb-8">
        <CardHeader className="border-b border-neutral-800 bg-neutral-950/50">
          <h2 className="text-lg font-semibold text-neutral-100">Détails de votre trajet</h2>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
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
            <p className="text-sm text-neutral-400">Date & heure</p>
            <div className="flex items-start gap-2">
              <CalendarIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-neutral-100">{formattedDate}{formattedTime ? ` à ${formattedTime}` : ''}</p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-neutral-400">Véhicule</p>
            <div className="flex items-start gap-2">
              <Car className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-neutral-100 capitalize">{reservation.selectedVehicle.toLowerCase()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
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
