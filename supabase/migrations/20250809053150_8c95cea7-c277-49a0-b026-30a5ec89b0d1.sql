-- Fix infinite recursion in users RLS policies by removing circular dependency
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create new admin policies without circular reference
CREATE POLICY "Admins can manage users" 
ON users 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT u.id 
    FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

CREATE POLICY "Admins can view all users" 
ON users 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT u.id 
    FROM users u 
    WHERE u.id = auth.uid() 
    AND u.role = 'admin'
  )
);

-- Add the new Auto Loan Promo assistant
INSERT INTO assistants (id, client_id, name, assistant_id, structured_data, is_active) 
VALUES (
  '669aa359-14a3-4c60-8476-d9926d62180b',
  (SELECT id FROM clients WHERE name = 'FlowAIx' LIMIT 1),
  'Auto Loan Promo (outbound)',
  '669aa359-14a3-4c60-8476-d9926d62180b',
  '{
    "refinance_interest": {"type": "string", "description": "Interest in refinancing"},
    "follow_up_required": {"type": "boolean", "description": "Whether follow-up is needed"},
    "loan_interest": {"type": "string", "description": "Interest in loans"},
    "vehicle_type": {"type": "string", "description": "Type of vehicle"},
    "member_name": {"type": "string", "description": "Name of the member"},
    "call_outcome": {"type": "string", "description": "Outcome of the call"},
    "loan_amount": {"type": "string", "description": "Requested loan amount"},
    "summary": {"type": "string", "description": "Call summary"}
  }'::jsonb,
  true
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  assistant_id = EXCLUDED.assistant_id,
  structured_data = EXCLUDED.structured_data,
  is_active = EXCLUDED.is_active;