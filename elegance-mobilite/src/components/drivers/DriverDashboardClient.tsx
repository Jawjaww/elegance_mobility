import { useState, useEffect } from "react"
import { supabase } from '@/lib/database/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RideCard } from "./RideCard"
import { RideFilters } from "./RideFilters"
import { Separator } from "@/components/ui/separator"
import { SectionLoading } from "@/components/ui/loading"
import type { RideStatus, FilterRideStatus } from '@/lib/types/common.types'

// Définition des props
interface DriverDashboardClientProps {
  driverId?: string;
}

// Initialisation des compteurs
const INITIAL_COUNTS = {
  all: 0,
  pending: 0,
  scheduled: 0,
  "in-progress": 0,
  completed: 0,
  "client-canceled": 0,
  "driver-canceled": 0, 
  "admin-canceled": 0,
  "no-show": 0,
  delayed: 0
} as Record<FilterRideStatus, number>;

export function DriverDashboardClient({ driverId }: DriverDashboardClientProps) {
  // Mise à jour du type pour statusCounts
  const [statusCounts, setStatusCounts] = useState<Record<FilterRideStatus, number>>(INITIAL_COUNTS);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterRideStatus>('all');

  useEffect(() => {
    loadDriverRides();
  }, [driverId]);

  const loadDriverRides = async () => {
    if (!driverId) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', driverId)
        .order('pickup_time', { ascending: false });
        
      if (error) throw error;
      
      setRides(data || []);
      
      // Calculer les compteurs par statut
      const counts = { ...INITIAL_COUNTS };
      counts.all = (data || []).length;
      
      (data || []).forEach((ride: any) => {
        // Seuls les statuts présents dans INITIAL_COUNTS seront incrémentés
        if (ride.status in counts) {
          counts[ride.status as FilterRideStatus]++;
        }
      });
      
      setStatusCounts(counts);
    } catch (error) {
      console.error('Error loading driver rides:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les courses selon le statut sélectionné
  const filteredRides = rides.filter(ride => {
    if (filter === 'all') return true;
    return ride.status === filter;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mes Courses</CardTitle>
          <CardDescription>
            Gérez vos courses et suivez votre activité
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 border-b border-neutral-800">
            <RideFilters 
              defaultValue={filter} 
              onFilterChange={setFilter} 
              counts={statusCounts}
            />
          </div>
          
          <div className="p-6">
            {loading ? (
              <SectionLoading text="Chargement de vos courses..." />
            ) : filteredRides.length === 0 ? (
              <p className="text-center py-8 text-sm text-neutral-400">
                Aucune course {filter !== 'all' ? `avec le statut "${filter}"` : ''}
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredRides.map(ride => (
                  <RideCard 
                    key={ride.id} 
                    ride={ride} 
                    editable={ride.status === 'pending'} 
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}