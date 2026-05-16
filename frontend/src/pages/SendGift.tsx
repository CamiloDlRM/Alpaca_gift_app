import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ETFCommunityReviews } from '../components/ETFCommunityReviews';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface ETF {
  symbol: string;
  name: string;
  category: string;
  description: string;
  changePercent: number;
  price: number;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  commission: number;
  sendingFee: number;
  total: number;
}

type GiftType = 'INSTANT' | 'SCHEDULED';

interface GiftFormData {
  recipientName: string;
  occasion: string;
  etfSymbol: string;
  amount: number;
  deliveryDate: string;
  note: string;
  recipientEmail: string;
  giftType: GiftType;
}

const OCCASIONS = [
  { value: 'Birthday', label: 'Birthday', emoji: '🎂', color: 'from-pink-400 to-rose-500', bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700' },
  { value: 'Anniversary', label: 'Anniversary', emoji: '💍', color: 'from-purple-400 to-violet-600', bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700' },
  { value: 'Graduation', label: 'Graduation', emoji: '🎓', color: 'from-blue-400 to-indigo-600', bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700' },
  { value: 'Baby Shower', label: 'Baby Shower', emoji: '👶', color: 'from-cyan-300 to-sky-500', bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700' },
  { value: 'Holiday', label: 'Holiday', emoji: '🎄', color: 'from-green-400 to-emerald-600', bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700' },
  { value: 'Just Because', label: 'Just Because', emoji: '💝', color: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
  { value: 'Wedding', label: 'Wedding', emoji: '💒', color: 'from-pink-300 to-fuchsia-500', bg: 'bg-fuchsia-50', border: 'border-fuchsia-300', text: 'text-fuchsia-700' },
  { value: 'Achievement', label: 'Achievement', emoji: '🏆', color: 'from-amber-400 to-yellow-500', bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700' },
];

// Inner payment component that uses Stripe hooks
interface PaymentStepProps {
  formData: GiftFormData;
  paymentData: PaymentIntentResponse;
  isPro: boolean;
  onBack: () => void;
  onSuccess: (giftId: string, claimLink: string) => void;
}

function PaymentStepInner({ formData, paymentData, isPro, onBack, onSuccess }: PaymentStepProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found.');
      setLoading(false);
      return;
    }

    try {
      const { error: stripeError } = await stripe.confirmCardPayment(paymentData.clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeError) {
        setError(stripeError.message ?? 'Error processing payment.');
        setLoading(false);
        return;
      }

      // Confirm gift creation in backend (doesn't depend on webhook)
      const { data } = await apiClient.post<{ giftId: string; claimToken: string; claimLink: string }>('/payments/confirm', {
        paymentIntentId: paymentData.paymentIntentId,
      });
      onSuccess(data.giftId, data.claimLink);
    } catch {
      setError('Error processing payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gift summary */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Gift summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Recipient</span>
            <span className="text-gray-900 dark:text-white font-medium">{formData.recipientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">ETF</span>
            <span className="text-gray-900 dark:text-white font-medium">{formData.etfSymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Gift amount</span>
            <span className="text-gray-900 dark:text-white font-medium">${paymentData.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Delivery</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {formData.giftType === 'INSTANT' ? '⚡ Instant' : formData.deliveryDate}
            </span>
          </div>
        </div>
      </Card>

      {/* Cost breakdown */}
      <Card className="p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cost breakdown</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Gift amount</span>
            <span className="text-gray-900 dark:text-white">${paymentData.amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">
              {isPro ? 'Sending fee' : 'Sending fee ($0.99)'}
            </span>
            <span className={isPro ? 'text-green-600 font-medium' : 'text-gray-900 dark:text-white'}>
              {isPro ? '$0.00 \u2713 No fee' : `$${(paymentData.sendingFee ?? paymentData.commission).toFixed(2)}`}
            </span>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3 flex justify-between">
            <span className="text-gray-900 dark:text-white font-bold">Total</span>
            <span className="text-gray-900 dark:text-white font-bold">${paymentData.total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Stripe card input */}
      <Card className="p-6">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-3">Card details</label>
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#1f2937',
                  '::placeholder': { color: '#9ca3af' },
                },
                invalid: { color: '#ef4444' },
              },
            }}
          />
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>
      )}

      <div className="flex gap-3">
        <Button onClick={handlePay} loading={loading} className="flex-1">
          Pay ${paymentData.total.toFixed(2)} and send gift
        </Button>
      </div>
      <button
        onClick={onBack}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium flex items-center gap-1"
        disabled={loading}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Edit gift
      </button>
    </div>
  );
}

export default function SendGift() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [giftsCount, setGiftsCount] = useState<number>(0);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [giftType, setGiftType] = useState<GiftType>('INSTANT');
  const [recipientName, setRecipientName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [etfSymbol, setEtfSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [note, setNote] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  const [paymentData, setPaymentData] = useState<PaymentIntentResponse | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdGiftId, setCreatedGiftId] = useState<string>('');
  const [claimLink, setClaimLink] = useState<string>('');

  const isPro = user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'PRO_PLUS';
  const isFreeLimitReached = !isPro && giftsCount >= 5;

  const fetchData = useCallback(async () => {
    try {
      const [etfRes, catRes, giftsRes] = await Promise.all([
        apiClient.get<ETF[]>('/etfs'),
        apiClient.get<string[]>('/etfs/categories'),
        apiClient.get<unknown[]>('/gifts'),
      ]);
      setEtfs(etfRes.data);
      setCategories(catRes.data);
      setGiftsCount(giftsRes.data.length);
      if (catRes.data.length > 0) setSelectedCategory(catRes.data[0]);
    } catch {
      setError('Error al cargar datos. Intenta de nuevo.');
    } finally {
      setLoadingInit(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredEtfs = etfs.filter((e) => e.category === selectedCategory);

  const handleContinueToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiClient.post<PaymentIntentResponse>('/payments/create-intent', {
        giftData: {
          recipientName,
          occasion,
          etfSymbol,
          amount: parseFloat(amount),
          note: note || undefined,
          deliveryDate: giftType === 'SCHEDULED' ? deliveryDate : undefined,
          recipientEmail: recipientEmail || undefined,
        },
      });
      setPaymentData(res.data);
      setStep(2);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Error creating payment.');
      } else {
        setError('Error creating payment. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (paymentSuccess) {
    const selectedOccasion = OCCASIONS.find((o) => o.value === occasion);
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Back to dashboard">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true"><path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">WealthGift</span>
        </div>
      </header>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Card className="p-8">
            <div className="text-5xl mb-4">{selectedOccasion?.emoji ?? '🎁'}</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gift sent!</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {giftType === 'INSTANT' && recipientEmail
                ? <>We've emailed the claim link to <span className="font-semibold text-gray-700 dark:text-gray-300">{recipientEmail}</span>. You can also share it manually:</>
                : <>Share this link with <span className="font-semibold text-gray-700 dark:text-gray-300">{recipientName}</span>.{recipientEmail && " They'll also receive it by email on the delivery date."}</>
              }
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-mono break-all mb-4 text-left">
              {claimLink}
            </div>
            <Button
              variant="secondary"
              className="w-full mb-3"
              onClick={() => { navigator.clipboard.writeText(claimLink); }}
            >
              Copy link
            </Button>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              View my gifts
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Back to dashboard">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true"><path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">WealthGift</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Send a Gift</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Choose an investment and send it to someone special.</p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-6" role="alert">{error}</div>
        )}

        {loadingInit ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
              <span className="sr-only">Loading</span>
            </div>
          </div>
        ) : isFreeLimitReached ? (
          <Card className="p-8 text-center">
            <div className="text-yellow-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">You have reached the 5-gift limit on the BASIC plan</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Upgrade to PRO or PRO+ to send unlimited gifts with no sending fees.</p>
            <Button onClick={() => navigate('/pricing')}>
              Upgrade to PRO
            </Button>
          </Card>
        ) : step === 1 ? (
          /* Step 1 - Gift form */
          <>
          <Card className="p-6 sm:p-8">
            <form onSubmit={handleContinueToPayment} className="space-y-6">
              {/* Gift type toggle */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Gift type</label>
                <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={() => setGiftType('INSTANT')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      giftType === 'INSTANT'
                        ? 'bg-[#F5C518] text-black'
                        : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    ⚡ Instant
                  </button>
                  <button
                    type="button"
                    onClick={() => setGiftType('SCHEDULED')}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      giftType === 'SCHEDULED'
                        ? 'bg-[#F5C518] text-black'
                        : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    📅 Scheduled
                  </button>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {giftType === 'INSTANT'
                    ? 'The recipient gets the claim link by email right away.'
                    : 'The claim link is emailed to the recipient on the delivery date.'}
                </p>
              </div>

              <Input
                label="Recipient name"
                placeholder="Who is this gift for?"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />

              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Occasion</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {OCCASIONS.map((o) => {
                    const selected = occasion === o.value;
                    return (
                      <button
                        type="button"
                        key={o.value}
                        onClick={() => setOccasion(o.value)}
                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                          selected
                            ? `${o.border} ${o.bg} shadow-md scale-[1.03]`
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${o.color} flex items-center justify-center text-2xl shadow-sm`}>
                          {o.emoji}
                        </div>
                        <span className={`text-xs font-semibold ${selected ? o.text : 'text-gray-600 dark:text-gray-400'}`}>
                          {o.label}
                        </span>
                        {selected && (
                          <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#F5C518] flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Investment category</label>
                <select
                  className="rounded-lg border border-gray-200 dark:border-gray-600 py-3 px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent bg-white dark:bg-gray-700"
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setEtfSymbol(''); }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select investment</label>
                {filteredEtfs.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3">No ETFs available for this category.</p>
                ) : (
                  <div className="grid gap-3">
                    {filteredEtfs.map((etf) => (
                      <button
                        type="button"
                        key={etf.symbol}
                        onClick={() => setEtfSymbol(etf.symbol)}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left ${
                          etfSymbol === etf.symbol
                            ? 'border-[#F5C518] bg-yellow-50 dark:bg-yellow-900/20'
                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{etf.symbol}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{etf.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">${etf.price.toFixed(2)}</div>
                          <div className={`text-sm font-medium ${etf.changePercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {etf.changePercent >= 0 ? '+' : ''}{etf.changePercent}%
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Community Reviews — inline, between ETF selection and amount */}
              {etfSymbol && (() => {
                const sel = etfs.find((e) => e.symbol === etfSymbol);
                return sel ? (
                  <ETFCommunityReviews key={etfSymbol} etfSymbol={etfSymbol} etfName={sel.name} />
                ) : null;
              })()}

              <div className={`grid gap-6 ${giftType === 'SCHEDULED' ? 'sm:grid-cols-2' : ''}`}>
                <Input
                  label="Amount ($)"
                  type="number"
                  min="10"
                  step="0.01"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                {giftType === 'SCHEDULED' && (
                  <Input
                    label="Delivery date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                  />
                )}
              </div>

              <Input
                label={giftType === 'INSTANT' ? 'Recipient email (required)' : 'Recipient email (must be registered on the platform)'}
                type="email"
                placeholder="email@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required={giftType === 'INSTANT'}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note (optional)</label>
                <textarea
                  className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Happy birthday! Here is a gift that will grow with you..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full"
                disabled={
                  !occasion || !etfSymbol || !amount ||
                  (giftType === 'INSTANT' && !recipientEmail) ||
                  (giftType === 'SCHEDULED' && !deliveryDate)
                }
              >
                Continue to payment
              </Button>
            </form>
          </Card>

          </>
        ) : paymentData ? (
          /* Step 2 - Payment */
          <Elements stripe={stripePromise}>
            <PaymentStepInner
              formData={{
                recipientName,
                occasion,
                etfSymbol,
                amount: parseFloat(amount),
                deliveryDate,
                note,
                recipientEmail,
                giftType,
              }}
              paymentData={paymentData}
              isPro={isPro}
              onBack={() => setStep(1)}
              onSuccess={(giftId, link) => { setCreatedGiftId(giftId); setClaimLink(link); setPaymentSuccess(true); }}
            />
          </Elements>
        ) : null}
      </div>
    </div>
  );
}
