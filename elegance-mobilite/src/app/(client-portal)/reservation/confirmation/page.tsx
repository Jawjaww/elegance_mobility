'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/types/database.types';

interface ConfirmationPageProps {
  params: { [key: string]: string };
}

export default function ConfirmationPage({ params }: ConfirmationPageProps) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!searchParams) {
      setStatus('error');
      setMessage('Paramètres de recherche invalides');
      return;
    }

    const confirmReservation = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Token de confirmation manquant');
        return;
      }

      try {
        const supabase = createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { error } = await supabase
          .from('reservations')
          .update({ status: 'confirmed' })
          .eq('confirmation_token', token);

        if (error) throw error;

        setStatus('success');
        setMessage('Votre réservation est confirmée !');
      } catch (error) {
        console.error('Erreur lors de la confirmation:', error);
        setStatus('error');
        setMessage('Une erreur est survenue lors de la confirmation');
      }
    };

    confirmReservation();
  }, [searchParams]);

  return (
    <div className="container mx-auto py-10">
      <Card className="p-6 max-w-lg mx-auto">
        <div className="text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p>Confirmation de votre réservation en cours...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="text-2xl font-bold text-green-600">
                Réservation Confirmée
              </h1>
              <p>{message}</p>
              <Button asChild>
                <a href="/my-account/reservations">
                  Voir mes réservations
                </a>
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="text-2xl font-bold text-red-600">
                Erreur
              </h1>
              <p>{message}</p>
              <Button asChild variant="outline">
                <a href="/contact">
                  Contacter le support
                </a>
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
