"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils/date-format";
import { formatCurrency } from "@/lib/utils";
import { Car, MapPin, Calendar, Clock3, Route } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface Reservation {
  id: string;
  pickup_time: string;
  pickup_address: string;
  dropoff_address: string;
  vehicle_type?: string;
  status: string;
  estimated_price?: number | null;
  distance?: number | null;
  duration?: number | null;
  created_at: string;
}

interface DetailModalProps {
  ride: Reservation | null;
  open: boolean;
  onClose: () => void;
}

export default function DetailModal({ ride, open, onClose }: DetailModalProps) {
  if (!ride) return null;
  
  // Format la date et l'heure
  const formattedDateTime = formatDateTime(ride.pickup_time);
  
  // Fonction pour capitaliser la première lettre
  const capitalize = (str: string | undefined) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 sm:max-w-md">
        <DialogHeader className="relative">
          {/* Déplacer le badge en haut à gauche au-dessus du titre */}
          <div className="mb-1.5">
            <StatusBadge status={ride.status} />
          </div>
          <DialogTitle>
            Détails de la réservation
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Informations sur votre trajet du {formattedDateTime}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-neutral-400">Date et heure</p>
              <p className="text-neutral-100">{formattedDateTime}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-500 mt-1" />
            <div>
              <p className="text-sm text-neutral-400">Adresse de départ</p>
              <p className="text-neutral-100">{ride.pickup_address}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-500 mt-1" />
            <div>
              <p className="text-sm text-neutral-400">Adresse d'arrivée</p>
              <p className="text-neutral-100">{ride.dropoff_address}</p>
            </div>
          </div>
          
          {ride.vehicle_type && (
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-neutral-400">Type de véhicule</p>
                <p className="text-neutral-100">{capitalize(ride.vehicle_type)}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            {ride.distance && (
              <div className="flex items-center gap-3">
                <Route className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Distance</p>
                  <p className="text-sm text-neutral-200">{ride.distance} km</p>
                </div>
              </div>
            )}
            
            {ride.duration && (
              <div className="flex items-center gap-3">
                <Clock3 className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Durée</p>
                  <p className="text-sm text-neutral-200">{ride.duration} min</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="border-t border-neutral-800 pt-4 mt-4">
            <div className="flex justify-between items-center">
              <p className="text-neutral-400">Tarif estimé</p>
              <p className="text-lg font-semibold text-blue-400">
                {ride.estimated_price ? formatCurrency(ride.estimated_price) : "Prix non défini"}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
