import { supabase } from '@/integrations/supabase/client';

export interface BatchCallData {
  campaignName: string;
  assistantId: string;
  phoneNumberId: string;
  csvData: Record<string, any>[];
  csvFileName: string;
}

export interface VapiCallRequest {
  assistantId: string;
  phoneNumberId: string;
  customer: {
    number: string;
  };
  assistantOverrides: {
    variableValues: Record<string, any>;
  };
}

export const createCampaign = async (data: BatchCallData) => {
  let resolvedClientId: string | null = null;
  try {
    const { data: clientData } = await supabase
      .from('users')
      .select('client_id')
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    resolvedClientId = clientData?.client_id ?? null;
  } catch (e) {
    resolvedClientId = null;
  }

  // Create campaign record
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      name: data.campaignName,
      client_id: resolvedClientId,
      assistant_id: data.assistantId,
      phone_number_id: data.phoneNumberId,
      csv_file_name: data.csvFileName,
      total_numbers: data.csvData.length,
      status: 'pending'
    })
    .select()
    .single();

  if (campaignError) {
    throw new Error(`Failed to create campaign: ${campaignError.message}`);
  }

  const campaignCalls = data.csvData.map(row => ({
    campaign_id: campaign.id,
    phone_number: row.phone_number || row['phone number'] || row.Phone || row.PHONE || row.phoneNumber,
    variable_values: row,
    status: 'pending'
  }));

  const { error: callsError } = await supabase
    .from('campaign_calls')
    .insert(campaignCalls);

  if (callsError) {
    throw new Error(`Failed to create campaign calls: ${callsError.message}`);
  }

  return campaign;
};

export const startCampaign = async (campaignId: string, csvData: Record<string, any>[]) => {
  console.log('Starting campaign with ID:', campaignId);
  console.log('CSV data length:', csvData.length);
  
  // Call the start-campaign edge function
  const { data, error } = await supabase.functions.invoke('start-campaign', {
    body: { campaignId, csvData }
  });

  if (error) {
    console.error('Start campaign error:', error);
    throw new Error(`Failed to start campaign: ${error.message}`);
  }

  return data;
};

export const parseCSV = (csvText: string): Record<string, any>[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least header and one data row');
  }

  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  
  // Check if CSV has phone_number column
  const phoneColumns = ['phone_number', 'phone number', 'Phone', 'PHONE', 'phoneNumber'];
  const hasPhoneColumn = headers.some(header => 
    phoneColumns.some(phoneCol => 
      header.toLowerCase().includes(phoneCol.toLowerCase())
    )
  );

  if (!hasPhoneColumn) {
    throw new Error('CSV must contain a "phone_number" column (or similar variant)');
  }

  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
    const row: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });

  return data;
};