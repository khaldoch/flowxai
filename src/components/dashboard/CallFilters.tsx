
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchCampaigns, fetchAssistants } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';
import { fetchCallReports } from '@/services/callReportsService';

// All data is now dynamic - no hardcoded agents or structured data!

interface CallFiltersProps {
  onFiltersChange: (filters: any) => void;
}

export function CallFilters({ onFiltersChange }: CallFiltersProps) {
  const { userRole, clientId } = useAuth();
  const [filters, setFilters] = useState({
    agent: 'all',
    callType: 'all',
    status: 'all',
    sentiment: 'all',
    fromNumber: '',
    toNumber: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    structuredData: {} as Record<string, any>,
    campaignId: 'all' as string | 'all'
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [availableStructuredFields, setAvailableStructuredFields] = useState<Record<string, any>>({});

  // Fetch assistants based on user role and client ID
  const { data: assistants = [] } = useQuery({
    queryKey: ['assistants', userRole === 'client' ? clientId : undefined],
    queryFn: () => fetchAssistants(userRole === 'client' ? clientId : undefined),
    enabled: !!clientId || userRole === 'admin'
  });

  // Fetch campaigns based on user role and client ID
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns', userRole === 'client' ? clientId : undefined],
    queryFn: () => fetchCampaigns(userRole === 'client' ? clientId : undefined),
    enabled: !!clientId || userRole === 'admin'
  });

  // Fetch call reports to extract dynamic structured data fields
  const { data: callReports = [] } = useQuery({
    queryKey: ['call-reports-for-fields', userRole === 'client' ? clientId : undefined],
    queryFn: () => {
      console.log('Fetching call reports for structured fields...');
      return fetchCallReports({ 
        clientId: userRole === 'client' ? clientId : undefined 
      });
    },
    enabled: !!clientId || userRole === 'admin'
  });

  // Log when call reports change
  useEffect(() => {
    console.log('Call reports updated:', callReports.length, 'calls');
  }, [callReports]);

  // Extract dynamic structured data fields from actual call reports
  const extractStructuredDataFields = useCallback(() => {
    const fieldsMap = new Map<string, Set<any>>();
    
    // Filter call reports by selected agent if specified
    const relevantCalls = filters.agent && filters.agent !== 'all' 
      ? callReports.filter((call: any) => call.agent === filters.agent)
      : callReports;
    
    // Extract all structured data fields and their unique values
    relevantCalls.forEach((call: any) => {
      if (call.structured_data && typeof call.structured_data === 'object') {
        Object.entries(call.structured_data).forEach(([field, value]) => {
          if (!fieldsMap.has(field)) {
            fieldsMap.set(field, new Set());
          }
          if (value !== null && value !== undefined && value !== '') {
            fieldsMap.get(field)!.add(value);
          }
        });
      }
    });
    
    // Convert to the format expected by the UI
    const fields: Record<string, any> = {};
    fieldsMap.forEach((values, field) => {
      const uniqueValues = Array.from(values);
      // If there are multiple unique values (and not too many), treat as options
      if (uniqueValues.length > 1 && uniqueValues.length <= 20) {
        fields[field] = ['string', uniqueValues];
      } else {
        // Otherwise, treat as free text field
        fields[field] = ['string', []];
      }
    });
    
    return fields;
  }, [callReports, filters.agent]);

  // Update available structured data fields when agent changes or call reports load
  useEffect(() => {
    const dynamicFields = extractStructuredDataFields();
    console.log('Updating structured fields for agent:', filters.agent, 'Fields found:', dynamicFields);
    setAvailableStructuredFields(dynamicFields);
  }, [extractStructuredDataFields, filters.agent]);

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
  };

  const applyFilters = useCallback(() => {
    // Convert 'all' values to empty strings for the API
    const apiFilters = { ...filters };
    Object.keys(apiFilters).forEach(key => {
      if (apiFilters[key] === 'all') {
        apiFilters[key] = '';
      }
    });
    
    setAppliedFilters(filters);
    onFiltersChange(apiFilters);
  }, [filters, onFiltersChange]);

  const clearFilters = () => {
    const clearedFilters = {
      agent: 'all',
      callType: 'all',
      status: 'all',
      sentiment: 'all',
      fromNumber: '',
      toNumber: '',
      dateFrom: null,
      dateTo: null,
      structuredData: {},
      campaignId: 'all' as const,
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    
    // Convert for API
    const apiFilters = { ...clearedFilters } as any;
    Object.keys(apiFilters).forEach(key => {
      if (apiFilters[key] === 'all') {
        apiFilters[key] = '';
      }
    });
    
    onFiltersChange(apiFilters);
  };

  // Auto-apply filters when agent changes (for better UX)
  useEffect(() => {
    if (filters.agent !== appliedFilters.agent) {
      applyFilters();
    }
  }, [filters.agent, appliedFilters.agent, applyFilters]);

  // Check if filters have been modified
  const hasUnappliedChanges = JSON.stringify(filters) !== JSON.stringify(appliedFilters);

  const updateStructuredData = (field: string, value: string) => {
    const newStructuredData = { ...filters.structuredData };
    if (value && value !== 'all') {
      newStructuredData[field] = value;
    } else {
      delete newStructuredData[field];
    }
    updateFilters({ structuredData: newStructuredData });
  };


  return (
    <Card className="analytics-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={hasUnappliedChanges ? "default" : "outline"} 
              size="sm" 
              onClick={applyFilters}
              disabled={!hasUnappliedChanges}
            >
              <Filter className="h-4 w-4 mr-1" />
              Apply Filters
            </Button>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Agent Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Agent</label>
            <Select value={filters.agent} onValueChange={(value) => updateFilters({ agent: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {assistants.map((assistant: any) => (
                  <SelectItem key={assistant.id} value={assistant.name}>{assistant.name}</SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>

            {/* Campaign Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign</label>
              <Select value={filters.campaignId} onValueChange={(value) => updateFilters({ campaignId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          {/* Call Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Call Type</label>
            <Select value={filters.callType} onValueChange={(value) => updateFilters({ callType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="customer-ended-call">Customer Ended</SelectItem>
                <SelectItem value="assistant-ended-call">Assistant Ended</SelectItem>
                <SelectItem value="customer-did-not-answer">No Answer</SelectItem>
                <SelectItem value="customer-busy">Busy</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sentiment Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sentiment</label>
            <Select value={filters.sentiment} onValueChange={(value) => updateFilters({ sentiment: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Sentiments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sentiments</SelectItem>
                <SelectItem value="positive">Positive</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="negative">Negative</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone Number Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium">From Number</label>
            <Input
              placeholder="Search from number..."
              value={filters.fromNumber}
              onChange={(e) => updateFilters({ fromNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To Number</label>
            <Input
              placeholder="Search to number..."
              value={filters.toNumber}
              onChange={(e) => updateFilters({ toNumber: e.target.value })}
            />
          </div>
        </div>

        {/* Date Range Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom || undefined}
                  onSelect={(date) => updateFilters({ dateFrom: date || null })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateTo || undefined}
                  onSelect={(date) => updateFilters({ dateTo: date || null })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Structured Data Filters */}
        {Object.keys(availableStructuredFields).length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Structured Data Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(availableStructuredFields).map(([field, fieldData]) => {
                // Handle both array format [type, options] and direct options array
                const isArrayFormat = Array.isArray(fieldData) && fieldData.length === 2;
                const type = isArrayFormat ? fieldData[0] : 'string';
                const options = isArrayFormat ? fieldData[1] : (Array.isArray(fieldData) ? fieldData : []);
                
                return (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">
                      {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                    {options && Array.isArray(options) && options.length > 0 ? (
                    <Select 
                      value={filters.structuredData[field] || 'all'} 
                      onValueChange={(value) => updateStructuredData(field, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`All ${field.replace(/_/g, ' ')}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {options.map(option => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={`Search ${field.replace(/_/g, ' ')}...`}
                      value={filters.structuredData[field] || ''}
                      onChange={(e) => updateStructuredData(field, e.target.value)}
                    />
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
