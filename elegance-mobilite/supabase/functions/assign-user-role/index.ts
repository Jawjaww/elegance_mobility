// Edge Function pour assigner automatiquement les rôles lors du signup
// Fichier: supabase/functions/assign-user-role/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { record } = await req.json()
    
    // Vérifier si c'est un nouveau utilisateur avec portal_type
    if (record?.raw_user_meta_data?.portal_type) {
      const portalType = record.raw_user_meta_data.portal_type
      
      // Définir le rôle basé sur portal_type
      let role = 'app_customer' // défaut
      
      switch (portalType) {
        case 'driver':
          role = 'app_driver'
          break
        case 'customer':
          role = 'app_customer'
          break
        case 'admin':
          role = 'app_admin'
          break
      }

      // Mettre à jour l'utilisateur avec le bon rôle dans app_metadata
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        record.id,
        {
          app_metadata: {
            ...record.raw_app_meta_data,
            role: role
          }
        }
      )

      if (error) {
        console.error('Erreur lors de l\'assignation du rôle:', error)
        throw error
      }

      console.log(`Rôle ${role} assigné à l'utilisateur ${record.id} (portal_type: ${portalType})`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Erreur dans assign-user-role:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
