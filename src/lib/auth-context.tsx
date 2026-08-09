import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Models } from 'appwrite';
import { account, ID } from './appwrite';

type ThanziUser = Models.User<Models.Preferences>;

interface AuthContextValue {
  user: ThanziUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ThanziUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const current = await account.get();
      setUser(current);
    } catch {
      setUser(null);
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
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
