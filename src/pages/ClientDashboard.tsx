
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { BatchCallingForm } from '@/components/campaigns/BatchCallingForm';

import Dashboard from './Dashboard';

export default function ClientDashboard() {
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

  if (userRole === 'admin') {
    return <Navigate to="/master" replace />;
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
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Call Analytics Dashboard
                </h1>
                <p className="text-gray-600">
                  Monitor and manage your AI agent call performance
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
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="campaigns">Batch Calling</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <Dashboard />
          </TabsContent>

          <TabsContent value="campaigns">
            <BatchCallingForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
