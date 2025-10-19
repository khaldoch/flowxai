
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsCard } from '@/components/dashboard/AnalyticsCard';
import { CallVolumeChart } from '@/components/dashboard/CallVolumeChart';
import { CostAnalysisChart } from '@/components/dashboard/CostAnalysisChart';
import { DisconnectionChart } from '@/components/dashboard/DisconnectionChart';
import { CallFilters } from '@/components/dashboard/CallFilters';
import { CallsTable } from '@/components/dashboard/CallsTable';
import { CallPickupRate } from '@/components/dashboard/CallPickupRate';
import { Phone, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { getDashboardMetrics } from '@/services/callReportsService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Filters {
  agent?: string;
  callType?: string;
  status?: string;
  sentiment?: string;
  fromNumber?: string;
  toNumber?: string;
  dateFrom?: Date;
  dateTo?: Date;
  structuredData?: Record<string, any>;
}

export default function Dashboard() {
  const [filters, setFilters] = useState<Filters>({});
  const { userRole, clientId } = useAuth();

  // Fetch client information to get the client name
  const { data: clientInfo } = useQuery({
    queryKey: ['client-info', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const { data, error } = await supabase.from('clients').select('name').eq('id', clientId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && userRole === 'client'
  });

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
    console.log('Filters updated:', newFilters);
  };

  // Prepare filters with client ID for client users
  const enhancedFilters = useMemo(() => {
    if (userRole === 'client' && clientId) {
      return { ...filters, clientId };
    }
    return filters;
  }, [filters, userRole, clientId]);

  // Fetch real metrics
  const { data: metrics = { totalCalls: 0, totalMinutes: 0, totalCost: 0, avgCostPerCall: 0 } } = useQuery({
    queryKey: ['dashboard-metrics', enhancedFilters],
    queryFn: () => getDashboardMetrics(enhancedFilters),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-3xl font-bold gradient-text mb-2">
            {userRole === 'admin' 
              ? "FlowAIx's Call Analytics Dashboard" 
              : `${clientInfo?.name || 'Client'} Call Analytics Dashboard`
            }
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze your AI agent call performance with advanced filtering and insights
          </p>
        </div>

        {/* Filters */}
        <CallFilters onFiltersChange={handleFiltersChange} />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
          <AnalyticsCard
            title="Total Calls"
            value={metrics.totalCalls.toLocaleString()}
            subtitle={`${Math.floor(metrics.totalMinutes / 60)} hrs total`}
            icon={<Phone className="h-5 w-5" />}
            variant="analytics"
          />
          <AnalyticsCard
            title="Total Minutes"
            value={metrics.totalMinutes.toLocaleString()}
            subtitle={`${Math.floor(metrics.totalMinutes / 60)} hrs total`}
            icon={<Clock className="h-5 w-5" />}
            variant="success"
          />
          <AnalyticsCard
            title="Total Cost"
            value={`$${metrics.totalCost.toFixed(2)}`}
            subtitle={`$${metrics.avgCostPerCall.toFixed(4)} average`}
            icon={<DollarSign className="h-5 w-5" />}
            variant="warning"
          />
          <AnalyticsCard
            title="Avg Cost/Call"
            value={`$${metrics.avgCostPerCall.toFixed(4)}`}
            subtitle="Per call average"
            icon={<TrendingUp className="h-5 w-5" />}
            variant="default"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CallVolumeChart filters={enhancedFilters} />
          <CostAnalysisChart filters={enhancedFilters} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DisconnectionChart filters={enhancedFilters} />
          <CallPickupRate filters={enhancedFilters} />
        </div>

        {/* Calls Table */}
        <CallsTable filters={enhancedFilters} />
      </div>
    </div>
  );
}
