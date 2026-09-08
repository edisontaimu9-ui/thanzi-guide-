import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export function Signup() {
  useDocumentTitle('Sign up');
  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup(email, password, name);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="font-display text-2xl text-brand-700 dark:text-sand-100">Create your account</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
            Name
          </label>
          <input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>
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
            className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-700 dark:text-sand-100">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-900 focus:border-brand-500 dark:border-ink-800 dark:bg-ink-950 dark:text-sand-50"
          />
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
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="text-center text-xs text-brand-300 dark:text-brand-100">
          By signing up, you agree to our{' '}
          <Link to="/terms" className="underline">
            Terms of Use
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
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
        Already have an account? <Link to="/login" className="underline">Log in</Link>
      </p>
    </main>
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
