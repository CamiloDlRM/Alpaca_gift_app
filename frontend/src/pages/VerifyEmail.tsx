import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, type User } from '../store/auth.store';
import apiClient from '../api/client';
import { Logo } from '../components/ui/Logo';
import { Button } from '../components/ui/Button';

type VerifyStatus = 'loading' | 'success' | 'error';

interface VerifyEmailResponse {
  token: string;
  user: User;
  claimToken?: string;
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  // Guard against React StrictMode double-invoking the effect, which would
  // verify (and burn) the single-use token twice.
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }

    let redirectTimer: ReturnType<typeof setTimeout>;

    const verify = async () => {
      try {
        const res = await apiClient.get<VerifyEmailResponse>('/auth/verify-email', {
          params: { token },
        });
        setAuth(res.data.token, res.data.user);
        setStatus('success');

        // If a gift claim token is attached (from the response or stored during
        // registration), send the user to the claim flow instead of the dashboard.
        const pendingClaimToken = res.data.claimToken || sessionStorage.getItem('pendingClaimToken');
        if (pendingClaimToken) {
          sessionStorage.removeItem('pendingClaimToken');
          redirectTimer = setTimeout(() => navigate(`/claim/${pendingClaimToken}`), 2000);
        } else {
          redirectTimer = setTimeout(() => navigate('/dashboard'), 2000);
        }
      } catch {
        setStatus('error');
      }
    };

    verify();

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <svg
                  className="animate-spin w-10 h-10 text-[#F5C518]"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verifying your email
              </h1>
              <p className="text-gray-500 dark:text-gray-400" role="status">
                Hang tight while we activate your account…
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email verified!
              </h1>
              <p className="text-gray-500 dark:text-gray-400" role="status">
                Your account is now active. Redirecting you to your dashboard…
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification failed
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6" role="alert">
                Invalid or expired link. Request a new one.
              </p>
              <Link to="/register">
                <Button type="button" className="w-full">
                  Back to register
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
