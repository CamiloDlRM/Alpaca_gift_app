import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Nav } from '../../components/layout/Nav';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useGiftStore } from '../../store/gift.store';
import apiClient from '../../api/client';

export default function KYCSSN() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const { giftData } = useGiftStore();
  const [ssnLast4, setSsnLast4] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/kyc/confirm-ssn', { claimToken, ssnLast4 });
      navigate(`/claim/${claimToken}/kyc/questions`);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'SSN verification failed.');
      } else {
        setError('SSN verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const giftAmount = giftData ? (giftData as Record<string, unknown>).amount as number : 0;
  const giftEtf = giftData ? (giftData as Record<string, unknown>).etfSymbol as string : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {['Personal Info', 'Verify SSN', 'Questions', 'Done'].map((step, i) => (
            <div key={step} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= 1 ? 'bg-[#F5C518]' : 'bg-gray-200'}`} />
              <div className={`text-xs mt-1 ${i === 1 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{step}</div>
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your SSN</h1>
        <p className="text-gray-500 mb-8">Please re-enter the last 4 digits to confirm your identity.</p>

        {/* Gift summary */}
        {giftData && (
          <Card className="p-5 mb-8 bg-yellow-50 border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Your Gift</div>
                <div className="text-lg font-bold text-gray-900">${giftAmount.toFixed(2)}</div>
              </div>
              <div className="bg-[#F5C518] text-black font-bold px-4 py-2 rounded-full text-sm">
                {giftEtf}
              </div>
            </div>
          </Card>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6" role="alert">{error}</div>
        )}

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Last 4 digits of SSN"
              type="password"
              maxLength={4}
              placeholder="XXXX"
              value={ssnLast4}
              onChange={(e) => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              autoComplete="off"
            />
            <Button type="submit" loading={loading} className="w-full" disabled={ssnLast4.length !== 4}>
              Verify
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
