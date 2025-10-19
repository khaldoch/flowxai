
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getCallOutcomesData } from '@/services/callReportsService';

interface DisconnectionChartProps {
  filters?: any;
}

export function DisconnectionChart({ filters }: DisconnectionChartProps) {
  const { data: outcomeData = [], isLoading } = useQuery({
    queryKey: ['call-outcomes', filters],
    queryFn: () => getCallOutcomesData(filters),
    refetchInterval: 30000,
  });

  const getChartTitle = () => {
    if (filters?.agent && filters.agent !== 'all') {
      return `Call Outcomes - ${filters.agent}`;
    }
    return 'Call Outcome Distribution';
  };

  const statusColors = {
    'Completed': 'hsl(var(--success))',
    'No Answer': 'hsl(var(--warning))',
    'Busy': 'hsl(var(--accent))',
    'Failed': 'hsl(var(--destructive))',
    'Left Voicemail': 'hsl(var(--primary))',
    'Hangup On Voicemail': 'hsl(var(--muted-foreground))'
  };

  const chartData = outcomeData.map(item => ({
    ...item,
    color: statusColors[item.name as keyof typeof statusColors] || 'hsl(var(--muted-foreground))'
  }));

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
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-medium)'
              }}
              formatter={(value, name) => [`${value}% (${chartData.find(d => d.name === name)?.count || 0} calls)`, 'Percentage']}
            />
            <Legend 
              wrapperStyle={{
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
