
-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create assistants table
CREATE TABLE public.assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  assistant_id TEXT NOT NULL, -- VAPI assistant ID
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create phone_numbers table
CREATE TABLE public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  phone_number_id TEXT NOT NULL, -- VAPI phone number ID
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  assistant_id UUID REFERENCES public.assistants(id) ON DELETE SET NULL,
  phone_number_id UUID REFERENCES public.phone_numbers(id) ON DELETE SET NULL,
  csv_file_name TEXT,
  total_numbers INTEGER DEFAULT 0,
  completed_calls INTEGER DEFAULT 0,
  failed_calls INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create campaign_calls table
CREATE TABLE public.campaign_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  variable_values JSONB,
  call_id TEXT, -- VAPI call ID
  status TEXT DEFAULT 'pending', -- pending, calling, completed, failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create users table for authentication
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'client', -- admin, client
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Update call_reports table to include client_id
ALTER TABLE public.call_reports 
ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Admins can view all clients" ON public.clients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can manage clients" ON public.clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- RLS Policies for assistants
CREATE POLICY "Users can view their client's assistants" ON public.assistants
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM public.users WHERE users.id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can manage assistants" ON public.assistants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- RLS Policies for phone_numbers
CREATE POLICY "Users can view their client's phone numbers" ON public.phone_numbers
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM public.users WHERE users.id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can manage phone numbers" ON public.phone_numbers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- RLS Policies for campaigns
CREATE POLICY "Users can view their client's campaigns" ON public.campaigns
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM public.users WHERE users.id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Users can manage their client's campaigns" ON public.campaigns
  FOR ALL USING (
    client_id IN (
      SELECT client_id FROM public.users WHERE users.id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- RLS Policies for campaign_calls
CREATE POLICY "Users can view their client's campaign calls" ON public.campaign_calls
  FOR SELECT USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE campaigns.client_id IN (
        SELECT client_id FROM public.users WHERE users.id = auth.uid()
      )
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Users can manage their client's campaign calls" ON public.campaign_calls
  FOR ALL USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE campaigns.client_id IN (
        SELECT client_id FROM public.users WHERE users.id = auth.uid()
      )
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

-- Update call_reports RLS policy
DROP POLICY IF EXISTS "Allow all operations on call_reports" ON public.call_reports;

CREATE POLICY "Users can view their client's call reports" ON public.call_reports
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM public.users WHERE users.id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
  );

CREATE POLICY "System can insert call reports" ON public.call_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update call reports" ON public.call_reports
  FOR UPDATE USING (true);
