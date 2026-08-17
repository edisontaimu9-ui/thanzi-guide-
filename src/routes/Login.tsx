import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const REMEMBERED_EMAIL_KEY = 'thanzi-remembered-email';
const inputClasses =
  'mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50';

export function Login() {
  useDocumentTitle('Log in');
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill the email (never the password) from a previous "remember me" login.
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Log in</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
            Password
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClasses} mt-0 pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-300 hover:text-brand-500 dark:text-brand-100 dark:hover:text-white"
            >
              <EyeIcon />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 rounded border-brand-100 text-brand-500 focus:ring-brand-500 dark:border-ink-800"
          />
          <label htmlFor="rememberMe" className="text-sm text-brand-700 dark:text-sand-100">
            Remember me
          </label>
        </div>

        {error && (
          <p role="alert" className="text-sm text-clay-500 dark:text-clay-400">
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

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-brand-100 dark:bg-ink-800" />
        <span className="text-xs text-brand-300 dark:text-brand-100">Or continue with</span>
        <span className="h-px flex-1 bg-brand-100 dark:bg-ink-800" />
      </div>

      <button
        type="button"
        onClick={loginWithGoogle}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-brand-100 bg-white py-2 font-medium text-brand-900 hover:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50 dark:hover:border-brand-500"
      >
        <GoogleIcon />
        Google
      </button>

      <p className="mt-4 text-sm text-brand-500 dark:text-brand-100">
        Need an account?{' '}
        <Link to="/signup" className="underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 576 512" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 512 512" aria-hidden="true">
      <path
        fill="#FBBB00"
        d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456C103.821,274.792,107.225,292.797,113.47,309.408z"
      />
      <path
        fill="#518EF8"
        d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z"
      />
      <path
        fill="#28B446"
        d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z"
      />
      <path
        fill="#F14336"
        d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0C318.115,0,375.068,22.126,419.404,58.936z"
      />
    </svg>
  );
}
