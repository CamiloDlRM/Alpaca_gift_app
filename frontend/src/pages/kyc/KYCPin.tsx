import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';

export default function KYCPin() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [sent, setSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const generatePin = async () => {
    if (!claimToken) return;
    try {
      await apiClient.post(`/kyc/generate-pin/${claimToken}`);
      setSent(true);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error || 'Could not send verification code.');
      } else {
        setError('Could not send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
      setResending(false);
    }
  };

  useEffect(() => {
    generatePin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimToken]);

  const handleResend = async () => {
    setResending(true);
    setError('');
    setPin('');
    await generatePin();
  };

  const handleVerify = async () => {
    if (!claimToken || pin.length !== 6) return;
    setVerifying(true);
    setError('');
    try {
      await apiClient.post(`/kyc/verify-pin/${claimToken}`, { pin });
      navigate(`/claim/${claimToken}/agreement`);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error || 'Invalid code. Please try again.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const claimPageHeader = (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
            <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-bold text-gray-900 dark:text-white">WealthGift</span>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {claimPageHeader}
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F5C518]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your email</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {sent
              ? "We've sent a 6-digit verification code to your email address."
              : 'Sending your verification code...'}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
              <span className="sr-only">Sending code</span>
            </div>
          </div>
        ) : (
          <Card className="p-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{error}</div>
            )}

            {sent && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6 text-center">
                <p className="text-sm text-amber-700 dark:text-amber-300">Code sent! Check your inbox — it expires in <strong>15 minutes</strong>.</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter 6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                placeholder="000000"
              />
            </div>

            <Button
              onClick={handleVerify}
              loading={verifying}
              disabled={pin.length !== 6}
              className="w-full mb-4"
              size="lg"
            >
              Verify Code
            </Button>

            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
            >
              {resending ? 'Sending...' : "Didn't receive it? Resend code"}
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
