
-- Create a table for call reports
CREATE TABLE public.call_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id TEXT NOT NULL UNIQUE,
  agent TEXT NOT NULL,
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'outbound',
  status TEXT NOT NULL,
  sentiment TEXT,
  duration_minutes DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,4) NOT NULL,
  summary TEXT,
  transcript TEXT,
  recording_url TEXT,
  structured_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_call_reports_call_id ON public.call_reports(call_id);
CREATE INDEX idx_call_reports_agent ON public.call_reports(agent);
CREATE INDEX idx_call_reports_status ON public.call_reports(status);
CREATE INDEX idx_call_reports_created_at ON public.call_reports(created_at);
CREATE INDEX idx_call_reports_structured_data ON public.call_reports USING gin(structured_data);

-- Enable Row Level Security
ALTER TABLE public.call_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since this will be used by webhook)
CREATE POLICY "Allow all operations on call_reports" 
  ON public.call_reports 
  FOR ALL 
  USING (true)
  WITH CHECK (true);
