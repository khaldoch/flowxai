
import { supabase } from "@/integrations/supabase/client";

export interface Client {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Assistant {
  id: string;
  name: string;
  assistant_id: string;
  client_id: string;
  created_at: string;
  is_active: boolean;
  structured_data?: any;
}

export interface PhoneNumber {
  id: string;
  name: string;
  phone_number: string;
  phone_number_id: string;
  client_id: string;
  created_at: string;
  is_active: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  client_id: string;
  assistant_id: string;
  phone_number_id: string;
  csv_file_name: string;
  total_numbers: number;
  completed_calls: number;
  failed_calls: number;
  status: string;
  created_at: string;
  updated_at: string;
}

// Get the default client ID (FlowAIx Client)
export const getDefaultClientId = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('email', 'client@flowaix.com')
    .single();

  if (error) {
    console.error('Error fetching default client:', error);
    return '550e8400-e29b-41d4-a716-446655440000'; // fallback to seeded ID
  }

  return data.id;
};

export const fetchClients = async (): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }

  return data || [];
};

export const createClient = async (clientData: { name: string; email: string; password: string }): Promise<Client> => {
  // First create the auth user using the Edge Function
  const { data: authResponse, error: authError } = await supabase.functions.invoke('create-user', {
    body: {
      email: clientData.email,
      password: clientData.password,
      name: clientData.name
    }
  });

  if (authError || !authResponse?.success) {
    console.error('Error creating auth user:', authError || authResponse?.error);
    throw new Error(`Failed to create user account: ${authError?.message || authResponse?.error || 'Unknown error'}`);
  }

  // Then create the client record in the database
  const { data, error } = await supabase
    .from('clients')
    .insert([{
      name: clientData.name,
      email: clientData.email
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw error;
  }

  return data;
};

export const updateClient = async (id: string, clientData: Partial<Client>): Promise<Client> => {
  const { data, error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw error;
  }

  return data;
};

export const fetchAssistants = async (clientId?: string): Promise<Assistant[]> => {
  let query = supabase
    .from('assistants')
    .select('*')
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching assistants:', error);
    throw error;
  }

  return data || [];
};

export const createAssistant = async (assistantData: {
  name: string;
  assistant_id: string;
  client_id: string;
  structured_data?: any;
}): Promise<Assistant> => {
  const { data, error } = await supabase
    .from('assistants')
    .insert([assistantData])
    .select()
    .single();

  if (error) {
    console.error('Error creating assistant:', error);
    throw error;
  }

  return data;
};

export const updateAssistant = async (id: string, assistantData: Partial<Assistant>): Promise<Assistant> => {
  const { data, error } = await supabase
    .from('assistants')
    .update(assistantData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating assistant:', error);
    throw error;
  }

  return data;
};

export const deleteAssistant = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('assistants')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting assistant:', error);
    throw error;
  }
};

export const fetchPhoneNumbers = async (clientId?: string): Promise<PhoneNumber[]> => {
  let query = supabase
    .from('phone_numbers')
    .select('*')
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching phone numbers:', error);
    throw error;
  }

  return data || [];
};

export const createPhoneNumber = async (phoneData: {
  name: string;
  phone_number: string;
  phone_number_id: string;
  client_id: string;
}): Promise<PhoneNumber> => {
  const { data, error } = await supabase
    .from('phone_numbers')
    .insert([phoneData])
    .select()
    .single();

  if (error) {
    console.error('Error creating phone number:', error);
    throw error;
  }

  return data;
};

export const updatePhoneNumber = async (id: string, phoneData: Partial<PhoneNumber>): Promise<PhoneNumber> => {
  const { data, error } = await supabase
    .from('phone_numbers')
    .update(phoneData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating phone number:', error);
    throw error;
  }

  return data;
};

export const deletePhoneNumber = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('phone_numbers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting phone number:', error);
    throw error;
  }
};

export const fetchCampaigns = async (clientId?: string): Promise<Campaign[]> => {
  let query = supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }

  return data || [];
};

export const createCampaign = async (campaignData: {
  name: string;
  client_id: string;
  assistant_id: string;
  phone_number_id: string;
  csv_file_name: string;
  total_numbers: number;
}): Promise<Campaign> => {
  const { data, error } = await supabase
    .from('campaigns')
    .insert([campaignData])
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }

  return data;
};

export const updateCampaignStatus = async (id: string, status: string): Promise<Campaign> => {
  const { data, error } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating campaign status:', error);
    throw error;
  }

  return data;
};
