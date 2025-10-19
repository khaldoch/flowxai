
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Phone, PhoneOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getPickupRateData } from '@/services/callReportsService';

interface CallPickupRateProps {
  filters?: any;
}

export function CallPickupRate({ filters }: CallPickupRateProps) {
  const { data: pickupData, isLoading } = useQuery({
    queryKey: ['pickup-rate', filters],
    queryFn: () => getPickupRateData(filters),
    refetchInterval: 30000,
  });

  const pickupRate = pickupData?.pickupRate || 0;
  const totalCalls = pickupData?.totalCalls || 0;
  const answeredCalls = pickupData?.answeredCalls || 0;
  const missedCalls = pickupData?.missedCalls || 0;
  
  // Mock improvement for now (could be calculated from historical data)
  const improvement = 5.2;
  
  const getPickupRateColor = (rate: number) => {
    if (rate >= 80) return 'text-success';
    if (rate >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-success';
    if (rate >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  if (isLoading) {
    return (
      <Card className="analytics-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Pickup Rate (Outbound Only)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Loading pickup rate data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="analytics-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Pickup Rate (Outbound Only)
          </span>
          <div className="flex items-center gap-1 text-sm">
            {improvement > 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span className={improvement > 0 ? 'text-success' : 'text-destructive'}>
              {improvement > 0 ? '+' : ''}{improvement}%
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Rate Display */}
        <div className="text-center space-y-2">
          <div className={`text-4xl font-bold ${getPickupRateColor(pickupRate)}`}>
            {pickupRate.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground">
            Overall pickup rate for outbound calls
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Pickup Rate</span>
            <span className="font-medium">{pickupRate.toFixed(1)}%</span>
          </div>
          <div className="relative">
            <Progress value={pickupRate} className="h-3" />
            <div 
              className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor(pickupRate)}`}
              style={{ width: `${Math.min(pickupRate, 100)}%` }}
            />
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-success/10 rounded-lg p-3 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="h-4 w-4 text-success" />
              <span className="text-sm font-medium text-success">Answered</span>
            </div>
            <div className="text-xl font-bold text-success">{answeredCalls.toLocaleString()}</div>
            <div className="text-xs text-success/70">
              {totalCalls > 0 ? ((answeredCalls / totalCalls) * 100).toFixed(1) : 0}% of total
            </div>
          </div>

          <div className="bg-destructive/10 rounded-lg p-3 border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <PhoneOff className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Missed</span>
            </div>
            <div className="text-xl font-bold text-destructive">{missedCalls.toLocaleString()}</div>
            <div className="text-xs text-destructive/70">
              {totalCalls > 0 ? ((missedCalls / totalCalls) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
        </div>

        {/* Total Calls Info */}
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Total Outbound Calls</div>
          <div className="text-lg font-medium">{totalCalls.toLocaleString()}</div>
        </div>

        {/* Improvement Indicator */}
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">vs. Last Period</div>
          <div className={`text-sm font-medium flex items-center justify-center gap-1 ${
            improvement > 0 ? 'text-success' : 'text-destructive'
          }`}>
            {improvement > 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {improvement > 0 ? '+' : ''}{improvement}% improvement
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
