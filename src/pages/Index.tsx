
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function Index() {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) {
    if (userRole === 'admin') {
      return <Navigate to="/master" replace />;
    } else {
      return <Navigate to="/client" replace />;
    }
  }

  return <Navigate to="/auth" replace />;
}
