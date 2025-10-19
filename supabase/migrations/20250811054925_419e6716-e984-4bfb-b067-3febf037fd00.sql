-- Fix RLS recursion on users and open read access for demo usage; seed client, assistants, and phone number

-- Drop problematic users admin policies to prevent recursion
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins can manage users'
  ) THEN
    DROP POLICY "Admins can manage users" ON public.users;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Admins can view all users'
  ) THEN
    DROP POLICY "Admins can view all users" ON public.users;
  END IF;
END $$;

-- Allow public read access needed for frontend (no auth in demo)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'assistants' AND policyname = 'Public can view assistants'
  ) THEN
    CREATE POLICY "Public can view assistants"
      ON public.assistants
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'phone_numbers' AND policyname = 'Public can view phone numbers'
  ) THEN
    CREATE POLICY "Public can view phone numbers"
      ON public.phone_numbers
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'call_reports' AND policyname = 'Public can view call reports'
  ) THEN
    CREATE POLICY "Public can view call reports"
      ON public.call_reports
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Allow public inserts for campaigns and campaign_calls so creation works from the frontend in demo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'campaigns' AND policyname = 'Public can insert campaigns'
  ) THEN
    CREATE POLICY "Public can insert campaigns"
      ON public.campaigns
      FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'campaign_calls' AND policyname = 'Public can insert campaign calls'
  ) THEN
    CREATE POLICY "Public can insert campaign calls"
      ON public.campaign_calls
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Seed default client, assistants, and phone number
DO $$
DECLARE
  v_client_id uuid;
BEGIN
  -- Ensure default client exists
  SELECT id INTO v_client_id FROM public.clients WHERE email = 'client@flowaix.com' LIMIT 1;
  IF v_client_id IS NULL THEN
    INSERT INTO public.clients (name, email, is_active)
    VALUES ('FlowAIx', 'client@flowaix.com', true)
    RETURNING id INTO v_client_id;
  END IF;

  -- Seed FlowAIx Lead Call (outbound) assistant used in your example if missing
  IF NOT EXISTS (SELECT 1 FROM public.assistants WHERE assistant_id = '134b3a72-aedd-4eb5-9a50-863bbe199b57') THEN
    INSERT INTO public.assistants (client_id, name, assistant_id, is_active)
    VALUES (v_client_id, 'FlowAIx Lead Call (outbound)', '134b3a72-aedd-4eb5-9a50-863bbe199b57', true);
  END IF;

  -- Seed requested Auto Loan Promo (outbound) assistant
  IF NOT EXISTS (SELECT 1 FROM public.assistants WHERE assistant_id = '669aa359-14a3-4c60-8476-d9926d62180b') THEN
    INSERT INTO public.assistants (client_id, name, assistant_id, is_active, structured_data)
    VALUES (
      v_client_id,
      'Auto Loan Promo (outbound)',
      '669aa359-14a3-4c60-8476-d9926d62180b',
      true,
      '{
        "refinance_interest": null,
        "follow_up_required": null,
        "loan_interest": null,
        "vehicle_type": null,
        "memeber_name": null,
        "call_outcome": null,
        "loan_amount": null,
        "summary": null
      }'::jsonb
    );
  END IF;

  -- Seed example phone number used in your webhook payload
  IF NOT EXISTS (SELECT 1 FROM public.phone_numbers WHERE phone_number_id = 'ba8d7bb7-5315-4e66-a1e2-af66b7252fb8') THEN
    INSERT INTO public.phone_numbers (client_id, name, phone_number, phone_number_id, is_active)
    VALUES (v_client_id, 'Outbound Calls', '+19545196171', 'ba8d7bb7-5315-4e66-a1e2-af66b7252fb8', true);
  END IF;
END $$;