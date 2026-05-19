import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';
import { Logo } from '../components/ui/Logo';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

type ResendState = 'idle' | 'sending' | 'sent' | 'error';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // True when the login failed specifically because the email is unverified
  // (backend responds 403). Drives a contextual resend-verification flow.
  const [unverified, setUnverified] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendState, setResendState] = useState<ResendState>('idle');
  const [resendError, setResendError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setShowResend(false);
    setResendState('idle');
    setLoading(true);
    try {
      await login(email, password);
      const next = searchParams.get('next');
      navigate(next || '/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
        if (axiosErr.response?.status === 403) {
          setUnverified(true);
        } else {
          setError(axiosErr.response?.data?.error || msg);
        }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-8">Sign in to your WealthGift account</p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6" role="alert">
              {error}
            </div>
          )}

          {unverified && (
            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-lg text-sm mb-6" role="alert">
              <p>
                Your email is not verified. Check your inbox or{' '}
                <button
                  type="button"
                  onClick={() => setShowResend((v) => !v)}
                  className="font-semibold underline hover:no-underline"
                >
                  resend the verification email
                </button>
                .
              </p>

              {showResend && (
                <div className="mt-3 space-y-3">
                  {resendState === 'sent' ? (
                    <p className="text-green-600 dark:text-green-400">
                      Verification email sent. Please check your inbox.
                    </p>
                  ) : (
                    <>
                      <Input
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                      {resendState === 'error' && (
                        <p className="text-red-600 dark:text-red-400 text-xs" role="alert">
                          {resendError}
                        </p>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleResend}
                        loading={resendState === 'sending'}
                        disabled={!email}
                        className="w-full"
                      >
                        Resend verification email
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button type="submit" loading={loading} className="w-full">
              Continue
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#F5C518] font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
