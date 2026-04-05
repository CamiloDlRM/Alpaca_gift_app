import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import apiClient from '../api/client';

interface ETF {
  symbol: string;
  name: string;
  category: string;
  description: string;
  changePercent: number;
  price: number;
}

interface GiftResponse {
  id: string;
  claimLink: string;
  claimToken: string;
  recipientName: string;
  etfSymbol: string;
  amount: number;
  status: string;
}

export default function SendGift() {
  const navigate = useNavigate();
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<GiftResponse | null>(null);

  const [recipientName, setRecipientName] = useState('');
  const [occasion, setOccasion] = useState('Birthday');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [etfSymbol, setEtfSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [note, setNote] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [etfRes, catRes] = await Promise.all([
        apiClient.get<ETF[]>('/etfs'),
        apiClient.get<string[]>('/etfs/categories'),
      ]);
      setEtfs(etfRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0) setSelectedCategory(catRes.data[0]);
    } catch {
      setError('Failed to load ETFs. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEtfs = etfs.filter((e) => e.category === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<GiftResponse>('/gifts', {
        recipientName,
        occasion,
        etfSymbol,
        amount: parseFloat(amount),
        note: note || undefined,
        deliveryDate,
      });
      setSuccess(res.data);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Failed to send gift.');
      } else {
        setError('Failed to send gift. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-positive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-positive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Gift Sent!</h1>
          <p className="text-gray-600 mb-8">
            Your ${success.amount} gift of {success.etfSymbol} to {success.recipientName} is ready to be claimed.
          </p>
          <Card className="p-6 mb-8 text-left">
            <div className="text-sm text-gray-500 mb-2">Share this claim link:</div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700 break-all border border-gray-200">
              {success.claimLink}
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(success.claimLink)}
              className="mt-3 text-sm text-[#F5C518] font-semibold hover:underline"
            >
              Copy to clipboard
            </button>
          </Card>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate('/send')}>Send Another</Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Send a Gift</h1>
        <p className="text-gray-500 mb-8">Choose an investment and send it to someone you love.</p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-6" role="alert">{error}</div>
        )}

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label="Recipient Name"
                placeholder="Who is this gift for?"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Occasion</label>
                <select
                  className="rounded-lg border border-gray-200 py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent bg-white"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                >
                  {['Birthday', 'Graduation', 'Wedding', 'Holiday', 'Baby Shower', 'Just Because', 'Other'].map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Investment Category</label>
              <select
                className="rounded-lg border border-gray-200 py-3 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent bg-white"
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setEtfSymbol(''); }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Select Investment</label>
              {filteredEtfs.length === 0 ? (
                <p className="text-sm text-gray-400 py-3">No ETFs found for this category.</p>
              ) : (
                <div className="grid gap-3">
                  {filteredEtfs.map((etf) => (
                    <button
                      type="button"
                      key={etf.symbol}
                      onClick={() => setEtfSymbol(etf.symbol)}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left ${
                        etfSymbol === etf.symbol
                          ? 'border-[#F5C518] bg-yellow-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{etf.symbol}</div>
                        <div className="text-sm text-gray-500">{etf.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">${etf.price.toFixed(2)}</div>
                        <div className={`text-sm font-medium ${etf.changePercent >= 0 ? 'text-positive' : 'text-red-500'}`}>
                          {etf.changePercent >= 0 ? '+' : ''}{etf.changePercent}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label="Amount ($)"
                type="number"
                min="1"
                step="0.01"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Input
                label="Delivery Date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Add a Note (optional)</label>
              <textarea
                className="rounded-lg border border-gray-200 py-3 px-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent resize-none"
                rows={3}
                placeholder="Happy Birthday! Here's a gift that will grow with you..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" disabled={!etfSymbol}>
              Continue
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
