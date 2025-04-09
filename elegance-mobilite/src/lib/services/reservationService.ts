import { supabase, handleRoleError } from '@/lib/database/client';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Utilitaire pour gérer les réservations de manière robuste face aux erreurs de rôle
 */
export const reservationService = {
  // Créer une réservation
  async createReservation(reservationData: any) {
    try {
      // Première tentative avec select()
      const { data, error } = await supabase
        .from('rides')
        .insert(reservationData)
        .select();
      
      // Si erreur de rôle, refaire la requête sans select()
      if (error && handleRoleError(error)) {
        const { error: secondError } = await supabase
          .from('rides')
          .insert(reservationData);
        
        if (secondError) {
          console.error("Deuxième tentative échouée:", secondError);
          return { success: false, error: secondError };
        }
        
        return { success: true, data: null };
      }
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      return { success: false, error };
    }
  },
  
  // Mettre à jour une réservation
  async updateReservation(id: string, updateData: any) {
    try {
      // Utilisation de await pour résoudre correctement la promesse
      const { data, error } = await supabase
        .from('rides')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error && handleRoleError(error)) {
        const { error: secondError } = await supabase
          .from('rides')
          .update(updateData)
          .eq('id', id);
          
        if (secondError) {
          return { success: false, error: secondError };
        }
        
        return { success: true, data: null };
      }
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      return { success: false, error };
    }
  },
  
  // Annuler une réservation
  async cancelReservation(id: string) {
    try {
      // Utilisation de await pour résoudre correctement la promesse
      const { data, error } = await supabase
        .from('rides')
        .update({ status: 'client-canceled' })
        .eq('id', id)
        .select();
      
      if (error && handleRoleError(error)) {
        const { error: secondError } = await supabase
          .from('rides')
          .update({ status: 'client-canceled' })
          .eq('id', id);
          
        if (secondError) {
          return { success: false, error: secondError };
        }
        
        return { success: true, data: null };
      }
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
      return { success: false, error };
    }
  },
  
  // Récupérer les réservations d'un utilisateur
  async getUserReservations(userId: string) {
    try {
      // Utilisation de await pour résoudre correctement la promesse
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error && handleRoleError(error)) {
        return { success: true, data: [] };
      }
      
      if (error) {
        return { success: false, error };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Erreur lors de la récupération:", error);
      return { success: false, error };
    }
  }
};

export default reservationService;
