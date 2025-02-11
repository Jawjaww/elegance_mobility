"use client";

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { columns } from './columns';
import { PricingService, type Rate } from '@/lib/services/pricingService';
import { supabase } from '@/lib/supabaseClient';
import { RateForm } from './RateForm';

export default function RatesAdminPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les tarifs initiaux
  useEffect(() => {
    const loadRates = async () => {
      try {
        await PricingService.initialize();
        const allRates = PricingService.getAllRates();
        setRates(allRates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement des tarifs');
      } finally {
        setLoading(false);
      }
    };

    loadRates();

    // Écouter les changements de tarifs en temps réel
    const channel = supabase
      .channel('rates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rates'
        },
        async () => {
          // Recharger les tarifs quand il y a des changements
          await PricingService.initialize();
          setRates(PricingService.getAllRates());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSave = async (vehicleType: string, changes: Partial<Rate>) => {
    try {
      const { error: dbError } = await supabase
        .from('rates')
        .update({
          price_per_km: changes.pricePerKm,
          base_price: changes.basePrice
        })
        .eq('vehicle_type', vehicleType);

      if (dbError) throw dbError;

      // La mise à jour du PricingService se fera via le canal realtime
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (vehicleType: string) => {
    try {
      const { error: dbError } = await supabase
        .from('rates')
        .delete()
        .eq('vehicle_type', vehicleType);

      if (dbError) throw dbError;

      // La mise à jour du PricingService se fera via le canal realtime
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleAdd = async (newRate: Rate) => {
    try {
      const { error: dbError } = await supabase
        .from('rates')
        .insert({
          vehicle_type: newRate.vehicleType,
          price_per_km: newRate.pricePerKm,
          base_price: newRate.basePrice
        });

      if (dbError) throw dbError;

      // La mise à jour du PricingService se fera via le canal realtime
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="h-8 bg-neutral-800 rounded w-1/3 animate-pulse mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-neutral-800 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-neutral-800 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-100">
          Gestion des Tarifs
        </h1>
        <RateForm onSubmit={handleAdd} mode="create" />
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-lg border border-neutral-800 rounded-lg p-6">
        <DataTable
          columns={columns({ onSave: handleSave, onDelete: handleDelete })}
          data={rates}
        />
      </div>
    </div>
  );
}