import { supabase, handleRoleError } from '@/lib/database/client';

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
      // Log des données d'entrée
      console.log("[DEBUG] Tentative de mise à jour de la réservation:", {
        id,
        updateData,
      });

      // Vérification de l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("[DEBUG] Erreur d'authentification:", authError);
        return { success: false, error: authError };
      }
      console.log("[DEBUG] Utilisateur authentifié:", {
        id: user?.id,
        role: user?.app_metadata?.role,
      });

      // Première tentative avec select()
      console.log("[DEBUG] Première tentative de mise à jour avec select()");
      const { data, error } = await supabase
        .from('rides')
        .update(updateData)
        .eq('id', id)
        .select();
      
      // Log détaillé de l'erreur si présente
      if (error) {
        console.error("[DEBUG] Erreur lors de la première tentative:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      }

      if (error && handleRoleError(error)) {
        console.log("[DEBUG] Erreur de rôle détectée, tentative sans select()");
        const { error: secondError } = await supabase
          .from('rides')
          .update(updateData)
          .eq('id', id);
          
        if (secondError) {
          console.error("[DEBUG] Échec de la deuxième tentative:", {
            code: secondError.code,
            message: secondError.message,
            details: secondError.details,
            hint: secondError.hint
          });
          return { success: false, error: secondError };
        }
        
        console.log("[DEBUG] Deuxième tentative réussie");
        return { success: true, data: null };
      }
      
      if (error) {
        return { success: false, error };
      }
      
      console.log("[DEBUG] Mise à jour réussie:", data);
      return { success: true, data };
    } catch (error) {
      console.error("[DEBUG] Exception inattendue lors de la mise à jour:", error);
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
      // On ne vérifie plus le rôle app_customer, on utilise la policy RLS standard (authenticated)
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("[ERROR] Erreur dans getUserReservations:", error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error("[ERROR] Exception générale dans getUserReservations:", error);
      return { success: false, error };
    }
  }
};

export default reservationService;
