
-- First, let's create a default client record for client@flowaix.com
INSERT INTO public.clients (id, name, email, is_active, created_at, updated_at) 
VALUES (
  'default-client-id'::uuid,
  'FlowAIx Client',
  'client@flowaix.com',
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Create a users record for the client
INSERT INTO public.users (id, email, role, client_id, is_active, created_at)
VALUES (
  'client-user-id'::uuid,
  'client@flowaix.com',
  'client',
  'default-client-id'::uuid,
  true,
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  client_id = EXCLUDED.client_id,
  is_active = EXCLUDED.is_active;

-- Create a users record for the admin
INSERT INTO public.users (id, email, role, client_id, is_active, created_at)
VALUES (
  'admin-user-id'::uuid,
  'admin@flowaix.com',
  'admin',
  null,
  true,
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Add structured_data column to assistants table
ALTER TABLE public.assistants ADD COLUMN IF NOT EXISTS structured_data jsonb;

-- Update assistants table to include client_id reference
UPDATE public.assistants SET client_id = 'default-client-id'::uuid WHERE client_id IS NULL;

-- Update phone_numbers table to include client_id reference  
UPDATE public.phone_numbers SET client_id = 'default-client-id'::uuid WHERE client_id IS NULL;
