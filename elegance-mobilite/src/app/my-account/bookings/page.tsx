"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { bookingService } from "@/lib/services/bookingService";
import { Header } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Car, MapPin, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils/dateUtils";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface Booking {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string;
  vehicle_type: string;
  distance: number;
  status: "pending" | "confirmed" | "completed" | "canceled";
  price: number;
  created_at: string;
}

export default function BookingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const router = useRouter();

  // Redirection si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Charger les réservations au chargement
  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      
      setIsLoadingBookings(true);
      try {
        const { data, error } = await bookingService.getUserBookings(user.id);
        
        if (data) {
          setBookings(data);
        } else if (error) {
          toast({
            title: "Erreur",
            description: "Impossible de charger vos réservations: " + error,
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Erreur lors du chargement des réservations:", err);
        toast({
          title: "Erreur",
          description: "Un problème est survenu lors du chargement des réservations",
          variant: "destructive",
        });
      } finally {
        setIsLoadingBookings(false);
      }
    };
    
    if (user) {
      loadBookings();
    } else {
      setIsLoadingBookings(false);
    }
  }, [user, toast]);

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
      try {
        const { success, error } = await bookingService.cancelBooking(bookingId);
        
        if (success) {
          toast({
            title: "Réservation annulée",
            description: "Votre réservation a été annulée avec succès.",
          });
          
          // Mettre à jour la liste des réservations
          setBookings(bookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: "canceled" } 
              : booking
          ));
        } else {
          toast({
            title: "Erreur",
            description: "Impossible d'annuler la réservation: " + error,
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Erreur lors de l'annulation:", err);
        toast({
          title: "Erreur",
          description: "Un problème est survenu lors de l'annulation",
          variant: "destructive",
        });
      }
    }
  };

  // Fonction pour afficher un badge selon le statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">En attente</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Confirmée</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Terminée</Badge>;
      case "canceled":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Annulée</Badge>;
      default:
        return <Badge variant="outline">Inconnue</Badge>;
    }
  };

  // Rendu du composant
  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-black text-white pt-20 pb-12">
        <div className="container max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Mes réservations</h1>
          
          {isLoadingBookings ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center">
              <p className="text-neutral-400">Vous n'avez pas encore de réservations.</p>
              <Button 
                className="mt-4 bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/reservation")}
              >
                Réserver un trajet
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div 
                  key={booking.id} 
                  className="bg-neutral-900 border border-neutral-800 rounded-lg p-6"
                >
                  <div className="flex flex-col md:flex-row justify-between mb-4">
                    <div className="flex items-center gap-3 mb-2 md:mb-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-neutral-300">
                          {formatDate(new Date(booking.pickup_time))}
                        </span>
                      </div>
                      
                      <div>
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                    
                    <p className="text-lg font-bold">
                      {booking.price.toFixed(2)} €
                    </p>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-green-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-neutral-400">Départ</p>
                            <p className="text-neutral-200">{booking.pickup_address}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-neutral-400">Destination</p>
                            <p className="text-neutral-200">{booking.dropoff_address}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 md:items-center">
                      <div className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-blue-400" />
                        <span>{booking.vehicle_type === 'STANDARD' ? 'Berline Standard' : 
                               booking.vehicle_type === 'PREMIUM' ? 'Berline Premium' :
                               booking.vehicle_type === 'VAN' ? 'Van de Luxe' : booking.vehicle_type}</span>
                      </div>
                      
                      {booking.status === "pending" && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="mt-4 md:mt-0"
                          onClick={() => handleCancelBooking(booking.id)}
                        >
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}