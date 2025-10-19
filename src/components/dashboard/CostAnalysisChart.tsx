
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getCostAnalysisData } from '@/services/callReportsService';

interface CostAnalysisChartProps {
  filters?: any;
}

export function CostAnalysisChart({ filters }: CostAnalysisChartProps) {
  const { data: costData = [], isLoading } = useQuery({
    queryKey: ['cost-analysis', filters],
    queryFn: () => getCostAnalysisData(filters),
    refetchInterval: 30000,
  });

  const getChartTitle = () => {
    if (filters?.agent && filters.agent !== 'all') {
      return `Cost Analysis - ${filters.agent}`;
    }
    return 'Cost Analysis Trends';
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
          <BarChart data={costData}>
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
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost']}
            />
            <Bar 
              dataKey="cost" 
              fill="hsl(var(--accent))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
