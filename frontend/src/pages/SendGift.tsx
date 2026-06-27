import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ETFCommunityReviews } from '../components/ETFCommunityReviews';
import { ETFCategoryRankings } from '../components/ETFCategoryRankings';
import { ETFTopRankings } from '../components/ETFTopRankings';
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

interface SavedRecipient {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
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

const OccasionIcon = ({ value, className = 'w-6 h-6' }: { value: string; className?: string }) => {
  const props = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className };
  switch (value) {
    case 'Birthday': return (
      <svg viewBox="0 0 24 24" {...props}>
        <path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/>
        <path d="M12 7C12 7 9.5 4 7.5 4A2.5 2.5 0 005 6.5C5 8 6 8.5 7.5 8.5S10 8 12 7z"/>
        <path d="M12 7c0 0 2.5-3 4.5-3A2.5 2.5 0 0119 6.5C19 8 18 8.5 16.5 8.5S14 8 12 7z"/>
      </svg>
    );
    case 'Anniversary': return (
      <svg viewBox="0 0 24 24" {...props}>
        <path d="M12 22L3 9l3-5h12l3 5-9 13z"/>
        <path d="M3 9h18"/><path d="M9 4l2 5M15 4l-2 5"/>
      </svg>
    );
    case 'Graduation': return (
      <svg viewBox="0 0 24 24" {...props}>
        <path d="M22 10L12 5 2 10l10 5 10-5z"/>
        <path d="M6 12.5v4c0 1.66 2.69 3 6 3s6-1.34 6-3v-4"/>
        <line x1="22" y1="10" x2="22" y2="16"/>
      </svg>
    );
    case 'Baby Shower': return (
      <svg viewBox="0 0 24 24" {...props}>
        <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M3 12H0M24 12h-3"/>
        <path d="M5.64 5.64l-2.12-2.12M20.48 20.48l-2.12-2.12M5.64 18.36l-2.12 2.12M20.48 3.52l-2.12 2.12"/>
      </svg>
    );
    case 'Holiday': return (
      <svg viewBox="0 0 24 24" {...props}>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    );
    case 'Just Because': return (
      <svg viewBox="0 0 24 24" {...props}>
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    );
    case 'Wedding': return (
      <svg viewBox="0 0 24 24" {...props}>
        <path d="M5 22V11a7 7 0 0114 0v11"/><path d="M5 22h14"/>
        <path d="M9 22v-5h6v5"/>
      </svg>
    );
    case 'Achievement': return (
      <svg viewBox="0 0 24 24" {...props}>
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
        <path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
        <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
      </svg>
    );
    default: return null;
  }
};

const OCCASIONS = [
  { value: 'Birthday',    label: 'Birthday',    color: 'from-pink-400 to-rose-500',    bg: 'bg-pink-50 dark:bg-pink-900/20',    border: 'border-pink-300 dark:border-pink-700',    text: 'text-pink-700 dark:text-pink-300' },
  { value: 'Anniversary', label: 'Anniversary', color: 'from-purple-400 to-violet-600', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-300 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300' },
  { value: 'Graduation',  label: 'Graduation',  color: 'from-blue-400 to-indigo-600',  bg: 'bg-blue-50 dark:bg-blue-900/20',   border: 'border-blue-300 dark:border-blue-700',   text: 'text-blue-700 dark:text-blue-300' },
  { value: 'Baby Shower', label: 'Baby Shower', color: 'from-cyan-300 to-sky-500',     bg: 'bg-cyan-50 dark:bg-cyan-900/20',   border: 'border-cyan-300 dark:border-cyan-700',   text: 'text-cyan-700 dark:text-cyan-300' },
  { value: 'Holiday',     label: 'Holiday',     color: 'from-green-400 to-emerald-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300' },
  { value: 'Just Because',label: 'Just Because',color: 'from-yellow-400 to-orange-500',bg: 'bg-yellow-50 dark:bg-yellow-900/20',border: 'border-yellow-300 dark:border-yellow-700',text: 'text-yellow-700 dark:text-yellow-300'},
  { value: 'Wedding',     label: 'Wedding',     color: 'from-pink-300 to-fuchsia-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20',border:'border-fuchsia-300 dark:border-fuchsia-700',text:'text-fuchsia-700 dark:text-fuchsia-300'},
  { value: 'Achievement', label: 'Achievement', color: 'from-amber-400 to-yellow-500', bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-300' },
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
    if (!stripe || !elements || loading) return;
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
            <span className="text-gray-500 dark:text-gray-400">Sending fee</span>
            <span className="text-gray-900 dark:text-white">
              ${(paymentData.sendingFee ?? paymentData.commission).toFixed(2)}
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
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [etfs, setEtfs] = useState<ETF[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [giftsCount, setGiftsCount] = useState<number>(0);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state — initialize from URL params (from schedule view)
  const [giftType, setGiftType] = useState<GiftType>(() =>
    searchParams.get('type') === 'SCHEDULED' ? 'SCHEDULED' : 'INSTANT'
  );
  const [showScheduleUpsell, setShowScheduleUpsell] = useState(false);

  // If coming from schedule view with a specific month/year, lock the date picker to that month
  const lockedMonth = searchParams.get('month') !== null ? parseInt(searchParams.get('month')!) : null;
  const lockedYear = searchParams.get('year') !== null ? parseInt(searchParams.get('year')!) : null;
  const hasLockedMonth = lockedMonth !== null && lockedYear !== null;
  const lockedMinDate = hasLockedMonth
    ? new Date(lockedYear!, lockedMonth!, 1).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];
  const lockedMaxDate = hasLockedMonth
    ? new Date(lockedYear!, lockedMonth! + 1, 0).toISOString().split('T')[0]
    : undefined;

  const [recipientName, setRecipientName] = useState('');
  const [occasion, setOccasion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [etfSymbol, setEtfSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [note, setNote] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Saved contacts (PRO / PRO_PLUS) — quick-fill recipient from saved list
  const [savedRecipients, setSavedRecipients] = useState<SavedRecipient[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedError, setSavedError] = useState('');

  // Pre-fill from URL params on mount (e.g. coming from a gift event / favorites)
  useEffect(() => {
    const pName = searchParams.get('recipientName');
    const pEmail = searchParams.get('recipientEmail');
    const pSymbol = searchParams.get('etfSymbol');
    const pAmount = searchParams.get('amount');
    if (pName) setRecipientName(pName);
    if (pEmail) setRecipientEmail(pEmail);
    if (pSymbol) setEtfSymbol(pSymbol);
    if (pAmount) setAmount(pAmount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ETF pagination
  const [etfPage, setEtfPage] = useState(0);
  const ETF_PAGE_SIZE = 6;

  // ETF ratings map (symbol → {avg, total})
  const [etfRatingsMap, setEtfRatingsMap] = useState<Record<string, { avg: number; total: number }>>({});

  // Step state
  const [step, setStep] = useState<1 | 2>(1);
  const [paymentData, setPaymentData] = useState<PaymentIntentResponse | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdGiftId, setCreatedGiftId] = useState<string>('');
  const [claimLink, setClaimLink] = useState<string>('');

  // Sender rating on success screen
  const [senderRating, setSenderRating] = useState(0);
  const [senderComment, setSenderComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);

  const isPro = user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'PRO_PLUS';
  const isFreeLimitReached = !isPro && giftsCount >= 5;

  useEffect(() => { setEtfPage(0); }, [selectedCategory]);

  // Fetch community ratings for selected category ETFs
  useEffect(() => {
    if (!selectedCategory) return;
    const controller = new AbortController();
    apiClient
      .get<{ topETFs: Array<{ symbol: string; averageRating: number; totalRatings: number }> }>(
        `/rankings/etfs/${encodeURIComponent(selectedCategory)}`,
        { signal: controller.signal }
      )
      .then(res => {
        const map: Record<string, { avg: number; total: number }> = {};
        for (const e of res.data.topETFs ?? []) {
          map[e.symbol] = { avg: e.averageRating, total: e.totalRatings };
        }
        setEtfRatingsMap(map);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [selectedCategory]);

  const handleSenderRating = async () => {
    if (!etfSymbol || senderRating < 1 || ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      await apiClient.post(`/etf-ratings/${etfSymbol}`, {
        stars: senderRating,
        role: 'SENDER',
        comment: senderComment.trim() || undefined,
      });
      setRatingSubmitted(true);
    } catch { /* non-blocking */ }
    finally { setRatingSubmitting(false); }
  };

  const openSavedRecipients = async () => {
    const next = !savedOpen;
    setSavedOpen(next);
    if (next && savedRecipients.length === 0) {
      setSavedLoading(true);
      setSavedError('');
      try {
        const { data } = await apiClient.get<SavedRecipient[]>('/saved-recipients');
        setSavedRecipients(data);
      } catch {
        setSavedError('Could not load your saved contacts.');
      } finally {
        setSavedLoading(false);
      }
    }
  };

  const pickSavedRecipient = (r: SavedRecipient) => {
    setRecipientName(r.name);
    setRecipientEmail(r.email);
    setSavedOpen(false);
  };

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
          <Link to="/dashboard" aria-label="Back to dashboard" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </span>
            <span className="text-sm font-semibold hidden sm:inline">Dashboard</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true"><path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">WealthGift</span>
        </div>
      </header>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Card className="p-8 animate-bounceIn">
            <div className="mb-4 flex justify-center animate-bounceIn" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              {selectedOccasion ? (
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${selectedOccasion.color} flex items-center justify-center shadow-lg text-white`}>
                  <OccasionIcon value={selectedOccasion.value} className="w-8 h-8" />
                </div>
              ) : (
                <span className="text-5xl">🎁</span>
              )}
            </div>
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

            {/* Sender rating */}
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mb-4 text-left">
              {ratingSubmitted ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium justify-center">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  Rating for <strong className="mx-1">{etfSymbol}</strong> saved — thanks!
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                    How good was <span className="text-[#b8960c] font-bold">{etfSymbol}</span> as a gift choice?
                  </p>

                  {/* Stars */}
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseEnter={() => setRatingHover(i)}
                        onMouseLeave={() => setRatingHover(0)}
                        onClick={() => setSenderRating(i)}
                        aria-label={`${i} star${i === 1 ? '' : 's'}`}
                        className={`transition-all duration-100 hover:scale-125 active:scale-95 ${
                          i <= (ratingHover || senderRating) ? 'text-[#F5C518]' : 'text-gray-200 dark:text-gray-600'
                        }`}
                      >
                        <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </button>
                    ))}
                  </div>

                  {/* Comment textarea — slides in once stars selected */}
                  {senderRating > 0 && (
                    <div className="animate-fadeIn space-y-2">
                      <textarea
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent resize-none"
                        rows={2}
                        maxLength={500}
                        placeholder="Share your experience… (optional)"
                        value={senderComment}
                        onChange={(e) => setSenderComment(e.target.value)}
                        disabled={ratingSubmitting}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSenderRating}
                        disabled={ratingSubmitting}
                        className="w-full py-2 rounded-lg bg-[#F5C518] hover:bg-yellow-400 text-black text-sm font-bold transition-colors disabled:opacity-60"
                      >
                        {ratingSubmitting ? 'Saving…' : 'Submit rating'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSenderRating(0); setSenderComment(''); }}
                        className="w-full text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {senderRating === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Select stars to leave a rating</p>
                  )}
                </div>
              )}
            </div>

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
          <Link to="/dashboard" aria-label="Back to dashboard" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </span>
            <span className="text-sm font-semibold hidden sm:inline">Dashboard</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true"><path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">WealthGift</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-slideUp">Send a Gift</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 animate-slideUp" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>Choose an investment and send it to someone special.</p>

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
            <p className="text-gray-500 dark:text-gray-400 mb-6">Upgrade to Future Builder ($1.50/gift) or Visionary ($1/gift) to send unlimited gifts at a reduced fee.</p>
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
                    onClick={() => { setShowScheduleUpsell(false); setGiftType('INSTANT'); }}
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
                    onClick={() => {
                      if (!isPro) { setShowScheduleUpsell(true); return; }
                      setShowScheduleUpsell(false);
                      setGiftType('SCHEDULED');
                    }}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                      giftType === 'SCHEDULED'
                        ? 'bg-[#F5C518] text-black'
                        : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    📅 Scheduled
                  </button>
                </div>
                {showScheduleUpsell && !isPro && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Scheduled gifts require a <Link to="/pricing" className="font-semibold underline">Future Builder or Visionary plan</Link>.
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {giftType === 'INSTANT'
                    ? 'The recipient gets the claim link by email right away.'
                    : 'The claim link is emailed to the recipient on the delivery date.'}
                </p>
              </div>

              {/* Saved contacts — PRO / PRO_PLUS only */}
              {isPro && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={openSavedRecipients}
                    className="flex items-center gap-2 text-sm font-semibold text-[#b8960c] hover:text-[#8a6f08] transition-colors"
                    aria-expanded={savedOpen}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                    </svg>
                    Use saved recipient
                  </button>
                  {savedOpen && (
                    <div className="absolute z-20 mt-2 w-full sm:w-80 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg p-2">
                      {savedLoading ? (
                        <div className="py-6 text-center text-sm text-gray-400">Loading…</div>
                      ) : savedError ? (
                        <div className="py-4 px-2 text-sm text-red-500" role="alert">{savedError}</div>
                      ) : savedRecipients.length === 0 ? (
                        <div className="py-4 px-2 text-sm text-gray-400 text-center">
                          No saved contacts yet.{' '}
                          <Link to="/saved-recipients" className="text-[#b8960c] font-semibold hover:underline">Add one</Link>
                        </div>
                      ) : (
                        savedRecipients.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => pickSavedRecipient(r)}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{r.name}</div>
                            <div className="text-xs text-gray-400">{r.email}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

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
                  {OCCASIONS.map((o, oi) => {
                    const selected = occasion === o.value;
                    return (
                      <button
                        type="button"
                        key={o.value}
                        onClick={() => setOccasion(o.value)}
                        style={{ animationDelay: `${oi * 30}ms`, animationFillMode: 'both' }}
                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-center animate-scaleIn ${
                          selected
                            ? `${o.border} ${o.bg} shadow-md scale-[1.03]`
                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${o.color} flex items-center justify-center shadow-sm text-white`}>
                          <OccasionIcon value={o.value} className="w-6 h-6" />
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

              {/* Category rankings — visual guide above the category dropdown */}
              <ETFCategoryRankings
                onSelectCategory={(c) => { setSelectedCategory(c); setEtfSymbol(''); }}
                selectedCategory={selectedCategory}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">WealthGift category</label>
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

              {/* Top-ranked ETFs for the selected category — visual guide above the ETF picker */}
              {selectedCategory && (
                <ETFTopRankings
                  category={selectedCategory}
                  onSelectETF={setEtfSymbol}
                  selectedETF={etfSymbol}
                />
              )}

              {(() => {
                const totalEtfPages = Math.max(1, Math.ceil(filteredEtfs.length / ETF_PAGE_SIZE));
                const pagedEtfs = filteredEtfs.slice(etfPage * ETF_PAGE_SIZE, (etfPage + 1) * ETF_PAGE_SIZE);
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select investment</label>
                      {filteredEtfs.length > 0 && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {filteredEtfs.length} ETFs · page {etfPage + 1}/{totalEtfPages}
                        </span>
                      )}
                    </div>

                    {filteredEtfs.length === 0 ? (
                      <p className="text-sm text-gray-400 py-3">No ETFs available for this category.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {pagedEtfs.map((etf, ei) => {
                            const selected = etfSymbol === etf.symbol;
                            return (
                              <button
                                type="button"
                                key={etf.symbol}
                                onClick={() => setEtfSymbol(etf.symbol)}
                                style={{ animationDelay: `${ei * 30}ms`, animationFillMode: 'both' }}
                                className={`relative flex flex-col p-3 rounded-xl border-2 transition-all text-left animate-scaleIn ${
                                  selected
                                    ? 'border-[#F5C518] bg-yellow-50 dark:bg-yellow-900/20 shadow-md'
                                    : 'border-gray-100 dark:border-gray-700 hover:border-[#F5C518]/50 hover:shadow-sm bg-white dark:bg-gray-800'
                                }`}
                              >
                                {selected && (
                                  <span className="absolute top-2 right-2 w-4 h-4 bg-[#F5C518] rounded-full flex items-center justify-center">
                                    <svg className="w-2.5 h-2.5 text-black" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                      <path d="M2 6l3 3 5-5"/>
                                    </svg>
                                  </span>
                                )}
                                <div className="font-bold text-gray-900 dark:text-white text-sm pr-5">{etf.symbol}</div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 mt-0.5 mb-2 leading-tight">{etf.name}</div>
                                {(() => {
                                  const r = etfRatingsMap[etf.symbol];
                                  return r && r.total > 0 ? (
                                    <div className="mt-auto flex items-center gap-1.5">
                                      <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(i => (
                                          <svg key={i} className={`w-3 h-3 ${i <= Math.round(r.avg) ? 'text-[#F5C518]' : 'text-gray-200 dark:text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                          </svg>
                                        ))}
                                      </div>
                                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{r.avg.toFixed(1)}</span>
                                      <span className="text-[10px] text-gray-400">({r.total})</span>
                                    </div>
                                  ) : (
                                    <div className="mt-auto flex items-center gap-0.5">
                                      {[1,2,3,4,5].map(i => (
                                        <svg key={i} className="w-3 h-3 text-gray-200 dark:text-gray-700" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                        </svg>
                                      ))}
                                      <span className="text-[10px] text-gray-300 dark:text-gray-600 ml-1">New</span>
                                    </div>
                                  );
                                })()}
                              </button>
                            );
                          })}
                        </div>

                        {totalEtfPages > 1 && (
                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() => setEtfPage(p => Math.max(0, p - 1))}
                              disabled={etfPage === 0}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                              Prev
                            </button>
                            <div className="flex gap-1">
                              {Array.from({ length: totalEtfPages }, (_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setEtfPage(i)}
                                  className={`w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                                    i === etfPage
                                      ? 'bg-[#F5C518] text-black'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEtfPage(p => Math.min(totalEtfPages - 1, p + 1))}
                              disabled={etfPage >= totalEtfPages - 1}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              Next
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

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
                    label={hasLockedMonth ? `Delivery date (${new Date(lockedYear!, lockedMonth!).toLocaleString('default', { month: 'long', year: 'numeric' })})` : 'Delivery date'}
                    type="date"
                    min={lockedMinDate}
                    max={lockedMaxDate}
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                  />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Input
                  label={giftType === 'INSTANT' ? 'Recipient email (required)' : 'Recipient email (optional)'}
                  type="email"
                  placeholder="email@example.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  required={giftType === 'INSTANT'}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  The recipient does not need a WealthGift account — they can create one when they claim the gift.
                </p>
              </div>

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
