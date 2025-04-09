'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/types/database.types';

interface EditReservationProps {
  params: { id: string };
}

interface Reservation {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string;
  status: string;
  user_id: string;
}

export default function EditReservationPage({ params }: EditReservationProps) {
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const supabase = createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error('Réservation non trouvée');
        }

        setReservation(data);
      } catch (err) {
        console.error('Erreur lors de la récupération de la réservation:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Une erreur est survenue lors du chargement'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [params.id]);

  const handleCancel = async () => {
    if (!reservation || saving) return;

    try {
      setSaving(true);
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('reservations')
        .update({ status: 'canceled' })
        .eq('id', reservation.id);

      if (error) throw error;

      router.push('/my-account/reservations?status=canceled');
    } catch (err) {
      console.error('Erreur lors de l\'annulation:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Une erreur est survenue lors de l\'annulation'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </Card>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="container mx-auto py-10">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
            <p>{error || 'Réservation non trouvée'}</p>
            <Button onClick={() => router.back()}>Retour</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="p-6">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Modifier la réservation</h1>

          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">Détails de la course</h2>
              <div className="mt-2 space-y-2">
                <p>
                  <span className="text-muted-foreground">Départ:</span>{' '}
                  {reservation.pickup_address}
                </p>
                <p>
                  <span className="text-muted-foreground">Arrivée:</span>{' '}
                  {reservation.dropoff_address}
                </p>
                <p>
                  <span className="text-muted-foreground">Date et heure:</span>{' '}
                  {new Date(reservation.pickup_time).toLocaleString()}
                </p>
                <p>
                  <span className="text-muted-foreground">Statut:</span>{' '}
                  {reservation.status}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Retour
              </Button>
              {reservation.status === 'pending' && (
                <Button 
                  variant="destructive" 
                  onClick={handleCancel}
                  disabled={saving}
                >
                  {saving ? 'Annulation...' : 'Annuler la réservation'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
