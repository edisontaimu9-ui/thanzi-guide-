import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-2xl text-brand-700">Log in</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 focus:border-brand-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 px-3 py-2 focus:border-brand-500"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-clay-500">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-brand-500 py-2 font-medium text-white disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-sm text-brand-500">
        Need an account? <Link to="/signup" className="underline">Sign up</Link>
      </p>
    </main>
  );
}
