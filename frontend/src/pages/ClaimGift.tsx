import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGiftStore } from '../store/gift.store';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

interface GiftResponse {
  id: string;
  senderId: string;
  recipientName: string;
  occasion: string;
  etfSymbol: string;
  amount: number;
  note: string | null;
  deliveryDate: string;
  status: string;
  claimToken: string;
  claimLink: string;
  createdAt: string;
}

export default function ClaimGift() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const navigate = useNavigate();
  const { setClaimToken, setGiftData } = useGiftStore();
  const { user } = useAuthStore();
  const [gift, setGift] = useState<GiftResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const fetchGift = useCallback(async () => {
    if (!claimToken) return;
    try {
      const res = await apiClient.get<GiftResponse>(`/gifts/claim/${claimToken}`);
      setGift(res.data);
      setClaimToken(claimToken);
      setGiftData(res.data as unknown as Record<string, unknown>);
    } catch {
      setError('Gift not found or has already been claimed.');
    } finally {
      setLoading(false);
    }
  }, [claimToken, setClaimToken, setGiftData]);

  useEffect(() => {
    fetchGift();
  }, [fetchGift]);

  const isSender = !!user && !!gift && user.id === gift.senderId;

  const handleStart = async () => {
    if (!claimToken) return;
    if (isSender) {
      setError('No puedes reclamar un regalo que tu mismo enviaste.');
      return;
    }
    setStarting(true);
    try {
      await apiClient.patch(`/gifts/claim/${claimToken}/start`);
      navigate(`/claim/${claimToken}/kyc/personal`);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        const msg = axiosErr.response?.data?.error ?? '';
        if (msg) { setError(msg); setStarting(false); return; }
      }
      // Any other error: still proceed (may already be CLAIMING)
      navigate(`/claim/${claimToken}/kyc/personal`);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
            <span className="sr-only">Loading</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !gift) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-6">
            <svg className="w-16 h-16 text-gray-300 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Gift Not Found</h1>
          <p className="text-gray-500">{error || 'This gift link may be invalid or expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-lg mx-auto px-4 py-12 sm:py-16">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4" aria-hidden="true">
            <svg className="w-20 h-20 mx-auto text-[#F5C518]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 7h-1.209A4.92 4.92 0 0019 5.5C19 3.57 17.43 2 15.5 2c-1.622 0-2.705 1.482-3.404 3.085C11.498 3.49 10.39 2 8.5 2 6.57 2 5 3.57 5 5.5c0 .596.079 1.089.209 1.5H4c-1.1 0-2 .9-2 2v2c0 .55.45 1 1 1v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c.55 0 1-.45 1-1V9c0-1.1-.9-2-2-2zm-4.5-3c.83 0 1.5.67 1.5 1.5S16.33 7 15.5 7H13c.5-1.58 1.55-3 2.5-3zM7 5.5C7 4.67 7.67 4 8.5 4c.95 0 2 1.42 2.5 3H8.5C7.67 7 7 6.33 7 5.5zM4 9h7v2H4V9zm1 4h6v7H5v-7zm14 7h-6v-7h6v7zm1-9h-7V9h7v2z"/>
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            {gift.occasion} Gift
          </h1>
          <p className="text-lg text-gray-500">You've received an investment gift!</p>
        </div>

        <Card className="p-6 sm:p-8 mb-8">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-1">${gift.amount.toFixed(2)}</div>
            <div className="text-lg text-gray-600">{gift.etfSymbol}</div>
          </div>
          {gift.note && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
              <p className="text-gray-700 italic">"{gift.note}"</p>
            </div>
          )}
          <div className="text-center text-sm text-gray-400">
            For {gift.recipientName}
          </div>
        </Card>

        {isSender ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm text-center">
            <strong>No puedes reclamar este regalo.</strong><br />
            Eres quien lo envio. Solo el destinatario puede reclamarlo.
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm text-center" role="alert">{error}</div>
            )}
            <div className="space-y-4">
              <Button onClick={handleStart} loading={starting} className="w-full" size="lg">
                Tengo 18 anos o mas - Continuar
              </Button>
              <Button onClick={handleStart} loading={starting} variant="secondary" className="w-full" size="lg">
                Tengo menos de 18 - Continuar con tutor
              </Button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">
              Al continuar, aceptas verificar tu identidad para recibir este regalo de inversion.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
