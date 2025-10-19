import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Phone, PhoneCall, Clock, DollarSign, Eye, Play, MessageSquare, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fetchCallReports, getCallStatusDisplay, getStatusColor, type CallReport } from '@/services/callReportsService';
import { useAuth } from '@/hooks/useAuth';

// Define structured data fields per agent
const agentStructuredFields = {
  'Debt Recovery (Outbound)': ['payment_amount', 'next_payment_date', 'payment_commitment', 'contact_preference'],
  'Vacation Loan Promo (outbound)': ['loan_interest', 'loan_amount', 'qualification_status', 'follow_up_needed'],
  'Loan Payment Reminder (Outbound)': ['payment_status', 'payment_method', 'late_fee_waived', 'next_due_date'],
  'FlowAIx Lead Call (outbound)': ['name', 'timeframe', 'email_address', 'service_interest'],
  'Auto Loan Promo (outbound)': ['loan_interest', 'loan_amount', 'qualification_status', 'follow_up_needed'],
  'all': ['name', 'timeframe', 'email_address', 'service_interest', 'payment_amount', 'loan_interest']
};

interface CallsTableProps {
  filters: any;
}

export function CallsTable({ filters }: CallsTableProps) {
  const [selectedCall, setSelectedCall] = useState<CallReport | null>(null);
  const { userRole, clientId } = useAuth();

  // Prepare filters with client ID for client users
  const enhancedFilters = useMemo(() => {
    if (userRole === 'client' && clientId) {
      return { ...filters, clientId };
    }
    return filters;
  }, [filters, userRole, clientId]);

  // Fetch real call reports from database
  const { data: callReports = [], isLoading, error } = useQuery({
    queryKey: ['call-reports', enhancedFilters],
    queryFn: () => fetchCallReports(enhancedFilters),
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Filter calls based on filters (additional client-side filtering)
  const filteredCalls = useMemo(() => {
    return callReports.filter(call => {
      if (filters.agent && filters.agent !== 'all' && call.agent !== filters.agent) return false;
      if (filters.callType && filters.callType !== 'all' && call.call_type !== filters.callType) return false;
      if (filters.status && filters.status !== 'all' && call.status !== filters.status) return false;
      if (filters.sentiment && filters.sentiment !== 'all' && call.sentiment !== filters.sentiment) return false;
      if (filters.fromNumber && !call.from_number.includes(filters.fromNumber)) return false;
      if (filters.toNumber && !call.to_number.includes(filters.toNumber)) return false;
      
      // Filter by structured data
      if (filters.structuredData) {
        for (const [key, value] of Object.entries(filters.structuredData)) {
          if (value && call.structured_data?.[key] !== value) return false;
        }
      }
      
      return true;
    });
  }, [callReports, filters]);

  // Get dynamic structured data fields based on selected agent
  const visibleStructuredFields = useMemo(() => {
    const selectedAgent = filters.agent || 'all';
    return agentStructuredFields[selectedAgent] || agentStructuredFields['all'];
  }, [filters.agent]);

  const getStatusBadge = (status: string, hasVoicemailMessage?: boolean) => {
    const displayStatus = getCallStatusDisplay(status, hasVoicemailMessage);
    const colorClass = getStatusColor(displayStatus);
    
    let badgeVariant = 'secondary';
    let badgeClassName = colorClass;
    
    if (displayStatus === 'Completed') {
      badgeVariant = 'default';
      badgeClassName = 'text-white'; // Use white text for better readability
    }
    else if (displayStatus === 'Failed') {
      badgeVariant = 'destructive';
      badgeClassName = 'text-white'; // Use white text on red background for better readability
    }
    else if (displayStatus === 'Left Voicemail') {
      badgeVariant = 'default';
      badgeClassName = 'text-white'; // Use white text for better readability
    }
    
    return (
      <Badge variant={badgeVariant as any} className={badgeClassName}>
        {displayStatus}
      </Badge>
    );
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-success';
      case 'negative': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const formatFieldName = (fieldName: string) => {
    return fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/_/g, ' ');
  };

  const renderStructuredDataValue = (value: any) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    if (value === null || value === undefined || value === '') return 'N/A';
    return String(value);
  };

  const formatDuration = (minutes: number) => {
    const mins = Math.floor(minutes);
    const secs = Math.floor((minutes - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="analytics-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Loading call reports...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="analytics-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="text-destructive">Error loading call reports. Please try again.</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="analytics-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Records ({filteredCalls.length} calls)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Cost</TableHead>
                  {visibleStructuredFields.slice(0, 3).map(field => (
                    <TableHead key={field}>{formatFieldName(field)}</TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{format(parseISO(call.started_at), 'MMM dd, yyyy')}</div>
                          <div className="text-muted-foreground">{format(parseISO(call.started_at), 'HH:mm')}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{call.agent}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {call.call_type === 'inbound' ? 
                          <PhoneCall className="h-4 w-4 text-success" /> : 
                          <Phone className="h-4 w-4 text-primary" />
                        }
                        <span className="capitalize">{call.call_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{call.from_number}</TableCell>
                    <TableCell className="text-sm font-mono">{call.to_number}</TableCell>
                    <TableCell>{getStatusBadge(call.status, call.structured_data?.hasVoicemailMessage)}</TableCell>
                    <TableCell>
                      <span className={getSentimentColor(call.sentiment || 'neutral')}>
                        {(call.sentiment || 'neutral').charAt(0).toUpperCase() + (call.sentiment || 'neutral').slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDuration(call.duration_minutes)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        ${call.cost.toFixed(4)}
                      </div>
                    </TableCell>
                    {visibleStructuredFields.slice(0, 3).map(field => (
                      <TableCell key={field} className="text-sm">
                        <span className="font-medium">
                          {renderStructuredDataValue(call.structured_data?.[field])}
                        </span>
                      </TableCell>
                    ))}
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedCall(call)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Call Details - {call.call_id}</DialogTitle>
                          </DialogHeader>
                          
                          {selectedCall && (
                            <div className="space-y-6">
                              {/* Call Overview */}
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <h3 className="font-semibold">Call Information</h3>
                                  <div className="space-y-1 text-sm">
                                    <div>Agent: {selectedCall.agent}</div>
                                    <div>Type: {selectedCall.call_type}</div>
                                    <div>Duration: {formatDuration(selectedCall.duration_minutes)}</div>
                                    <div>Cost: ${selectedCall.cost.toFixed(4)}</div>
                                    <div>Date: {format(parseISO(selectedCall.started_at), 'PPpp')}</div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h3 className="font-semibold">Contact Details</h3>
                                  <div className="space-y-1 text-sm">
                                    <div>From: {selectedCall.from_number}</div>
                                    <div>To: {selectedCall.to_number}</div>
                                    <div>Status: {getStatusBadge(selectedCall.status, selectedCall.structured_data?.hasVoicemailMessage)}</div>
                                    <div>Sentiment: <span className={getSentimentColor(selectedCall.sentiment || 'neutral')}>{selectedCall.sentiment || 'neutral'}</span></div>
                                  </div>
                                </div>
                              </div>

                              {/* Complete Structured Data */}
                              {selectedCall.structured_data && Object.keys(selectedCall.structured_data).length > 0 && (
                                <div>
                                  <h3 className="font-semibold mb-3">Structured Data</h3>
                                  <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                                    {Object.entries(selectedCall.structured_data).map(([key, value]) => (
                                      <div key={key} className="flex justify-between items-center py-1 border-b border-border/30 last:border-b-0">
                                        <span className="text-sm font-medium text-muted-foreground">
                                          {formatFieldName(key)}:
                                        </span>
                                        <span className="text-sm font-medium">
                                          {renderStructuredDataValue(value)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Call Summary */}
                              {selectedCall.summary && (
                                <div>
                                  <h3 className="font-semibold mb-3">Call Summary</h3>
                                  <div className="bg-muted/30 p-4 rounded-lg">
                                    <p className="text-sm">{selectedCall.summary}</p>
                                  </div>
                                </div>
                              )}

                              {/* Transcript */}
                              {selectedCall.transcript && (
                                <div>
                                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Transcript
                                  </h3>
                                  <div className="bg-muted/30 p-4 rounded-lg space-y-3 max-h-60 overflow-y-auto">
                                    <div className="whitespace-pre-wrap text-sm">
                                      {selectedCall.transcript}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Recording */}
                              {selectedCall.recording_url && (
                                <div>
                                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                                    <Play className="h-4 w-4" />
                                    Call Recording
                                  </h3>
                                  <div className="bg-muted/30 p-4 rounded-lg">
                                    <audio controls className="w-full">
                                      <source src={selectedCall.recording_url} type="audio/wav" />
                                      Your browser does not support the audio element.
                                    </audio>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
