import { createClient } from '@supabase/supabase-js';

// Assurons-nous que l'instance est correctement exportée
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public',
    },
    global: {
      fetch: (url, options) => {
        const retries = 3;
        let count = 0;
        
        const retry = async () => {
          try {
            return await fetch(url, options);
          } catch (err) {
            if (count < retries) {
              count++;
              console.log(`Tentative de reconnexion ${count}/${retries}...`);
              await new Promise(r => setTimeout(r, 1000 * count));
              return retry();
            }
            throw err;
          }
        };
        
        return retry();
      }
    }
  }
);

// Également exporter createClient pour les cas où nous voulons créer des clients personnalisés
// Cette ligne peut être supprimée si vous n'avez pas besoin de cette flexibilité
export { createClient };
