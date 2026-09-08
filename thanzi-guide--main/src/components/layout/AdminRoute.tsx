import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { LoadingRunner } from '@/components/LoadingRunner';

const ADMIN_ROLES = ['EDITOR', 'NUTRITION_EXPERT', 'ADMIN'];

// Appwrite labels are the source of truth for permissions (see README,
// "Roles"). profile.role is just what the app displays and can drift out
// of sync with the console, so a user carrying the admin label should
// always get in here even if nobody remembered to update their profile
// document to match.
const ADMIN_LABELS = ['admin'];

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <LoadingRunner fullScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const hasAdminLabel = user.labels?.some((label) => ADMIN_LABELS.includes(label)) ?? false;
  const hasAdminRole = !!profile && ADMIN_ROLES.includes(profile.role);

  if (!hasAdminLabel && !hasAdminRole) {
    return (
      <main className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Not authorized</h1>
        <p className="mt-2 text-brand-500 dark:text-brand-100">
          This area is for editors, nutrition experts, and admins. Ask an admin to update your role
          if you think this is a mistake.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
