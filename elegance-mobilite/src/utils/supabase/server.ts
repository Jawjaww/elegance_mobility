/**
 * @deprecated Ce fichier est maintenu pour compatibilité et sera supprimé.
 * Utilisez @/lib/auth/server à la place
 */

import { createServerClient } from '@/lib/auth/server';

// Export pour compatibilité avec le code existant
export function createClient(cookieStore?: any) {
  return createServerClient(cookieStore);
}

export default { createClient };
