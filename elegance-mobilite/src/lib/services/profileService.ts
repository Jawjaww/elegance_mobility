import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";

interface UpdateProfileParams {
  userId: string;
  name?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
  user_metadata?: {
    [key: string]: any;
  };
}

export const updateProfile = async ({
  userId,
  name,
  email,
  phone,
  currentPassword,
  newPassword,
  user_metadata
}: UpdateProfileParams) => {

  try {
    // Mise à jour des métadonnées de l'utilisateur
    if (name || phone || user_metadata) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          name,
          phone,
          ...user_metadata
        }
      });

      if (updateError) {
        return { error: updateError.message };
      }
    }

    // Mise à jour de l'email si fourni
    if (email) {
      const { error: emailError } = await supabase.auth.updateUser({
        email
      });

      if (emailError) {
        return { error: emailError.message };
      }
    }

    // Mise à jour du mot de passe si fourni
    if (currentPassword && newPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (passwordError) {
        return { error: passwordError.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
};

export default updateProfile;
