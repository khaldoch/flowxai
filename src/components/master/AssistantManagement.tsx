
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Bot, Edit, Trash2 } from 'lucide-react';
import { fetchAssistants, createAssistant, updateAssistant, deleteAssistant, fetchClients, getDefaultClientId, type Assistant, type Client } from '@/services/adminService';
import { toast } from 'sonner';

export function AssistantManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState({ 
    name: '', 
    assistant_id: '', 
    client_id: '', 
    structured_data: '{}' 
  });
  const queryClient = useQueryClient();

  // Get the default client ID and set it as initial selection
  useEffect(() => {
    const loadClientId = async () => {
      const defaultClientId = await getDefaultClientId();
      setSelectedClientId(defaultClientId);
      setFormData(prev => ({ ...prev, client_id: defaultClientId }));
    };
    loadClientId();
  }, []);

  // Fetch all clients for the selector
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const { data: assistants = [], isLoading } = useQuery({
    queryKey: ['assistants', selectedClientId],
    queryFn: () => fetchAssistants(selectedClientId),
    enabled: !!selectedClientId,
  });

  const createMutation = useMutation({
    mutationFn: createAssistant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Assistant created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assistant');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Assistant> }) => updateAssistant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      setEditingAssistant(null);
      resetForm();
      toast.success('Assistant updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update assistant');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAssistant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assistants'] });
      toast.success('Assistant deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete assistant');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', assistant_id: '', client_id: selectedClientId, structured_data: '{}' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedData = JSON.parse(formData.structured_data);
      const submitData = { ...formData, structured_data: parsedData };
      
      if (editingAssistant) {
        updateMutation.mutate({ id: editingAssistant.id, data: submitData });
      } else {
        createMutation.mutate(submitData);
      }
    } catch (error) {
      toast.error('Invalid JSON in structured data');
    }
  };

  const openEditDialog = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setFormData({
      name: assistant.name,
      assistant_id: assistant.assistant_id,
      client_id: assistant.client_id,
      structured_data: JSON.stringify(assistant.structured_data || {}, null, 2)
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this assistant?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleClientChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    setFormData(prev => ({ ...prev, client_id: newClientId }));
  };

  const selectedClient = clients.find(client => client.id === selectedClientId);

  if (!selectedClientId) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Assistant Management
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
          <Button onClick={() => { setEditingAssistant(null); resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Assistant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading assistants...</div>
        ) : (
          (() => {
            const uniqueAssistants = Array.from(new Map(assistants.map(a => [a.assistant_id, a])).values());
            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Assistant ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueAssistants.map((assistant) => (
                    <TableRow key={assistant.id}>
                      <TableCell className="font-medium">{assistant.name}</TableCell>
                      <TableCell className="font-mono text-sm">{assistant.assistant_id}</TableCell>
                      <TableCell>
                        <Badge variant={assistant.is_active ? "default" : "secondary"}>
                          {assistant.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(assistant.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(assistant)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(assistant.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()
        )}

        <Dialog open={isCreateDialogOpen || !!editingAssistant} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingAssistant(null);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAssistant ? 'Edit Assistant' : 'Create New Assistant'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Assistant Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter assistant name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assistant_id">Assistant ID</Label>
                <Input
                  id="assistant_id"
                  value={formData.assistant_id}
                  onChange={(e) => setFormData({ ...formData, assistant_id: e.target.value })}
                  placeholder="Enter assistant ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="structured_data">Structured Data (JSON)</Label>
                <Textarea
                  id="structured_data"
                  value={formData.structured_data}
                  onChange={(e) => setFormData({ ...formData, structured_data: e.target.value })}
                  placeholder="Enter structured data configuration as JSON"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Define the structured data configuration for this assistant in JSON format
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 
                  (editingAssistant ? 'Updating...' : 'Creating...') : 
                  (editingAssistant ? 'Update Assistant' : 'Create Assistant')
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
