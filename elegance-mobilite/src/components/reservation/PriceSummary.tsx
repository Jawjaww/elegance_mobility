"use client";

import { useEffect, useState } from "react";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { LoadingSpinner } from "../ui/loading-spinner";
import { pricingService } from "@/lib/services/pricingService";

export function PriceSummary() {
  const store = useReservationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [priceData, setPriceData] = useState({
    basePrice: 0,
    kmPrice: 0,
    optionsPrice: 0,
    totalPrice: 0,
  });

  useEffect(() => {
    const calculatePrice = async () => {
      setIsLoading(true);

      try {
        // Si données manquantes, utiliser des valeurs par défaut
        const distance = typeof store.distance === 'number' ? store.distance : 0;
        const vehicle = store.selectedVehicle || 'STANDARD';
        const options = Array.isArray(store.selectedOptions) ? store.selectedOptions : [];

        console.log("Calcul du prix avec:", { distance, vehicle, options });

        // Vérifie si le service est disponible
        if (!pricingService || typeof pricingService.calculatePrice !== 'function') {
          console.error("Service de tarification non disponible");
          // Prix par défaut
          setPriceData({
            basePrice: 30,
            kmPrice: distance * 2,
            optionsPrice: options.length * 10,
            totalPrice: 30 + (distance * 2) + (options.length * 10)
          });
          return;
        }

        const rates = pricingService.vehicleRates?.[vehicle] || 
                      { baseFare: 30, perKmRate: 2, minPrice: 35 };
        
        const result = await pricingService.calculatePrice(distance, vehicle, options);
        
        // Calculer séparément les composantes du prix
        const basePrice = rates.baseFare || 0;
        const kmPrice = distance * (rates.perKmRate || 0);
        const optionsPrice = result.optionsPrice || 0;
        const totalPrice = result.totalPrice || (basePrice + kmPrice + optionsPrice);

        setPriceData({
          basePrice: Number(basePrice) || 0,
          kmPrice: Number(kmPrice) || 0,
          optionsPrice: Number(optionsPrice) || 0,
          totalPrice: Number(totalPrice) || 0
        });

        console.log("Prix calculé:", {
          basePrice,
          kmPrice,
          optionsPrice,
          totalPrice
        });
      } catch (error) {
        console.error("Erreur lors du calcul du prix:", error);
        // Prix par défaut en cas d'erreur
        setPriceData({
          basePrice: 30,
          kmPrice: (store.distance || 0) * 2,
          optionsPrice: (store.selectedOptions?.length || 0) * 10,
          totalPrice: 30 + ((store.distance || 0) * 2) + ((store.selectedOptions?.length || 0) * 10)
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculatePrice();
  }, [store.distance, store.selectedVehicle, store.selectedOptions]);

  // Format les prix avec 2 décimales et le symbole €
  const formatPrice = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) return "0.00 €";
    return `${amount.toFixed(2)} €`;
  };

  if (isLoading) {
    return <div className="flex justify-center py-4"><LoadingSpinner size="md" /></div>;
  }

  return (
    <div className="space-y-3 text-white">
      <h3 className="text-lg font-semibold">Détails du prix</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Prix de réservation du véhicule</span>
          <span>{formatPrice(priceData.basePrice)}</span>
        </div>
        <div className="flex justify-between">
          <span>Prix au km ({store.distance?.toFixed(1) || 0} km)</span>
          <span>{formatPrice(priceData.kmPrice)}</span>
        </div>
        {priceData.optionsPrice > 0 && (
          <div className="flex justify-between">
            <span>Options</span>
            <span>{formatPrice(priceData.optionsPrice)}</span>
          </div>
        )}
        <div className="flex justify-between mt-4 pt-2 border-t border-neutral-700 text-xl font-semibold">
          <span>Total</span>
          <span>{formatPrice(priceData.totalPrice)}</span>
        </div>
      </div>
    </div>
  );
}
