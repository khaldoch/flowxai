
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getCallVolumeData } from '@/services/callReportsService';

interface CallVolumeChartProps {
  filters?: any;
}

export function CallVolumeChart({ filters }: CallVolumeChartProps) {
  const { data: volumeData = [], isLoading } = useQuery({
    queryKey: ['call-volume', filters],
    queryFn: () => getCallVolumeData(filters),
    refetchInterval: 30000,
  });

  const getChartTitle = () => {
    if (filters?.agent && filters.agent !== 'all') {
      return `Call Volume - ${filters.agent}`;
    }
    return 'Call Volume Trends (Last 7 Days)';
  };

  if (isLoading) {
    return (
      <Card className="chart-container animate-fade-in-up">
        <CardHeader>
          <CardTitle className="gradient-text">{getChartTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-[300px]">
            <div className="text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="chart-container animate-fade-in-up">
      <CardHeader>
        <CardTitle className="gradient-text">{getChartTitle()}</CardTitle>
        {filters?.agent && filters.agent !== 'all' && (
          <p className="text-sm text-muted-foreground">
            Filtered data for {filters.agent}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={volumeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-medium)'
              }}
              formatter={(value) => [`${value}`, 'Calls']}
            />
            <Line 
              type="monotone" 
              dataKey="calls" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: 'hsl(var(--primary-glow))' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
