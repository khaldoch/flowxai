
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vapi-secret, x-call-id',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const webhookData = await req.json();
    const message = webhookData.message;
    
    console.log('Received webhook data:', JSON.stringify(webhookData, null, 2));
    console.log('Message type:', message?.type);
    console.log('Assistant ID:', message?.assistant?.id);
    console.log('Phone Number ID:', message?.phoneNumber?.id);

    if (!message || message.type !== 'end-of-call-report') {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Extract data from the webhook structure - Updated for VAPI format
    const callId = message.call?.id || webhookData.message.call?.id;
    const agentName = message.assistant?.name || message.call?.assistant?.name || 'Unknown Agent';
    const fromNumber = message.phoneNumber?.number || message.call?.phoneNumber?.number || '';
    const toNumber = message.customer?.number || message.call?.customer?.number || '';
    const callType = (message.call?.type === 'outboundPhoneCall' || message.type === 'outboundPhoneCall') ? 'outbound' : 'inbound';
    const status = message.endedReason || message.call?.endedReason || 'unknown';
    const durationMinutes = message.durationMinutes || message.call?.durationMinutes || 0;
    
    // VAPI analysis data - check multiple locations
    const summary = message.summary || message.analysis?.summary || message.call?.analysis?.summary || '';
    const transcript = message.transcript || message.call?.transcript || '';
    const recordingUrl = message.recordingUrl || message.stereoRecordingUrl || message.call?.recordingUrl || message.call?.stereoRecordingUrl || '';
    const structuredData = message.analysis?.structuredData || message.call?.analysis?.structuredData || {};
    
    const startedAt = message.startedAt || message.call?.startedAt;
    const endedAt = message.endedAt || message.call?.endedAt;

    // Calculate cost from VAPI response or default calculation
    const cost = message.cost || (durationMinutes * 60 * 0.011);

    // Determine sentiment from success evaluation or structured data - Updated for VAPI format
    let sentiment = 'neutral';
    const successEvaluation = message.analysis?.successEvaluation || message.call?.analysis?.successEvaluation;
    
    if (successEvaluation === true || successEvaluation === 'true' || successEvaluation === 'pass') {
      sentiment = 'positive';
    } else if (successEvaluation === false || successEvaluation === 'false' || successEvaluation === 'fail') {
      sentiment = 'negative';
    } else if (typeof successEvaluation === 'number') {
      // Handle numeric scale (1-10)
      if (successEvaluation >= 7) {
        sentiment = 'positive';
      } else if (successEvaluation <= 4) {
        sentiment = 'negative';
      }
    }

    // Find client_id based on assistant_id - Updated for VAPI format
    let clientId = null;
    
    const assistantId = message.assistant?.id || message.call?.assistant?.id;
    console.log('Looking for assistant with ID:', assistantId);
    
    // Try to find client by assistant_id first
    if (assistantId) {
      const { data: assistant, error: assistantError } = await supabase
        .from('assistants')
        .select('client_id')
        .eq('assistant_id', assistantId)
        .maybeSingle();
      
      if (assistantError) {
        console.error('Error finding assistant:', assistantError);
      } else if (assistant) {
        clientId = assistant.client_id;
        console.log('Found client_id from assistant:', clientId);
      }
    }
    
    // If no client found by assistant, try to find by phone number - Updated for VAPI format
    const phoneNumberId = message.phoneNumber?.id || message.call?.phoneNumber?.id;
    if (!clientId && phoneNumberId) {
      console.log('Looking for phone number with ID:', phoneNumberId);
      const { data: phoneNumber, error: phoneError } = await supabase
        .from('phone_numbers')
        .select('client_id')
        .eq('phone_number_id', phoneNumberId)
        .maybeSingle();
      
      if (phoneError) {
        console.error('Error finding phone number:', phoneError);
      } else if (phoneNumber) {
        clientId = phoneNumber.client_id;
        console.log('Found client_id from phone number:', clientId);
      }
    }
    
    // Fallback to default client (FlowAIx)
    if (!clientId) {
      console.log('No client found, using default FlowAIx client');
      const { data: clients } = await supabase
        .from('clients')
        .select('id')
        .eq('email', 'client@flowaix.com')
        .limit(1);
      
      clientId = clients?.[0]?.id || null;
      console.log('Default client_id:', clientId);
    }

    // Insert the call report into the database
    const { data, error } = await supabase
      .from('call_reports')
      .insert([{
        call_id: callId,
        agent: agentName,
        from_number: fromNumber,
        to_number: toNumber,
        call_type: callType,
        status: status,
        sentiment: sentiment,
        duration_minutes: durationMinutes,
        cost: cost,
        summary: summary,
        transcript: transcript,
        recording_url: recordingUrl,
        structured_data: structuredData,
        started_at: startedAt,
        ended_at: endedAt,
        client_id: clientId
      }])
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to store call report',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Call report stored successfully:', data);
    console.log('Client ID used:', clientId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Call report received and stored successfully',
        data: data[0]
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request format',
        details: error.message 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
