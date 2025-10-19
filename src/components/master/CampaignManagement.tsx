import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Calendar } from 'lucide-react';
import { fetchCampaigns, fetchClients, getDefaultClientId, type Client } from '@/services/adminService';
import { useEffect, useState } from 'react';

export function CampaignManagement() {
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
    const loadClientId = async () => {
      const defaultClientId = await getDefaultClientId();
      setSelectedClientId(defaultClientId);
    };
    loadClientId();
  }, []);

  // Fetch all clients for the selector
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', selectedClientId],
    queryFn: () => fetchCampaigns(selectedClientId),
    enabled: !!selectedClientId,
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'running':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleClientChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
  };

  if (!selectedClientId) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Campaign Management
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="client-select" className="text-sm font-medium">Client:</Label>
              <Select value={selectedClientId} onValueChange={handleClientChange}>
                <SelectTrigger id="client-select" className="w-64">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No campaigns found. Campaigns will appear here after being created from the client dashboard.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Numbers</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Failed</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(campaign.status || 'pending')}>
                      {campaign.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>{campaign.total_numbers || 0}</TableCell>
                  <TableCell>{campaign.completed_calls || 0}</TableCell>
                  <TableCell>{campaign.failed_calls || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}