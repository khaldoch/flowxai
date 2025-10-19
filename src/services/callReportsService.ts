
import { supabase } from "@/integrations/supabase/client";

export interface CallReport {
  id: string;
  call_id: string;
  agent: string;
  from_number: string;
  to_number: string;
  call_type: 'inbound' | 'outbound';
  status: string;
  sentiment?: string;
  duration_minutes: number;
  cost: number;
  summary?: string;
  transcript?: string;
  recording_url?: string;
  structured_data?: Record<string, any>;
  started_at: string;
  ended_at: string;
  created_at: string;
  client_id?: string;
  has_voicemail_message?: boolean;
}

export interface CallReportsFilters {
  agent?: string;
  callType?: string;
  status?: string;
  sentiment?: string;
  fromNumber?: string;
  toNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  structuredData?: Record<string, any>;
  campaignId?: string;
  clientId?: string;
}

// Status mapping function
export const getCallStatusDisplay = (endedReason: string, hasVoicemailMessage?: boolean): string => {
  switch (endedReason) {
    case 'customer-busy':
      return 'Busy';
    case 'customer-ended-call':
    case 'assistant-ended-call':
      return 'Completed';
    case 'customer-did-not-answer':
      return 'No Answer';
    case 'voicemail':
      return hasVoicemailMessage ? 'Left Voicemail' : 'Hangup On Voicemail';
    case 'failed':
      return 'Failed';
    default:
      return 'Failed';
  }
};

// Get status color for styling
export const getStatusColor = (displayStatus: string): string => {
  switch (displayStatus) {
    case 'Completed':
      return 'text-success';
    case 'Busy':
      return 'text-warning';
    case 'No Answer':
      return 'text-destructive';
    case 'Left Voicemail':
      return 'text-primary';
    case 'Hangup On Voicemail':
      return 'text-accent';
    case 'Failed':
    default:
      return 'text-destructive';
  }
};

// Calculate cost based on duration (0.011 per second, but display in minutes)
export const calculateCallCost = (durationMinutes: number): number => {
  const durationSeconds = durationMinutes * 60;
  return durationSeconds * 0.011;
};

export const fetchCallReports = async (filters: CallReportsFilters = {}): Promise<CallReport[]> => {
  // If filtering by campaign, fetch related call IDs first
  let campaignCallIds: string[] | null = null;
  if (filters.campaignId && filters.campaignId !== 'all') {
    const { data: campaignCalls, error: ccError } = await supabase
      .from('campaign_calls')
      .select('call_id')
      .eq('campaign_id', filters.campaignId)
      .not('call_id', 'is', null);

    if (ccError) {
      console.error('Error fetching campaign call IDs:', ccError);
      return [];
    }
    campaignCallIds = (campaignCalls || []).map((r: any) => r.call_id).filter(Boolean);
    if (!campaignCallIds.length) {
      return [];
    }
  }

  let query = supabase
    .from('call_reports')
    .select('*')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.agent && filters.agent !== 'all') {
    query = query.eq('agent', filters.agent);
  }
  
  // Filter by client_id if provided (for role-based access)
  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }
  
  if (filters.callType && filters.callType !== 'all') {
    query = query.eq('call_type', filters.callType);
  }
  
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  if (filters.sentiment && filters.sentiment !== 'all') {
    query = query.eq('sentiment', filters.sentiment);
  }
  
  if (filters.fromNumber) {
    query = query.ilike('from_number', `%${filters.fromNumber}%`);
  }
  
  if (filters.toNumber) {
    query = query.ilike('to_number', `%${filters.toNumber}%`);
  }
  
  if (filters.dateFrom) {
    query = query.gte('started_at', filters.dateFrom.toISOString());
  }
  
  if (filters.dateTo) {
    query = query.lte('started_at', filters.dateTo.toISOString());
  }

  // Structured data filters
  if (filters.structuredData && Object.keys(filters.structuredData).length > 0) {
    for (const [key, value] of Object.entries(filters.structuredData)) {
      if (value !== undefined && value !== null && value !== '') {
        query = query.contains('structured_data', { [key]: value });
      }
    }
  }

  // Campaign call IDs filter
  if (campaignCallIds) {
    query = query.in('call_id', campaignCallIds);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching call reports:', error);
    throw error;
  }
  
  return (data || []).map(item => ({
    ...item,
    call_type: item.call_type as 'inbound' | 'outbound',
    structured_data: item.structured_data as Record<string, any> | undefined,
    cost: calculateCallCost(item.duration_minutes) // Recalculate cost using our pricing
  }));
};

export const getAgentStats = async () => {
  const { data, error } = await supabase
    .from('call_reports')
    .select('agent, status, duration_minutes');
    
  if (error) {
    console.error('Error fetching agent stats:', error);
    throw error;
  }
  
  return (data || []).map(item => ({
    ...item,
    cost: calculateCallCost(item.duration_minutes)
  }));
};

// Get real dashboard metrics
export const getDashboardMetrics = async (filters: CallReportsFilters = {}) => {
  const callReports = await fetchCallReports(filters);
  
  const totalCalls = callReports.length;
  const totalMinutes = callReports.reduce((sum, call) => sum + call.duration_minutes, 0);
  const totalCost = callReports.reduce((sum, call) => sum + call.cost, 0);
  const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;
  
  return {
    totalCalls,
    totalMinutes,
    totalCost,
    avgCostPerCall
  };
};

// Get call volume data for chart
export const getCallVolumeData = async (filters: CallReportsFilters = {}) => {
  const callReports = await fetchCallReports(filters);
  
  // Group by date
  const volumeData = callReports.reduce((acc, call) => {
    const date = new Date(call.started_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to chart format (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  
  return last7Days.map(date => ({
    name: date.toLocaleDateString('en-US', { weekday: 'short' }),
    calls: volumeData[date.toLocaleDateString()] || 0,
    date: date.toISOString()
  }));
};

// Get call outcomes data for pie chart
export const getCallOutcomesData = async (filters: CallReportsFilters = {}) => {
  const callReports = await fetchCallReports(filters);
  
  const outcomes = callReports.reduce((acc, call) => {
    const displayStatus = getCallStatusDisplay(call.status, call.structured_data?.hasVoicemailMessage);
    acc[displayStatus] = (acc[displayStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const total = callReports.length;
  
  // Ensure we always return some data even if no calls
  const defaultOutcomes = ['Completed', 'No Answer', 'Busy', 'Failed', 'Left Voicemail', 'Hangup On Voicemail'];
  
  const result = Object.entries(outcomes).map(([name, count]) => ({
    name,
    value: total > 0 ? Math.round((count / total) * 100) : 0,
    count,
    color: getStatusColor(name)
  }));
  
  // If no data, return empty state with zero values
  if (result.length === 0) {
    return defaultOutcomes.map(status => ({
      name: status,
      value: 0,
      count: 0,
      color: getStatusColor(status)
    }));
  }
  
  return result;
};

// Get pickup rate data for outbound calls
export const getPickupRateData = async (filters: CallReportsFilters = {}) => {
  const outboundFilters = { ...filters, callType: 'outbound' };
  const callReports = await fetchCallReports(outboundFilters);
  
  const totalCalls = callReports.length;
  const answeredCalls = callReports.filter(call => {
    const status = getCallStatusDisplay(call.status, call.structured_data?.hasVoicemailMessage);
    return status === 'Completed' || status === 'Left Voicemail';
  }).length;
  
  const pickupRate = totalCalls > 0 ? (answeredCalls / totalCalls) * 100 : 0;
  
  return {
    pickupRate: Math.round(pickupRate * 10) / 10, // Round to 1 decimal
    totalCalls,
    answeredCalls,
    missedCalls: totalCalls - answeredCalls
  };
};

// Get cost analysis data for chart
export const getCostAnalysisData = async (filters: CallReportsFilters = {}) => {
  const callReports = await fetchCallReports(filters);
  
  // Group by date
  const costData = callReports.reduce((acc, call) => {
    const date = new Date(call.started_at).toLocaleDateString();
    acc[date] = (acc[date] || 0) + (call.cost || 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to chart format (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date;
  });
  
  return last7Days.map(date => ({
    name: date.toLocaleDateString('en-US', { weekday: 'short' }),
    cost: Math.round((costData[date.toLocaleDateString()] || 0) * 100) / 100, // Round to 2 decimals
    date: date.toISOString()
  }));
};
