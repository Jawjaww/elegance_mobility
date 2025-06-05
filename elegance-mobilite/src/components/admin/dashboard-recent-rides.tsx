import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/reservation/StatusBadge";
import Link from "next/link";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from '@/lib/database/client'
import type { Ride } from '@/lib/types/common.types';

// Importer les variables d'environnement nécessaires à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function DashboardRecentRides() {
  const [recentRides, setRecentRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  // Fonction pour charger les dernières courses
  const loadRecentRides = async () => {
    setLoading(true);
    
    try {
      // Utiliser directement supabase
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Gérer les erreurs éventuelles
      if (error) {
        throw error;
      }
      
      setRecentRides(data || []);
    } catch (error) {
      console.error('Error loading recent rides:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecentRides();
  }, []);

  const getStatusBadge = (status: string) => {
    return <StatusBadge status={status} showDetailed={true} />;
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Dernières Courses</CardTitle>
        <CardDescription>Les 5 dernières courses enregistrées</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center py-4 text-sm text-neutral-400">Chargement...</p>
        ) : recentRides.length === 0 ? (
          <p className="text-center py-4 text-sm text-neutral-400">Aucune course récente</p>
        ) : (
          <div className="space-y-4">
            {recentRides.map((ride: Ride) => (
              <div key={ride.id} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">
                        {format(new Date(ride.pickup_time), "dd MMM yyyy", { locale: fr })}
                      </span>
                      {getStatusBadge(ride.status)}
                    </div>
                    <span className="text-xs text-neutral-400">
                      {ride.pickup_address.substring(0, 30)}... → {ride.dropoff_address.substring(0, 30)}...
                    </span>
                  </div>
                  <Link 
                    href={`/backoffice-portal/rides/${ride.id}`} 
                    className="text-xs text-blue-500 hover:text-blue-400"
                  >
                    Détails
                  </Link>
                </div>
                <Separator className="mt-4 bg-neutral-800" />
              </div>
            ))}
            <div className="text-center pt-2">
              <Link 
                href="/backoffice-portal/rides" 
                className="text-sm text-blue-500 hover:text-blue-400"
              >
                Voir toutes les courses
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
