// Stub pour supabase dans l'environnement de développement

// Type pour un canal de supabase
interface SupabaseChannel {
  on: (eventType: string, config: any, callback: Function) => { subscribe: () => any };
}

// Type pour l'objet supabase
export interface Supabase {
  channel: (name: string) => SupabaseChannel;
  removeChannel: (channel: any) => void;
}

// Créer un mock de supabase pour éviter les erreurs TypeScript
export const supabase: Supabase = {
  channel: (name: string) => ({
    on: (_eventType: string, _config: any, _callback: Function) => ({
      subscribe: () => ({ id: name })
    }),
  }),
  removeChannel: () => {},
};

export default supabase;
