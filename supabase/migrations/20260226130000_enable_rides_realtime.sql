-- Enable Realtime for rides table to allow drivers to receive ride requests
DO $$
BEGIN
  -- Check if table is already in publication to avoid errors
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'rides'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not add rides to realtime publication: %', SQLERRM;
END $$;
