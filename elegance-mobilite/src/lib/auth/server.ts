/**
 * Client Supabase côté serveur
 * Version universelle qui fonctionne dans les API routes (pages) et les Server Components (app)
 */
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import type { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import type { CookieSerializeOptions } from 'cookie';

// Type étendu pour la compatibilité avec l'API cookies de Next.js
// Interface de base pour les cookies Next.js
interface BaseCookies {
  get: (name: string) => { name: string; value: string } | undefined;
  getAll: () => Array<{ name: string; value: string }>;
  has: (name: string) => boolean;
}

// Extension pour les méthodes de modification
interface CookieWriter {
  set: (options: { name: string; value: string } & Partial<CookieSerializeOptions>) => void;
  delete: (options: { name: string } & Partial<CookieSerializeOptions>) => void;
}

// Type combiné pour les cookies Next.js
type NextCookies = BaseCookies & CookieWriter;

type CookieStore = Promise<NextCookies> | NextCookies;

/**
 * Crée un client Supabase côté serveur avec gestion des cookies
 * @param cookieStore - Objet cookies de Next.js
 */
export function createServerClient(cookieStore?: CookieStore) {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          if (!cookieStore) return undefined;
          try {
            // Vérifier si cookieStore est une promesse
            const cookieStoreResolved = cookieStore instanceof Promise ? await cookieStore : cookieStore;
            const cookie = await cookieStoreResolved.get(name);
            return cookie?.value;
          } catch (error) {
            console.error(`[AUTH_DEBUG] Erreur lecture cookie ${name}:`, error);
            return undefined;
          }
        },
        async set(name: string, value: string, options: CookieOptions) {
          if (!cookieStore) return;
          try {
            const cookieStoreResolved = cookieStore instanceof Promise ? await cookieStore : cookieStore;
            const cookieOptions: { name: string; value: string } & Partial<CookieSerializeOptions> = {
              name,
              value,
              ...options,
              // Paramètres de sécurité renforcée pour les cookies
              path: '/',
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true // Protection XSS
            };
            await cookieStoreResolved.set(cookieOptions);
          } catch (error) {
            console.error(`[AUTH_DEBUG] Erreur définition cookie ${name}:`, error);
          }
        },
        async remove(name: string, options: CookieOptions) {
          if (!cookieStore) return;
          try {
            // Vérifier si cookieStore est une promesse
            const cookieStoreResolved = cookieStore instanceof Promise ? await cookieStore : cookieStore;
            await cookieStoreResolved.delete({
              name,
              ...options,
              path: '/'
            });
          } catch (error) {
            console.error(`[AUTH_DEBUG] Erreur suppression cookie ${name}:`, error);
          }
        },
      },
      auth: {
        detectSessionInUrl: true,
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );
}

/**
 * Crée un client Supabase côté serveur pour les composants Server de Next.js App Router
 */
export async function createServerComponentClient() {
  const { cookies } = await import('next/headers');
  const cookieStore = cookies();
  const client = createServerClient(cookieStore);

  // Vérification supplémentaire de l'authenticité de l'utilisateur
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error) throw error;
    return client;
  } catch (error) {
    console.error('[AUTH_DEBUG] Erreur vérification utilisateur:', error);
    return client;
  }
}

/**
 * Récupère l'utilisateur authentifié de manière sécurisée
 */
export async function getAuthenticatedUser(cookieStore?: CookieStore) {
  const client = createServerClient(cookieStore);
  const { data: { user }, error } = await client.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  return user;
}
