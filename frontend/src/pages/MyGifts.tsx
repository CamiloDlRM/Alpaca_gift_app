import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import apiClient from '../api/client';

interface GiftResponse {
  id: string;
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

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:          { bg: 'bg-yellow-50',  text: 'text-yellow-700',  label: 'Pendiente' },
  CLAIMING:         { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Reclamando' },
  KYC_SUBMITTED:    { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'KYC enviado' },
  KYC_VERIFIED:     { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'KYC verificado' },
  AGREEMENT_SIGNED: { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Acuerdo firmado' },
  ACCOUNT_CREATING: { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Creando cuenta' },
  INVESTED:         { bg: 'bg-green-50',   text: 'text-green-700',   label: 'Invertido' },
  REDEEMED:         { bg: 'bg-gray-100',   text: 'text-gray-600',    label: 'Redimido' },
  FAILED:           { bg: 'bg-red-50',     text: 'text-red-700',     label: 'Fallido' },
};

const OCCASION_EMOJIS: Record<string, string> = {
  Birthday: '🎂', Anniversary: '💍', Graduation: '🎓',
  'Baby Shower': '👶', Holiday: '🎄', 'Just Because': '💝',
  Wedding: '💒', Achievement: '🏆',
};

type FilterStatus = 'ALL' | 'PENDING' | 'INVESTED' | 'FAILED';

export default function MyGifts() {
  const [gifts, setGifts] = useState<GiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [copied, setCopied] = useState<string>('');

  const fetchGifts = useCallback(async () => {
    try {
      const res = await apiClient.get<GiftResponse[]>('/gifts');
      setGifts(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  const copyLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const filtered = filter === 'ALL'
    ? gifts
    : filter === 'PENDING'
    ? gifts.filter(g => !['INVESTED', 'REDEEMED', 'FAILED'].includes(g.status))
    : gifts.filter(g => g.status === filter);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Regalos</h1>
              <p className="text-gray-500 mt-1">{gifts.length} regalo{gifts.length !== 1 ? 's' : ''} enviado{gifts.length !== 1 ? 's' : ''}</p>
            </div>
            <Link to="/send"><Button>Enviar nuevo regalo</Button></Link>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {(['ALL', 'PENDING', 'INVESTED', 'FAILED'] as FilterStatus[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f ? 'bg-[#F5C518] text-black' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                }`}
              >
                {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'En proceso' : f === 'INVESTED' ? 'Invertidos' : 'Fallidos'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay regalos aquí</h3>
              <p className="text-gray-500 mb-6">Envía tu primer regalo de inversión.</p>
              <Link to="/send"><Button>Enviar regalo</Button></Link>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(gift => {
                const st = STATUS_COLORS[gift.status] || STATUS_COLORS.PENDING;
                const emoji = OCCASION_EMOJIS[gift.occasion] ?? '🎁';
                return (
                  <Card key={gift.id} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-[#F5C518]/10 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                          {emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900">{gift.recipientName}</div>
                          <div className="text-sm text-gray-500">{gift.occasion} · {gift.etfSymbol} · {new Date(gift.deliveryDate).toLocaleDateString()}</div>
                          {gift.note && <div className="text-xs text-gray-400 italic mt-0.5 truncate">"{gift.note}"</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="font-bold text-gray-900">${gift.amount.toFixed(2)}</div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                        </div>
                        {gift.status === 'INVESTED' && (
                          <Link to={`/dashboard/gift/${gift.id}`} className="text-sm text-[#F5C518] font-semibold hover:underline">Ver</Link>
                        )}
                        {gift.status === 'PENDING' && (
                          <button
                            onClick={() => copyLink(gift.claimLink, gift.id)}
                            className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                          >
                            {copied === gift.id ? '✓ Copiado' : 'Copiar link'}
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
