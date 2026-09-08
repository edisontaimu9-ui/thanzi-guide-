import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { LoadingRunner } from '@/components/LoadingRunner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingRunner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
