
-- Insert default client
INSERT INTO public.clients (id, name, email, is_active, created_at, updated_at) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'FlowAIx Client', 'client@flowaix.com', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert users for both admin and client
INSERT INTO public.users (id, email, role, client_id, is_active, created_at) 
VALUES 
  ('admin-user-id-12345', 'admin@flowaix.com', 'admin', NULL, true, now()),
  ('client-user-id-12345', 'client@flowaix.com', 'client', '550e8400-e29b-41d4-a716-446655440000', true, now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample assistants for the client
INSERT INTO public.assistants (id, name, assistant_id, client_id, is_active, created_at, structured_data) 
VALUES 
  ('assistant-1-id', 'Sales Assistant', 'vapi-sales-assistant-001', '550e8400-e29b-41d4-a716-446655440000', true, now(), '{"voice": "en-US-JennyNeural", "language": "en-US", "greeting": "Hello! I am your sales assistant. How can I help you today?", "instructions": "You are a helpful sales assistant focused on converting leads into customers."}'),
  ('assistant-2-id', 'Support Assistant', 'vapi-support-assistant-002', '550e8400-e29b-41d4-a716-446655440000', true, now(), '{"voice": "en-US-AriaNeural", "language": "en-US", "greeting": "Hi! I am here to help with your support needs.", "instructions": "You are a customer support assistant focused on resolving issues efficiently."}'),
  ('assistant-3-id', 'Survey Assistant', 'vapi-survey-assistant-003', '550e8400-e29b-41d4-a716-446655440000', true, now(), '{"voice": "en-US-GuyNeural", "language": "en-US", "greeting": "Thank you for your time. I will conduct a quick survey.", "instructions": "You are conducting customer satisfaction surveys. Keep questions brief and friendly."}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample phone numbers for the client
INSERT INTO public.phone_numbers (id, name, phone_number, phone_number_id, client_id, is_active, created_at) 
VALUES 
  ('phone-1-id', 'Main Sales Line', '+1234567890', 'vapi-phone-001', '550e8400-e29b-41d4-a716-446655440000', true, now()),
  ('phone-2-id', 'Support Line', '+1234567891', 'vapi-phone-002', '550e8400-e29b-41d4-a716-446655440000', true, now()),
  ('phone-3-id', 'Survey Line', '+1234567892', 'vapi-phone-003', '550e8400-e29b-41d4-a716-446655440000', true, now())
ON CONFLICT (id) DO NOTHING;

-- Insert sample campaign for demonstration
INSERT INTO public.campaigns (id, name, client_id, assistant_id, phone_number_id, csv_file_name, total_numbers, completed_calls, failed_calls, status, created_at, updated_at) 
VALUES ('campaign-1-id', 'Welcome Campaign', '550e8400-e29b-41d4-a716-446655440000', 'assistant-1-id', 'phone-1-id', 'sample_contacts.csv', 100, 25, 5, 'active', now(), now())
ON CONFLICT (id) DO NOTHING;
