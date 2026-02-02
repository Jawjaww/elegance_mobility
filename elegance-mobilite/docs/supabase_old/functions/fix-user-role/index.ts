import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    // Cette fonction est déclenchée par un webhook lors de la création d'un utilisateur
    const { record } = await req.json()
    
    console.log('🔧 Correction du rôle pour l\'utilisateur:', record.id)
    
    // Vérifier si l'utilisateur a un rôle dans user_metadata
    const userMetadata = record.raw_user_meta_data || {}
    const appMetadata = record.raw_app_meta_data || {}
    
    // Si le rôle dans user_metadata est différent de celui dans app_metadata
    if (userMetadata.role && userMetadata.role !== appMetadata.role) {
      console.log(`📝 Mise à jour du rôle de ${appMetadata.role || 'undefined'} vers ${userMetadata.role}`)
      
      // Utiliser l'API admin de Supabase pour mettre à jour les métadonnées
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      
      const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${record.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
        },
        body: JSON.stringify({
          app_metadata: {
            ...appMetadata,
            role: userMetadata.role
          }
        })
      })
      
      if (response.ok) {
        console.log('✅ Rôle mis à jour avec succès')
      } else {
        const error = await response.text()
        console.error('❌ Erreur lors de la mise à jour du rôle:', error)
      }
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Erreur dans fix-user-role:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
