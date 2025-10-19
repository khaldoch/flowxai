import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchCallReports } from '@/services/callReportsService';
import { Button } from '@/components/ui/button';

export function CallReportsDebug() {
  const { data: callReports = [], isLoading, error, refetch } = useQuery({
    queryKey: ['call-reports-debug'],
    queryFn: () => fetchCallReports(),
    refetchInterval: 5000, // Auto refresh every 5 seconds
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Call Reports Debug</CardTitle>
          <Button onClick={() => refetch()} size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <p>Loading call reports...</p>}
        {error && (
          <div className="text-destructive">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}
        <div className="space-y-2">
          <p>Total call reports found: {callReports.length}</p>
          {callReports.length > 0 && (
            <div className="max-h-60 overflow-auto space-y-2">
              {callReports.slice(0, 5).map((report) => (
                <div key={report.id} className="border p-2 rounded text-sm">
                  <div><strong>Call ID:</strong> {report.call_id}</div>
                  <div><strong>Agent:</strong> {report.agent}</div>
                  <div><strong>From:</strong> {report.from_number}</div>
                  <div><strong>To:</strong> {report.to_number}</div>
                  <div><strong>Status:</strong> {report.status}</div>
                  <div><strong>Duration:</strong> {report.duration_minutes} min</div>
                  <div><strong>Cost:</strong> ${report.cost.toFixed(4)}</div>
                  <div><strong>Created:</strong> {new Date(report.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}