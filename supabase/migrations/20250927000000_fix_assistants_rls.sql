-- Fix RLS policies for assistants table to allow public INSERT, UPDATE, DELETE operations for demo usage

-- Allow public inserts for assistants table so creation works from the frontend in demo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assistants' AND policyname = 'Public can insert assistants'
  ) THEN
    CREATE POLICY "Public can insert assistants"
      ON public.assistants
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Allow public updates for assistants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assistants' AND policyname = 'Public can update assistants'
  ) THEN
    CREATE POLICY "Public can update assistants"
      ON public.assistants
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Allow public deletes for assistants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assistants' AND policyname = 'Public can delete assistants'
  ) THEN
    CREATE POLICY "Public can delete assistants"
      ON public.assistants
      FOR DELETE
      USING (true);
  END IF;
END $$;

-- Also add missing policies for phone_numbers table for complete CRUD operations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'phone_numbers' AND policyname = 'Public can insert phone numbers'
  ) THEN
    CREATE POLICY "Public can insert phone numbers"
      ON public.phone_numbers
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'phone_numbers' AND policyname = 'Public can update phone numbers'
  ) THEN
    CREATE POLICY "Public can update phone numbers"
      ON public.phone_numbers
      FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'phone_numbers' AND policyname = 'Public can delete phone numbers'
  ) THEN
    CREATE POLICY "Public can delete phone numbers"
      ON public.phone_numbers
      FOR DELETE
      USING (true);
  END IF;
END $$;