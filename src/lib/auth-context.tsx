import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Models } from 'appwrite';
import { account, ID } from './appwrite';
import { ensureProfile, touchLastActive, ProfileDoc } from './profiles';

type ThanziUser = Models.User<Models.Preferences>;

interface AuthContextValue {
  user: ThanziUser | null;
  profile: ProfileDoc | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ThanziUser | null>(null);
  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshInternal(rethrow: boolean) {
    try {
      const current = await account.get();
      setUser(current);
      const currentProfile = await ensureProfile(current.$id, current.name);
      setProfile(currentProfile);
      touchLastActive(currentProfile.$id).catch(() => {});
    } catch (err) {
      setUser(null);
      setProfile(null);
      if (rethrow) throw err;
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    await refreshInternal(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
    await refreshInternal(true);
  }

  async function signup(email: string, password: string, name: string) {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    await refreshInternal(true);
    // BASE_URL is '/thanzi-guide-/' in production and '/' in dev, so this
    // resolves to https://<host>/thanzi-guide-/verify in prod (matching the
    // BrowserRouter basename in App.tsx) and http://localhost:5173/verify
    // locally — either way it lands inside the router, not outside it.
    await account.createVerification(`${window.location.origin}${import.meta.env.BASE_URL}verify`);
  }

  async function logout() {
    await account.deleteSession('current');
    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
