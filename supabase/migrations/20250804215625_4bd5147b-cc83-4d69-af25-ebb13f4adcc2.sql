-- First, ensure we have the default client
INSERT INTO public.clients (id, name, email, is_active, created_at, updated_at) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'FlowAIx', 'client@flowaix.com', true, now(), now())
ON CONFLICT (email) DO UPDATE SET 
  id = '550e8400-e29b-41d4-a716-446655440000',
  name = 'FlowAIx',
  is_active = true;

-- Clear existing assistants for this client to start fresh
DELETE FROM public.assistants WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';

-- Insert the specific assistants with their structured data
INSERT INTO public.assistants (id, name, assistant_id, client_id, is_active, created_at, structured_data) VALUES 
  (
    gen_random_uuid(), 
    'Auto Loan Promo (outbound)', 
    '669aa359-14a3-4c60-8476-d9926d62180b', 
    '550e8400-e29b-41d4-a716-446655440000', 
    true, 
    now(), 
    '{"summary": "", "loan_amount": "", "call_outcome": "", "member_name": "", "vehicle_type": "", "loan_interest": "", "call_timestamp": "", "follow_up_required": "", "refinance_interest": ""}'
  ),
  (
    gen_random_uuid(), 
    'Vacation Loan Promo (outbound)', 
    '7a63fd71-25af-4805-8b66-911f4ff10deb', 
    '550e8400-e29b-41d4-a716-446655440000', 
    true, 
    now(), 
    '{"summary": "", "loan_amount": "", "member_name": "", "call_outcome": "", "call_timestamp": "", "interest_level": "", "travel_timeframe": "", "follow_up_required": ""}'
  ),
  (
    gen_random_uuid(), 
    'Debt Recovery (Outbound)', 
    '55469a2b-cf27-4ad1-8579-41387f6d3f23', 
    '550e8400-e29b-41d4-a716-446655440000', 
    true, 
    now(), 
    '{"summary": "", "loan_type": "", "member_name": "", "email_address": "", "call_timestamp": "", "payment_status": "", "past_due_amount": "", "resolution_path": "", "payment_start_date": ""}'
  ),
  (
    gen_random_uuid(), 
    'Loan Payment Reminder (Outbound)', 
    '17f4520e-6526-4d85-bd28-ca8109eff9fc', 
    '550e8400-e29b-41d4-a716-446655440000', 
    true, 
    now(), 
    '{"summary": "", "loan_type": "", "member_id": "", "member_name": "", "call_timestamp": "", "payment_intent": "", "reminder_status": "", "payment_due_date": "", "member_acknowledgement": ""}'
  ),
  (
    gen_random_uuid(), 
    'FlowAIx Lead Call (outbound)', 
    '134b3a72-aedd-4eb5-9a50-863bbe199b57', 
    '550e8400-e29b-41d4-a716-446655440000', 
    true, 
    now(), 
    '{"Title": "", "Company": "", "Last Name": "", "timeframe": "", "First Name": "", "Lead Source": "", "email_address": "", "service_interest": ""}'
  );

-- Clear existing phone numbers for this client to start fresh
DELETE FROM public.phone_numbers WHERE client_id = '550e8400-e29b-41d4-a716-446655440000';

-- Insert the specific phone number
INSERT INTO public.phone_numbers (id, name, phone_number, phone_number_id, client_id, is_active, created_at) VALUES 
  (
    gen_random_uuid(), 
    'FlowAIx Main Line', 
    '+1 (868) 268 1055', 
    '148a232c-c892-4367-8dd8-6899f3d9fa1a', 
    '550e8400-e29b-41d4-a716-446655440000', 
    true, 
    now()
  );

-- Add structured_data column to assistants table if it doesn't exist
ALTER TABLE public.assistants ADD COLUMN IF NOT EXISTS structured_data jsonb DEFAULT '{}'::jsonb;