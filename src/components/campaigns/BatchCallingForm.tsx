import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Upload, Phone, AlertCircle } from 'lucide-react';
import { fetchAssistants, fetchPhoneNumbers, getDefaultClientId } from '@/services/adminService';
import { createCampaign, startCampaign, parseCSV } from '@/services/batchCallingService';
import { toast } from 'sonner';

export function BatchCallingForm() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<Record<string, any>[]>([]);
  const [formData, setFormData] = useState({
    campaignName: '',
    assistantId: '',
    phoneNumberId: ''
  });
  const [clientId, setClientId] = useState<string>('');
  const queryClient = useQueryClient();

  // Get default client ID
  useEffect(() => {
    const loadClientId = async () => {
      try {
        const defaultClientId = await getDefaultClientId();
        setClientId(defaultClientId);
        console.log('Loaded client ID:', defaultClientId);
      } catch (error) {
        console.error('Error loading client ID:', error);
        toast.error('Failed to load client data');
      }
    };
    loadClientId();
  }, []);

  const { data: assistants = [] } = useQuery({
    queryKey: ['assistants'],
    queryFn: () => fetchAssistants(),
    enabled: true,
  });

  const { data: phoneNumbers = [] } = useQuery({
    queryKey: ['phoneNumbers', clientId],
    queryFn: () => fetchPhoneNumbers(clientId),
    enabled: !!clientId,
  });

  const createCampaignMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: async (campaign) => {
      toast.success('Campaign created successfully!');
      
      // Start the campaign
      try {
        await startCampaign(campaign.id, csvData);
        toast.success('Campaign started successfully!');
      } catch (error: any) {
        toast.error(`Failed to start campaign: ${error.message}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const data = parseCSV(csvText);
        setCsvData(data);
        toast.success(`CSV loaded successfully! ${data.length} records found.`);
      } catch (error: any) {
        toast.error(error.message);
        setCsvFile(null);
        setCsvData([]);
      }
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setFormData({ campaignName: '', assistantId: '', phoneNumberId: '' });
    setCsvFile(null);
    setCsvData([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.campaignName || !formData.assistantId || !formData.phoneNumberId) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!csvFile || csvData.length === 0) {
      toast.error('Please upload a valid CSV file');
      return;
    }

    createCampaignMutation.mutate({
      campaignName: formData.campaignName,
      assistantId: formData.assistantId,
      phoneNumberId: formData.phoneNumberId,
      csvData,
      csvFileName: csvFile.name
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Batch Calling Campaigns
          </CardTitle>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No active campaigns. Create a new campaign to start batch calling.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Batch Calling Campaign</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignName">Campaign Name</Label>
                  <Input
                    id="campaignName"
                    value={formData.campaignName}
                    onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="assistant">Select AI Assistant</Label>
                  <Select
                    value={formData.assistantId}
                    onValueChange={(value) => setFormData({ ...formData, assistantId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an assistant" />
                    </SelectTrigger>
                    <SelectContent>
                      {assistants.map((assistant) => (
                        <SelectItem key={assistant.id} value={assistant.id}>
                          {assistant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Select Phone Number</Label>
                <Select
                  value={formData.phoneNumberId}
                  onValueChange={(value) => setFormData({ ...formData, phoneNumberId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneNumbers.map((phone) => (
                      <SelectItem key={phone.id} value={phone.id}>
                        {phone.name} ({phone.phone_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csvFile">Upload CSV File</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="flex-1"
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Your CSV file must contain a "phone_number" column so we can detect your customers' numbers. 
                    All other CSV headers will be available as variables for your AI assistant.
                  </AlertDescription>
                </Alert>
              </div>

              {csvData.length > 0 && (
                <div className="space-y-2">
                  <Label>CSV Preview ({csvData.length} records)</Label>
                  <div className="border rounded-md max-h-60 overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(csvData[0]).map((header) => (
                            <TableHead key={header} className="text-xs">
                              {header}
                              {header.toLowerCase().includes('phone') && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                  PHONE
                                </Badge>
                              )}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.slice(0, 5).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: any, cellIndex) => (
                              <TableCell key={cellIndex} className="text-xs">
                                {String(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                        {csvData.length > 5 && (
                          <TableRow>
                            <TableCell colSpan={Object.keys(csvData[0]).length} className="text-center text-muted-foreground text-xs">
                              ... and {csvData.length - 5} more records
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCampaignMutation.isPending || !csvFile}
                >
                  {createCampaignMutation.isPending ? 'Creating...' : 'Create & Start Campaign'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}