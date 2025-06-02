'use client';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/database/client';

export default function ReservationSuccessPage() {
  const router = useRouter();

  return (
    <div className="container max-w-3xl py-20 px-4 mb-20 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center mb-12 space-y-4">
        <div className="inline-flex items-center justify-center bg-blue-600/20 rounded-full p-6 animate-in zoom-in-50 duration-500">
          <Check className="h-16 w-16 text-blue-500" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-100 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
          Réservation confirmée !
        </h1>
        <p className="text-neutral-400 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          Votre réservation a bien été enregistrée.<br />
          Vous pouvez la retrouver, la modifier ou l'annuler à tout moment dans votre espace client.
        </p>
      </div>
    </div>
  );
}
