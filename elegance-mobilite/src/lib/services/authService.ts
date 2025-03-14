import { supabase } from '@/utils/supabase/client';
import { User, UserRole, AdminLevel, UserProfile, SessionResponse } from '@/lib/types/auth.types';
import { normalizeUserRole, normalizeAdminLevel } from '@/lib/utils/db-mapping';

class AuthService {
  /**
   * Récupère la session utilisateur courante
   */
  async getSession(): Promise<SessionResponse> {
    return await supabase.auth.getSession();
  }

  /**
   * Récupère les informations du profil utilisateur complet
   */
  async getUserProfile(): Promise<UserProfile | null> {
    const { data: session } = await this.getSession();
    
    if (!session?.session?.user) {
      return null;
    }
    
    const userId = session.session.user.id;
    const email = session.session.user.email || '';
    
    // Récupérer les données utilisateur depuis la table users
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error || !userData) {
      console.error('Error fetching user data:', error);
      return null;
    }
    
    // Construire le profil utilisateur complet
    return {
      id: userData.id,
      role: normalizeUserRole(userData.role),
      admin_level: normalizeAdminLevel(userData.admin_level),
      email: email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      phone: userData.phone,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  async hasRole(role: UserRole): Promise<boolean> {
    const profile = await this.getUserProfile();
    return profile?.role === role;
  }

  /**
   * Vérifie si l'utilisateur est un administrateur avec un niveau optionnel
   */
  async isAdmin(requiredLevel?: AdminLevel): Promise<boolean> {
    const profile = await this.getUserProfile();
    
    if (profile?.role !== 'admin') {
      return false;
    }
    
    // Si un niveau spécifique est requis
    if (requiredLevel) {
      // Utiliser uniquement admin_level pour déterminer le niveau d'admin
      // Ne plus vérifier is_super_admin
      if (requiredLevel === 'super' && profile.admin_level !== 'super') {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Méthode d'utilitaire pour vérifier explicitement si un utilisateur est un super admin
   */
  async isSuperAdmin(): Promise<boolean> {
    const profile = await this.getUserProfile();
    return profile?.role === 'admin' && profile?.admin_level === 'super';
  }

  /**
   * Connexion utilisateur
   */
  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
  }

  /**
   * Déconnexion utilisateur
   */
  async signOut() {
    return await supabase.auth.signOut();
  }
}

// Exporter une instance singleton du service
export const authService = new AuthService();
export default authService;
