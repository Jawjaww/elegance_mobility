/**
 * @deprecated Ce fichier est maintenu pour compatibilité et sera supprimé.
 * Utilisez @/lib/auth/client à la place
 */
import { supabase, createClient } from '@/lib/auth/client';

// Exports pour compatibilité avec le code existant
export { supabase, createClient };
export default supabase;
