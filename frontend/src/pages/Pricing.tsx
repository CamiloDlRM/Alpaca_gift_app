import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

const CHECK_ICON = (
  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

type PaidPlan = 'PRO' | 'PRO_PLUS';
type BillingInterval = 'month' | 'year';

interface SubscribeModalProps {
  plan: PaidPlan;
  price: string;
  billingInterval: BillingInterval;
  onClose: () => void;
  onSuccess: (plan: PaidPlan) => void;
}

function SubscribeModalInner({ plan, price, billingInterval, onClose, onSuccess }: SubscribeModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
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
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        setError(pmError.message ?? 'Error processing card.');
        setLoading(false);
        return;
      }

      await apiClient.post('/subscriptions', {
        paymentMethodId: paymentMethod.id,
        plan,
        billingInterval,
      });

      onSuccess(plan);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Could not create subscription.');
      } else {
        setError('Could not create subscription. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const planLabel = plan === 'PRO_PLUS' ? 'PRO+' : 'PRO';
  const intervalLabel = billingInterval === 'year' ? 'year' : 'month';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Subscribe to WealthGift ${planLabel}`}
    >
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Subscribe to WealthGift {planLabel}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{price}/{intervalLabel} &middot; Cancel anytime</p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{error}</div>
        )}

        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Card details</label>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
            <CardElement
              options={{
                style: {
                  base: { fontSize: '16px', color: '#1f2937', '::placeholder': { color: '#9ca3af' } },
                  invalid: { color: '#ef4444' },
                },
              }}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubscribe} loading={loading} className="flex-1">
            Confirm subscription
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </Card>
    </div>
  );
}

function SubscribeModal(props: SubscribeModalProps) {
  return (
    <Elements stripe={stripePromise}>
      <SubscribeModalInner {...props} />
    </Elements>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuthStore();
  const [modalPlan, setModalPlan] = useState<PaidPlan | null>(null);
  const [successBanner, setSuccessBanner] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const currentPlan = user?.subscriptionStatus ?? 'BASIC';
  const isAuthenticated = !!token;

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      await apiClient.delete('/subscriptions');
      updateUser({ subscriptionStatus: 'BASIC' });
    } catch { /* silently fail */ }
    finally { setCancelLoading(false); }
  };

  const handleSubscribeSuccess = (plan: PaidPlan) => {
    updateUser({ subscriptionStatus: plan });
    setModalPlan(null);
    const label = plan === 'PRO_PLUS' ? 'PRO+' : 'PRO';
    setSuccessBanner(`Your ${label} subscription has been activated.`);
    setTimeout(() => setSuccessBanner(''), 5000);
  };

  const openModal = (plan: PaidPlan) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setModalPlan(plan);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">WealthGift</span>
          </div>
          <Link to="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium">
            Back to home
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {successBanner && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-6 text-center font-medium" role="status">
            {successBanner}
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">Plans & Pricing</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Choose the plan that best fits your needs</p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>Monthly</span>
          <button
            type="button"
            onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
            className={`relative w-12 h-6 rounded-full overflow-hidden transition-colors ${billing === 'annual' ? 'bg-[#F5C518]' : 'bg-gray-300 dark:bg-gray-600'}`}
            role="switch"
            aria-checked={billing === 'annual'}
            aria-label="Toggle annual billing"
          >
            <span className={`absolute top-1 left-0 w-4 h-4 bg-white rounded-full transition-transform ${billing === 'annual' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          <span className={`text-sm font-medium ${billing === 'annual' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            Annual <span className="text-xs text-green-600 font-semibold">(Save with PRO+!)</span>
          </span>
        </div>

        {/* 3-plan grid */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* BASIC Plan */}
          <Card className="p-6 sm:p-8 border-gray-200 flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">
                BASIC
              </span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$0</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">/ month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Up to 5 investment gifts',
                '$5.99 sending fee per gift',
                'Portfolio dashboard',
                'Access to all ETFs',
                'ETF ratings',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {CHECK_ICON}
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {currentPlan === 'BASIC' && isAuthenticated ? (
              <div className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-full">
                Current plan
              </div>
            ) : (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => { if (!isAuthenticated) navigate('/register'); else navigate('/dashboard'); }}
              >
                Get started free
              </Button>
            )}
          </Card>

          {/* PRO Plan */}
          <Card className="p-6 sm:p-8 border-2 border-[#F5C518] shadow-lg relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold uppercase tracking-wider bg-[#F5C518] text-black px-4 py-1 rounded-full whitespace-nowrap">
                MOST POPULAR
              </span>
            </div>
            <div className="mb-4 mt-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full">
                PRO
              </span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">$9.99</span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">/ month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Unlimited gifts',
                'No sending fees',
                'Full dashboard with analytics',
                'ETF ratings',
                'Priority support',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {CHECK_ICON}
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {isAuthenticated && currentPlan === 'PRO' ? (
              <div className="space-y-3">
                <div className="text-center text-sm font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-full">
                  Active plan
                </div>
                <Button variant="secondary" className="w-full" onClick={handleCancelSubscription} loading={cancelLoading}>
                  Cancel subscription
                </Button>
              </div>
            ) : (
              <Button className="w-full" onClick={() => openModal('PRO')}>
                {currentPlan === 'PRO_PLUS' ? 'Switch to PRO' : 'Subscribe to PRO'}
              </Button>
            )}
          </Card>

          {/* PRO+ Plan */}
          <Card className="p-6 sm:p-8 border-2 border-purple-200 dark:border-purple-700 shadow-lg relative flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full">
                PRO+
              </span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {billing === 'annual' ? '$49' : '$19.99'}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                / {billing === 'annual' ? 'year' : 'month'}
              </span>
              {billing === 'annual' && (
                <div className="text-xs text-green-600 font-semibold mt-1">Save 80% vs monthly</div>
              )}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Everything in PRO',
                'Advanced scheduled gifts',
                'Advanced analytics',
                '24/7 support',
                'Early access to new features',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                  {CHECK_ICON}
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {isAuthenticated && currentPlan === 'PRO_PLUS' ? (
              <div className="space-y-3">
                <div className="text-center text-sm font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-4 py-3 rounded-full">
                  Active plan
                </div>
                <Button variant="secondary" className="w-full" onClick={handleCancelSubscription} loading={cancelLoading}>
                  Cancel subscription
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white border-0"
                onClick={() => openModal('PRO_PLUS')}
              >
                {currentPlan === 'PRO' ? 'Upgrade to PRO+' : 'Subscribe to PRO+'}
              </Button>
            )}
          </Card>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
          * The Basic plan sending fee ($5.99) is charged once per gift sent. No additional commissions on any plan.
        </p>
      </div>

      {modalPlan && (
        <SubscribeModal
          plan={modalPlan}
          price={
            modalPlan === 'PRO_PLUS'
              ? (billing === 'annual' ? '$49' : '$19.99')
              : '$9.99'
          }
          billingInterval={modalPlan === 'PRO_PLUS' && billing === 'annual' ? 'year' : 'month'}
          onClose={() => setModalPlan(null)}
          onSuccess={handleSubscribeSuccess}
        />
      )}
    </div>
  );
}
