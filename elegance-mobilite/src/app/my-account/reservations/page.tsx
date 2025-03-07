"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ReservationCard } from '@/components/reservations/ReservationCard';
import { CalendarPlus, CircleAlert, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Type pour les données de réservation
interface Reservation {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string;
  vehicle_type: string;
  status: string;
  estimated_price: number;
  distance: number;
  duration: number;
  created_at: string;
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); // Ajouter le router pour la navigation

  // Récupérer les réservations de l'utilisateur
  useEffect(() => {
    if (!user) return;

    const fetchReservations = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('user_id', user.id)
          .order('pickup_time', { ascending: false });
          
        if (error) throw error;
        
        setReservations(data as Reservation[]);
      } catch (err) {
        console.error('Erreur lors de la récupération des réservations:', err);
        setError('Impossible de charger vos réservations. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReservations();
  }, [user]);

  // Fonction pour annuler une réservation
  const handleCancelReservation = async (id: string) => {
    try {
      // Utiliser 'cancelled' au lieu de 'canceled' (différence orthographique)
      const { error } = await supabase
        .from('rides')
        .update({ status: 'cancelled' }) // 'cancelled' au lieu de 'canceled'
        .eq('id', id);
        
      if (error) throw error;
      
      // Mettre à jour l'état local pour refléter l'annulation
      setReservations(prev => 
        prev.map(res => 
          res.id === id ? { ...res, status: 'cancelled' } : res // 'cancelled' ici aussi
        )
      );
      
      toast({
        title: 'Réservation annulée',
        description: 'Votre réservation a été annulée avec succès.',
      });
    } catch (err) {
      console.error('Erreur lors de l\'annulation de la réservation:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'annuler cette réservation. Veuillez réessayer.',
        variant: 'destructive',
      });
    }
  };

  // Ajouter une fonction pour modifier une réservation
  const handleEditReservation = (id: string) => {
    // Stocker l'ID de la réservation à modifier dans le localStorage
    localStorage.setItem('editReservationId', id);
    // Rediriger vers la page de réservation pour la modifier
    router.push('/reservation/edit');
  };

  // Filtrer les réservations par statut
  const getActiveReservations = () => {
    return reservations.filter(res => 
      ['pending', 'confirmed', 'assigned', 'in_progress'].includes(res.status)
    );
  };

  const getPastReservations = () => {
    return reservations.filter(res => 
      ['completed', 'cancelled'].includes(res.status) // 'cancelled' au lieu de 'canceled'
    );
  };

  // Affichages conditionnels
  if (isLoading) {
    return (
      <div className="bg-neutral-900 rounded-xl p-8 shadow-md flex flex-col items-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-400">Chargement de vos réservations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-neutral-900 rounded-xl p-8 shadow-md">
        <div className="flex items-center text-red-400 mb-4">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Réessayer</Button>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-neutral-900 rounded-xl p-8 shadow-md text-center">
        <CircleAlert className="h-16 w-16 mx-auto text-neutral-600 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Aucune réservation</h2>
        <p className="text-neutral-400 mb-6">
          Vous n'avez pas encore effectué de réservation.
        </p>
        <Link href="/reservation">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nouvelle réservation
          </Button>
        </Link>
      </div>
    );
  }

  // Affichage des réservations
  const activeReservations = getActiveReservations();
  const pastReservations = getPastReservations();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mes réservations</h2>
        <Link href="/reservation">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Nouvelle réservation
          </Button>
        </Link>
      </div>

      {/* Réservations actives */}
      {activeReservations.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-4">Réservations à venir</h3>
          <div className="space-y-4">
            {activeReservations.map(reservation => (
              <ReservationCard 
                key={reservation.id}
                reservation={reservation}
                onCancel={() => handleCancelReservation(reservation.id)}
                onEdit={() => handleEditReservation(reservation.id)} // Ajouter le prop onEdit
              />
            ))}
          </div>
        </div>
      )}

      {/* Réservations passées */}
      {pastReservations.length > 0 && (
        <div>
          <h3 className="text-xl font-medium mb-4 mt-8">Réservations passées</h3>
          <div className="space-y-4">
            {pastReservations.map(reservation => (
              <ReservationCard 
                key={reservation.id}
                reservation={reservation}
                isPast
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
