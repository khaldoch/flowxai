-- Fix RLS policy for clients table to allow public inserts for demo usage

-- Allow public read access for clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Public can view clients'
  ) THEN
    CREATE POLICY "Public can view clients"
      ON public.clients
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Allow public inserts for clients table so creation works from the frontend in demo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Public can insert clients'
  ) THEN
    CREATE POLICY "Public can insert clients"
      ON public.clients
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Allow public updates for clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Public can update clients'
  ) THEN
    CREATE POLICY "Public can update clients"
      ON public.clients
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;