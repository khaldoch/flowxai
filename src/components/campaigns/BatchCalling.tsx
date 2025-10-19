
import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Play, Loader2, FileText } from 'lucide-react';
import { fetchAssistants, fetchPhoneNumbers, createCampaign, type Assistant, type PhoneNumber } from '@/services/adminService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function BatchCalling() {
  const { clientId } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    assistant_id: '',
    phone_number_id: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: assistants = [] } = useQuery({
    queryKey: ['assistants', clientId],
    queryFn: () => fetchAssistants(clientId || undefined),
    enabled: !!clientId,
  });

  const { data: phoneNumbers = [] } = useQuery({
    queryKey: ['phone-numbers', clientId],
    queryFn: () => fetchPhoneNumbers(clientId || undefined),
    enabled: !!clientId,
  });

  const createCampaignMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Campaign created successfully!');
      
      // Start the campaign
      startCampaign(campaign.id);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create campaign');
    },
  });

  const startCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase.functions.invoke('start-campaign', {
        body: { campaignId, csvData, formData }
      });

      if (error) {
        toast.error('Failed to start campaign');
        console.error('Campaign start error:', error);
      } else {
        toast.success('Campaign started successfully!');
      }
    } catch (error) {
      toast.error('Failed to start campaign');
      console.error('Campaign start error:', error);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Check if phone_number column exists
        if (!headers.includes('phone_number')) {
          toast.error('CSV must contain a "phone_number" column');
          setCsvFile(null);
          return;
        }
        
        const data = lines.slice(1).filter(line => line.trim()).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        
        setCsvData(data);
        toast.success(`Loaded ${data.length} records from CSV`);
      };
      reader.readAsText(file);
    } else {
      toast.error('Please upload a valid CSV file');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', assistant_id: '', phone_number_id: '' });
    setCsvFile(null);
    setCsvData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!csvFile || csvData.length === 0) {
      toast.error('Please upload a CSV file');
      return;
    }

    if (!clientId) {
      toast.error('Client ID not found');
      return;
    }

    createCampaignMutation.mutate({
      name: formData.name,
      client_id: clientId,
      assistant_id: formData.assistant_id,
      phone_number_id: formData.phone_number_id,
      csv_file_name: csvFile.name,
      total_numbers: csvData.length,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Batch Calling
          </CardTitle>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Batch Campaign</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter campaign name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assistant">Assistant</Label>
                  <Select 
                    value={formData.assistant_id} 
                    onValueChange={(value) => setFormData({ ...formData, assistant_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assistant" />
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

                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Select 
                    value={formData.phone_number_id} 
                    onValueChange={(value) => setFormData({ ...formData, phone_number_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select phone number" />
                    </SelectTrigger>
                    <SelectContent>
                      {phoneNumbers.map((phoneNumber) => (
                        <SelectItem key={phoneNumber.id} value={phoneNumber.id}>
                          {phoneNumber.name} ({phoneNumber.phone_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv">CSV File</Label>
                  <Input
                    id="csv"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    required
                  />
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      CSV must contain a "phone_number" column. Other columns will be used as variable values for personalized calls.
                    </AlertDescription>
                  </Alert>
                </div>

                {csvData.length > 0 && (
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium">CSV Preview:</p>
                    <p className="text-sm text-muted-foreground">
                      {csvData.length} records loaded
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Columns: {Object.keys(csvData[0] || {}).join(', ')}
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createCampaignMutation.isPending || !csvFile}
                >
                  {createCampaignMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Campaign...
                    </>
                  ) : (
                    'Create & Start Campaign'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Ready to start batch calling?</h3>
          <p className="text-muted-foreground mb-4">
            Upload your CSV file and select an assistant to begin your campaign
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            Create New Campaign
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
