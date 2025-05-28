import { createServerSupabaseClient } from "@/lib/database/server";

interface UpdateProfileParams {
  userId: string;
  email?: string;
  phone?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

export async function updateProfile(params: UpdateProfileParams) {
  const supabase = await createServerSupabaseClient();

  try {
    // Si le mot de passe doit être mis à jour
    if (params.currentPassword && params.newPassword) {
      const { error } = await supabase.auth.updateUser({
        password: params.newPassword
      })

      if (error) {
        return { error: error.message };
      }
    }

    // Mise à jour des informations du profil via auth.updateUser
    const updateData: any = {};
    if (params.email) updateData.email = params.email;

    // Les données de profil
    const userData: {
      data?: { [key: string]: any };
    } = {};
    
    if (params.first_name !== undefined) userData.data = { ...userData.data, first_name: params.first_name };
    if (params.last_name !== undefined) userData.data = { ...userData.data, last_name: params.last_name };
    if (params.phone !== undefined) userData.data = { ...userData.data, phone: params.phone };

    if (Object.keys(updateData).length > 0 || Object.keys(userData).length > 0) {
      const { error } = await supabase.auth.updateUser({
        ...updateData,
        ...userData
      });

      if (error) {
        return { error: error.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { error: error.message };
  }
}
