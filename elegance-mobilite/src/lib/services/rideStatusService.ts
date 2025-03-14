import { supabase } from '@/utils/supabase/client';
import { mapStatusToDb } from './statusService';

interface StatusUpdateOptions {
  rideId: string;
  status: string;
  notes?: string;
  delayReason?: 'driver' | 'client';
  delayMinutes?: number;
}

/**
 * Service pour gérer les changements de statut des courses
 */
class RideStatusService {
  /**
   * Marque une course comme "client absent" (no-show)
   */
  async markAsNoShow(rideId: string, notes?: string): Promise<{success: boolean, error?: any}> {
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'no-show',
          status_notes: notes,
          status_changed_at: new Date().toISOString()
        })
        .eq('id', rideId);
        
      return { success: !error, error };
    } catch (error) {
      console.error('Erreur lors du marquage no-show:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Marque une course comme "en retard" (delayed)
   */
  async markAsDelayed(
    rideId: string, 
    delayReason: 'driver' | 'client',
    delayMinutes: number,
    notes?: string
  ): Promise<{success: boolean, error?: any}> {
    try {
      const { error } = await supabase
        .from('rides')
        .update({
          status: 'delayed',
          delay_reason: delayReason,
          delay_minutes: delayMinutes,
          status_notes: notes,
          status_changed_at: new Date().toISOString()
        })
        .eq('id', rideId);
        
      return { success: !error, error };
    } catch (error) {
      console.error('Erreur lors du marquage delayed:', error);
      return { success: false, error };
    }
  }
  
  /**
   * Mise à jour générique du statut d'une course
   */
  async updateStatus(options: StatusUpdateOptions): Promise<{success: boolean, error?: any}> {
    try {
      const dbStatus = mapStatusToDb(options.status);
      
      const updateData: any = {
        status: dbStatus,
        status_changed_at: new Date().toISOString()
      };
      
      // Ajouter d'autres champs si fournis
      if (options.notes) updateData.status_notes = options.notes;
      if (options.delayReason) updateData.delay_reason = options.delayReason;
      if (options.delayMinutes) updateData.delay_minutes = options.delayMinutes;
      
      const { error } = await supabase
        .from('rides')
        .update(updateData)
        .eq('id', options.rideId);
        
      return { success: !error, error };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      return { success: false, error };
    }
  }
}

export const rideStatusService = new RideStatusService();
export default rideStatusService;
