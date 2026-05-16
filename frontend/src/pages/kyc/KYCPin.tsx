import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Nav } from '../../components/layout/Nav';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import apiClient from '../../api/client';

export default function KYCPin() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [generatedPin, setGeneratedPin] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const generate = async () => {
      if (!claimToken) return;
      try {
        const res = await apiClient.post<{ pin: string }>(`/kyc/generate-pin/${claimToken}`);
        setGeneratedPin(res.data.pin);
      } catch (err: unknown) {
        if (typeof err === 'object' && err !== null && 'response' in err) {
          const e = err as { response?: { data?: { error?: string } } };
          setError(e.response?.data?.error || 'Could not generate PIN.');
        } else {
          setError('Could not generate PIN. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    generate();
  }, [claimToken]);

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
        setError(e.response?.data?.error || 'Invalid PIN. Please try again.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Nav />
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#F5C518]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verify Your Identity</h1>
          <p className="text-gray-500 dark:text-gray-400">Since you've received gifts before, enter your dynamic security code to claim this gift.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
              <span className="sr-only">Generating PIN</span>
            </div>
          </div>
        ) : (
          <Card className="p-6">
            {generatedPin && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6 text-center">
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">Your security code has been generated. In a production system this would be sent to your email. For now, your code is:</p>
                <div className="text-3xl font-mono font-bold text-blue-800 dark:text-blue-200 tracking-widest">{generatedPin}</div>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">Valid for 15 minutes</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{error}</div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Enter 6-digit security code</label>
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
              className="w-full"
              size="lg"
            >
              Verify Code
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
