/**
 * Types pour les fonctions d'authentification et de gestion de session
 */

export interface SessionError extends Error {
  message: string;
  code?: string;
  details?: string;
}

export interface SessionResponse {
  data: {
    session: any | null;
  };
  error: SessionError | null;
}

export function checkConnection(): Promise<boolean>;

export function getSessionSafely(): Promise<SessionResponse>;

export function safeAuthOperation<T>(operation: () => Promise<T>): Promise<{
  result: T | null;
  error: SessionError | null;
}>;

// Ajouter l'exportation du client supabase
export const supabase: any;
