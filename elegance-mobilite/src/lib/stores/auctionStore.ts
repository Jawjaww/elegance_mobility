import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface Auction {
  id: string;
  ride_id: string;
  start_price: number;
  current_lowest_bid: number | null;
  status: 'open' | 'closed' | 'cancelled';
  expires_at: string;
}

interface Bid {
  id: string;
  auction_id: string;
  driver_id: string;
  amount: number;
  created_at: string;
}

interface AuctionStore {
  activeAuctions: Auction[];
  loading: boolean;
  error: string | null;
  fetchAuctions: () => Promise<void>;
  placeBid: (auctionId: string, amount: number) => Promise<{ success: boolean; error?: string }>;
  subscribeToAuctions: () => () => void;
}

export const useAuctionStore = create<AuctionStore>((set, get) => ({
  activeAuctions: [],
  loading: false,
  error: null,

  fetchAuctions: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('status', 'open')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      set({ activeAuctions: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  placeBid: async (auctionId, amount) => {
    try {
      const { data, error } = await supabase.rpc('place_bid', {
        p_auction_id: auctionId,
        p_amount: amount
      });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  subscribeToAuctions: () => {
    const channel = supabase
      .channel('public:auctions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, (payload) => {
        const { activeAuctions } = get();
        if (payload.eventType === 'INSERT') {
          set({ activeAuctions: [...activeAuctions, payload.new as Auction] });
        } else if (payload.eventType === 'UPDATE') {
          set({
            activeAuctions: activeAuctions.map(a => 
              a.id === payload.new.id ? { ...a, ...payload.new } : a
            ).filter(a => a.status === 'open' && new Date(a.expires_at) > new Date())
          });
        } else if (payload.eventType === 'DELETE') {
          set({ activeAuctions: activeAuctions.filter(a => a.id !== payload.old.id) });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));
