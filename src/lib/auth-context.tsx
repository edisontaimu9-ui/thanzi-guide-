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

  async function refresh() {
    try {
      const current = await account.get();
      setUser(current);
      // Self-healing: creates the profile doc (role: USER) the first time
      // it's missing, so existing accounts from before this feature still
      // pick one up automatically.
      const currentProfile = await ensureProfile(current.$id, current.name);
      setProfile(currentProfile);
      // Fire-and-forget: powers the inactivity reminder cron. A failed
      // write here just means that cron sees slightly stale data for this
      // user next run -- not worth blocking the UI or surfacing an error.
      touchLastActive(currentProfile.$id).catch(() => {});
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
    await refresh();
  }

  async function signup(email: string, password: string, name: string) {
    await account.create(ID.unique(), email, password, name);
    await login(email, password);
    // Fire off verification email; caller decides how to surface this in the UI.
    await account.createVerification(`${window.location.origin}/verify`);
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
