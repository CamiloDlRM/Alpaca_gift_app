import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';
import { Logo } from '../components/ui/Logo';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

type ResendState = 'idle' | 'sending' | 'sent' | 'error';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // When registration succeeds, the backend sends a verification email and
  // returns no token — we switch the page into a "check your email" state.
  const [registered, setRegistered] = useState(false);
  const [resendState, setResendState] = useState<ResendState>('idle');
  const [resendError, setResendError] = useState('');
  const { register } = useAuthStore();
  const [searchParams] = useSearchParams();
  // Preserve the claim token across re-renders so a gift can be claimed
  // right after email verification.
  const [claimToken] = useState<string>(() => searchParams.get('claimToken') ?? '');

  // Pre-fill the email field from the query param (e.g. invited recipient).
  useEffect(() => {
    const prefillEmail = searchParams.get('email');
    if (prefillEmail) setEmail(prefillEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(email, password, name);
      // Stash the claim token so the VerifyEmail page can redirect the user
      // straight to the claim flow after they verify their email.
      if (claimToken) {
        sessionStorage.setItem('pendingClaimToken', claimToken);
      }
      setRegistered(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendState('sending');
    setResendError('');
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setResendState('sent');
    } catch (err: unknown) {
      let msg = 'Could not resend the email. Please try again.';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        msg = axiosErr.response?.data?.error || msg;
      }
      setResendError(msg);
      setResendState('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          {registered ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-[#F5C518]/15 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-[#F5C518]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                We sent a verification link to{' '}
                <span className="font-semibold text-gray-700 dark:text-gray-200">{email}</span>. Click
                the link in the email to activate your account.
              </p>

              {resendState === 'sent' && (
                <div
                  className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-4"
                  role="status"
                >
                  Verification email sent again. Please check your inbox.
                </div>
              )}
              {resendState === 'error' && (
                <div
                  className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4"
                  role="alert"
                >
                  {resendError}
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={handleResend}
                loading={resendState === 'sending'}
                className="w-full"
              >
                Resend email
              </Button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                Already verified?{' '}
                <Link to="/login" className="text-[#F5C518] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                Create your account
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
                Start gifting investments to loved ones
              </p>

              {error && (
                <div
                  className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <Button type="submit" loading={loading} className="w-full">
                  Create Account
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-[#F5C518] font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
