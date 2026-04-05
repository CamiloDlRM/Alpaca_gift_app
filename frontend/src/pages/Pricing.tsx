import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

const stripePromise = loadStripe('pk_test_51TIimc8uinwBNZCCChvO18g9m3WqfrJuZALjTIUeg7Qe8ERGh4XEKudIodlSxkmHtXZEQEDLTyx1WNeQK5sgr0SG00hTZkVUst');

const CHECK_ICON = (
  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

interface SubscribeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function SubscribeModalInner({ onClose, onSuccess }: SubscribeModalProps) {
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
      });

      onSuccess();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Failed to create subscription.');
      } else {
        setError('Failed to create subscription. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Subscribe to WealthGift PRO"
    >
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Suscribirse a WealthGift PRO</h2>
        <p className="text-sm text-gray-500 mb-6">$9.99/mes &middot; Cancela cuando quieras</p>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{error}</div>
        )}

        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 block mb-2">Datos de tarjeta</label>
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
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
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubscribe} loading={loading} className="flex-1">
            Confirmar suscripcion
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
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
  const [showModal, setShowModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const isPro = user?.subscriptionStatus === 'PRO';
  const isAuthenticated = !!token;

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    try {
      await apiClient.delete('/subscriptions');
      updateUser({ subscriptionStatus: 'FREE' });
    } catch {
      // silently fail
    } finally {
      setCancelLoading(false);
    }
  };

  const handleSubscribeSuccess = () => {
    updateUser({ subscriptionStatus: 'PRO' });
    setShowModal(false);
    setSuccessBanner(true);
    setTimeout(() => setSuccessBanner(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">WealthGift</span>
          </div>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 font-medium">
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Success banner */}
        {successBanner && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6 text-center font-medium" role="status">
            Tu suscripcion PRO se ha activado correctamente.
          </div>
        )}

        {/* Page title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Planes y Precios</h1>
          <p className="text-gray-500 text-lg">Elige el plan que mejor se adapte a tus necesidades</p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* FREE Plan */}
          <Card className="p-6 sm:p-8 border-gray-200 flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                GRATIS
              </span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-500 ml-1">/ mes</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Hasta 5 regalos de inversion',
                'Comision del 2.5% por regalo',
                'Dashboard basico',
                'Acceso a todos los ETFs',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  {CHECK_ICON}
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                if (!isAuthenticated) navigate('/register');
                else navigate('/dashboard');
              }}
            >
              Comenzar gratis
            </Button>
          </Card>

          {/* PRO Plan */}
          <Card className="p-6 sm:p-8 border-2 border-[#F5C518] shadow-lg relative flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold uppercase tracking-wider bg-[#F5C518] text-black px-4 py-1 rounded-full">
                MAS POPULAR
              </span>
            </div>
            <div className="mb-4 mt-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
                PRO
              </span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$9.99</span>
              <span className="text-gray-500 ml-1">/ mes</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Regalos ilimitados',
                'Sin comisiones',
                'Regalos programados avanzados',
                'Dashboard completo con analytics',
                'Soporte prioritario',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  {CHECK_ICON}
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isAuthenticated && isPro ? (
              <div className="space-y-3">
                <div className="text-center text-sm font-semibold text-green-600 bg-green-50 px-4 py-3 rounded-full">
                  Plan activo
                </div>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={handleCancelSubscription}
                  loading={cancelLoading}
                >
                  Cancelar suscripcion
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => {
                  if (!isAuthenticated) navigate('/login');
                  else setShowModal(true);
                }}
              >
                Suscribirse a PRO
              </Button>
            )}
          </Card>
        </div>
      </div>

      {/* Subscribe Modal */}
      {showModal && (
        <SubscribeModal
          onClose={() => setShowModal(false)}
          onSuccess={handleSubscribeSuccess}
        />
      )}
    </div>
  );
}
