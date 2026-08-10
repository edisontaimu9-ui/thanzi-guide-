import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

const ADMIN_ROLES = ['EDITOR', 'NUTRITION_EXPERT', 'ADMIN'];

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-brand-500">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile || !ADMIN_ROLES.includes(profile.role)) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-brand-700">Not authorized</h1>
        <p className="mt-2 text-brand-500">
          This area is for editors, nutrition experts, and admins. Ask an admin to update your role
          if you think this is a mistake.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
