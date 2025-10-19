
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClientManagement } from '@/components/master/ClientManagement';
import { AssistantManagement } from '@/components/master/AssistantManagement';
import { PhoneNumberManagement } from '@/components/master/PhoneNumberManagement';
import { CampaignManagement } from '@/components/master/CampaignManagement';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function MasterDashboard() {
  const { user, userRole, signOut, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/b13a7451-1d92-41d5-95c4-3e50fe89ba1e.png" 
                alt="FlowAIx Logo" 
                className="h-20 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Master Dashboard
                </h1>
                <p className="text-gray-600">
                  Managing FlowAIx Client Configuration
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clients">Client Management</TabsTrigger>
            <TabsTrigger value="assistants">AI Assistants</TabsTrigger>
            <TabsTrigger value="phone-numbers">Phone Numbers</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <ClientManagement />
          </TabsContent>

          <TabsContent value="assistants" className="space-y-6">
            <AssistantManagement />
          </TabsContent>

          <TabsContent value="phone-numbers" className="space-y-6">
            <PhoneNumberManagement />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <CampaignManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
