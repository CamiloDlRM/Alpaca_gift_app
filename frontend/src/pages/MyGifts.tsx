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
  PENDING:          { bg: 'bg-yellow-50',  text: 'text-yellow-700',  label: 'Pending' },
  CLAIMING:         { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'Claiming' },
  KYC_SUBMITTED:    { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'KYC Submitted' },
  KYC_VERIFIED:     { bg: 'bg-blue-50',    text: 'text-blue-700',    label: 'KYC Verified' },
  AGREEMENT_SIGNED: { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Agreement Signed' },
  ACCOUNT_CREATING: { bg: 'bg-purple-50',  text: 'text-purple-700',  label: 'Creating Account' },
  INVESTED:         { bg: 'bg-green-50',   text: 'text-green-700',   label: 'Invested' },
  REDEEMED:         { bg: 'bg-gray-100',   text: 'text-gray-600',    label: 'Redeemed' },
  FAILED:           { bg: 'bg-red-50',     text: 'text-red-700',     label: 'Failed' },
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Gifts</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{gifts.length} gift{gifts.length !== 1 ? 's' : ''} sent</p>
            </div>
            <Link to="/send"><Button>Send new gift</Button></Link>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6">
            {(['ALL', 'PENDING', 'INVESTED', 'FAILED'] as FilterStatus[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-[#F5C518] text-black'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {f === 'ALL' ? 'All' : f === 'PENDING' ? 'In Progress' : f === 'INVESTED' ? 'Invested' : 'Failed'}
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No gifts here</h3>
              <p className="text-gray-500 dark:text-gray-400">Send your first investment gift.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((gift, gi) => {
                const st = STATUS_COLORS[gift.status] || STATUS_COLORS.PENDING;
                const emoji = OCCASION_EMOJIS[gift.occasion] ?? '🎁';
                return (
                  <Card key={gift.id} className="p-5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 animate-slideUp" style={{ animationDelay: `${gi * 50}ms`, animationFillMode: 'both' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-[#F5C518]/10 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                          {emoji}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white">{gift.recipientName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {gift.occasion} · {gift.etfSymbol} · {gift.deliveryDate ? new Date(gift.deliveryDate).toLocaleDateString() : `Sent ${new Date(gift.createdAt).toLocaleDateString()}`}
                          </div>
                          {gift.note && <div className="text-xs text-gray-400 italic mt-0.5 truncate">"{gift.note}"</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="font-bold text-gray-900 dark:text-white">${gift.amount.toFixed(2)}</div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>{st.label}</span>
                        </div>
                        {gift.status === 'INVESTED' && (
                          <Link to={`/dashboard/gift/${gift.id}`} className="text-sm text-[#F5C518] font-semibold hover:underline">View</Link>
                        )}
                        {gift.status === 'PENDING' && (
                          <button
                            onClick={() => copyLink(gift.claimLink, gift.id)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            {copied === gift.id ? '✓ Copied' : 'Copy link'}
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
