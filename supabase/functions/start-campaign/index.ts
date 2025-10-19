
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { campaignId, csvData } = await req.json();

    console.log('Starting campaign:', campaignId);
    console.log('CSV data count:', csvData.length);

    // Get campaign details with related assistant and phone number
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      console.error('Campaign fetch error:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get assistant details
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('assistant_id')
      .eq('id', campaign.assistant_id)
      .single();

    if (assistantError) {
      console.error('Assistant fetch error:', assistantError);
      return new Response(
        JSON.stringify({ error: 'Assistant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get phone number details
    const { data: phoneNumber, error: phoneError } = await supabase
      .from('phone_numbers')
      .select('phone_number_id')
      .eq('id', campaign.phone_number_id)
      .single();

    if (phoneError) {
      console.error('Phone number fetch error:', phoneError);
      return new Response(
        JSON.stringify({ error: 'Phone number not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update campaign status to running
    await supabase
      .from('campaigns')
      .update({ status: 'running' })
      .eq('id', campaignId);

    // Create campaign calls for each number
    const campaignCalls = csvData.map((row: any) => {
      const { phone_number, ...variableValues } = row;
      return {
        campaign_id: campaignId,
        phone_number: phone_number,
        variable_values: variableValues,
        status: 'pending'
      };
    });

    const { error: callsError } = await supabase
      .from('campaign_calls')
      .insert(campaignCalls);

    if (callsError) {
      console.error('Campaign calls insert error:', callsError);
      return new Response(
        JSON.stringify({ error: 'Failed to create campaign calls' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get VAPI API key from environment
    const vapiToken = Deno.env.get('VAPI_API_KEY');
    
    if (!vapiToken) {
      console.error('VAPI API key not configured');
      return new Response(
        JSON.stringify({ error: 'VAPI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process calls in batches to avoid overwhelming the API
    const batchSize = 5;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < csvData.length; i += batchSize) {
      const batch = csvData.slice(i, i + batchSize);
      
      const promises = batch.map(async (row: any) => {
        try {
          const { phone_number, ...variableValues } = row;
          
          const callPayload = {
            assistantId: assistant.assistant_id,
            phoneNumberId: phoneNumber.phone_number_id,
            customer: {
              number: phone_number
            },
            assistantOverrides: {
              variableValues: variableValues
            }
          };

          const response = await fetch('https://api.vapi.ai/call', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${vapiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(callPayload)
          });

          if (response.ok) {
            const callData = await response.json();
            
            // Update campaign call with VAPI call ID
            await supabase
              .from('campaign_calls')
              .update({ 
                call_id: callData.id,
                status: 'calling'
              })
              .eq('campaign_id', campaignId)
              .eq('phone_number', phone_number);

            successCount++;
            console.log(`Call initiated for ${phone_number}`);
          } else {
            const errorData = await response.json();
            console.error(`Failed to call ${phone_number}:`, errorData);
            
            // Update campaign call status to failed
            await supabase
              .from('campaign_calls')
              .update({ status: 'failed' })
              .eq('campaign_id', campaignId)
              .eq('phone_number', phone_number);

            failCount++;
          }
        } catch (error) {
          console.error(`Error calling ${row.phone_number}:`, error);
          failCount++;
        }
      });

      await Promise.all(promises);
      
      // Add a small delay between batches
      if (i + batchSize < csvData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Update campaign with final counts
    await supabase
      .from('campaigns')
      .update({ 
        completed_calls: successCount,
        failed_calls: failCount,
        status: successCount > 0 ? 'running' : 'failed'
      })
      .eq('id', campaignId);

    console.log(`Campaign ${campaignId} processed: ${successCount} successful, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Campaign started successfully. ${successCount} calls initiated, ${failCount} failed.`,
        successCount,
        failCount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('Error starting campaign:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to start campaign',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
