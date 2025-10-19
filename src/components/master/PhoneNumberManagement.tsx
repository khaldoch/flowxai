
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Phone, Edit, Trash2 } from 'lucide-react';
import { fetchPhoneNumbers, createPhoneNumber, updatePhoneNumber, deletePhoneNumber, fetchClients, getDefaultClientId, type PhoneNumber, type Client } from '@/services/adminService';
import { toast } from 'sonner';

export function PhoneNumberManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPhoneNumber, setEditingPhoneNumber] = useState<PhoneNumber | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [formData, setFormData] = useState({ 
    name: '', 
    phone_number: '', 
    phone_number_id: '', 
    client_id: '' 
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

  const { data: phoneNumbers = [], isLoading } = useQuery({
    queryKey: ['phone-numbers', selectedClientId],
    queryFn: () => fetchPhoneNumbers(selectedClientId),
    enabled: !!selectedClientId,
  });

  const createMutation = useMutation({
    mutationFn: createPhoneNumber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success('Phone number created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create phone number');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PhoneNumber> }) => updatePhoneNumber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
      setEditingPhoneNumber(null);
      resetForm();
      toast.success('Phone number updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update phone number');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePhoneNumber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
      toast.success('Phone number deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete phone number');
    },
  });

  const resetForm = () => {
    setFormData({ name: '', phone_number: '', phone_number_id: '', client_id: selectedClientId });
  };

  const handleClientChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    setFormData(prev => ({ ...prev, client_id: newClientId }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPhoneNumber) {
      updateMutation.mutate({ id: editingPhoneNumber.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openEditDialog = (phoneNumber: PhoneNumber) => {
    setEditingPhoneNumber(phoneNumber);
    setFormData({
      name: phoneNumber.name,
      phone_number: phoneNumber.phone_number,
      phone_number_id: phoneNumber.phone_number_id,
      client_id: phoneNumber.client_id
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this phone number?')) {
      deleteMutation.mutate(id);
    }
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
              Phone Number Management
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
          <Button onClick={() => { setEditingPhoneNumber(null); resetForm(); setIsCreateDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Phone Number
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading phone numbers...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Phone Number ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {phoneNumbers.map((phoneNumber) => (
                <TableRow key={phoneNumber.id}>
                  <TableCell className="font-medium">{phoneNumber.name}</TableCell>
                  <TableCell>{phoneNumber.phone_number}</TableCell>
                  <TableCell className="font-mono text-sm">{phoneNumber.phone_number_id}</TableCell>
                  <TableCell>
                    <Badge variant={phoneNumber.is_active ? "default" : "secondary"}>
                      {phoneNumber.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(phoneNumber.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(phoneNumber)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(phoneNumber.id)}
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
        )}

        <Dialog open={isCreateDialogOpen || !!editingPhoneNumber} onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setEditingPhoneNumber(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingPhoneNumber ? 'Edit Phone Number' : 'Create New Phone Number'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Phone Number Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter phone number name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Enter phone number (e.g., +1234567890)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone_number_id">Phone Number ID</Label>
                <Input
                  id="phone_number_id"
                  value={formData.phone_number_id}
                  onChange={(e) => setFormData({ ...formData, phone_number_id: e.target.value })}
                  placeholder="Enter phone number ID"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 
                  (editingPhoneNumber ? 'Updating...' : 'Creating...') : 
                  (editingPhoneNumber ? 'Update Phone Number' : 'Create Phone Number')
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
