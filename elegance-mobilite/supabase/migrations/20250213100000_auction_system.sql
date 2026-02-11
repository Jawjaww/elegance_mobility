-- Migration: Realtime Auction System
-- Description: Tables and functions for real-time ride auctions

-- ============================================
-- Create auction status enum
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auction_status') THEN
        CREATE TYPE auction_status AS ENUM ('open', 'closed', 'cancelled');
    END IF;
END $$;

-- ============================================
-- Table: auctions
-- ============================================
CREATE TABLE IF NOT EXISTS public.auctions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id uuid NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
    start_price numeric NOT NULL,
    current_lowest_bid numeric,
    winning_bid_id uuid,
    status auction_status DEFAULT 'open',
    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(ride_id)
);

-- ============================================
-- Table: bids
-- ============================================
CREATE TABLE IF NOT EXISTS public.bids (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id uuid NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
    driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auctions
CREATE POLICY "Anyone can view open auctions" 
    ON public.auctions FOR SELECT 
    TO authenticated 
    USING (status = 'open' OR winning_bid_id IS NOT NULL);

-- RLS Policies for bids
CREATE POLICY "Drivers can view their own bids" 
    ON public.bids FOR SELECT 
    TO authenticated 
    USING (driver_id = auth.uid());

CREATE POLICY "Drivers can place bids on open auctions" 
    ON public.bids FOR INSERT 
    TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.auctions 
            WHERE id = auction_id AND status = 'open' AND expires_at > now()
        )
        AND driver_id = auth.uid()
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;

-- ============================================
-- Function: place_bid
-- ============================================
CREATE OR REPLACE FUNCTION public.place_bid(
    p_auction_id uuid,
    p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auction record;
    v_bid_id uuid;
BEGIN
    -- Lock auction for update
    SELECT * INTO v_auction 
    FROM public.auctions 
    WHERE id = p_auction_id 
    FOR UPDATE;

    IF v_auction IS NULL THEN
        RAISE EXCEPTION 'Enchère introuvable';
    END IF;

    IF v_auction.status != 'open' OR v_auction.expires_at < now() THEN
        RAISE EXCEPTION 'Cette enchère est fermée';
    END IF;

    IF v_auction.current_lowest_bid IS NOT NULL AND p_amount >= v_auction.current_lowest_bid THEN
        RAISE EXCEPTION 'Votre offre doit être inférieure à l''offre actuelle';
    END IF;

    -- Insert bid
    INSERT INTO public.bids (auction_id, driver_id, amount)
    VALUES (p_auction_id, auth.uid(), p_amount)
    RETURNING id INTO v_bid_id;

    -- Update auction lowest bid
    UPDATE public.auctions
    SET current_lowest_bid = p_amount,
        updated_at = now()
    WHERE id = p_auction_id;

    RETURN jsonb_build_object(
        'success', true,
        'bid_id', v_bid_id,
        'amount', p_amount
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_bid TO authenticated;
