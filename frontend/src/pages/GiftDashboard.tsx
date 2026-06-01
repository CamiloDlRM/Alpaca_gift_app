import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Card } from '../components/ui/Card';
import apiClient from '../api/client';

// Inline sender rating card — lets the gift sender rate the ETF as SENDER
function SenderRatingCard({ symbol }: { symbol: string }) {
  const [hover, setHover] = useState(0);
  const [rating, setRating] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ userSenderRating: { stars: number } | null }>(`/etf-ratings/${symbol}`)
      .then(res => {
        const r = res.data.userSenderRating;
        if (r) { setRating(r.stars); setSaved(true); }
      })
      .catch(() => {});
  }, [symbol]);

  const handleRate = async (stars: number) => {
    if (saving) return;
    setRating(stars);
    setSaving(true);
    try {
      await apiClient.post(`/etf-ratings/${symbol}`, { stars, role: 'SENDER' });
      setSaved(true);
    } catch { /* non-blocking */ }
    finally { setSaving(false); }
  };

  const display = hover || rating;

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-[#F5C518]/15 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#F5C518]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </div>
        <div>
          <h2 className="font-bold text-gray-900 dark:text-white text-base">Rate {symbol} as a gift</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Your rating as the sender · helps others choose great ETF gifts
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex gap-1" role="radiogroup" aria-label={`Rate ${symbol}`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} star${i === 1 ? '' : 's'}`}
              disabled={saving}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              onClick={() => handleRate(i)}
              className={`transition-all duration-100 hover:scale-125 active:scale-95 disabled:cursor-not-allowed ${
                i <= display ? 'text-[#F5C518]' : 'text-gray-200 dark:text-gray-600'
              }`}
            >
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </button>
          ))}
        </div>
        <div className="ml-2 text-sm min-w-0">
          {saved && rating > 0 && (
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]} · {rating}/5
            </span>
          )}
          {!saved && (
            <span className="text-gray-400 dark:text-gray-500 text-xs">Tap to rate instantly</span>
          )}
          {saved && saving && (
            <span className="text-gray-400 text-xs">Saving…</span>
          )}
        </div>
      </div>

      {saved && !saving && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
          Rating saved — you can update it anytime
        </div>
      )}
    </Card>
  );
}
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PortfolioData {
  giftId: string;
  symbol: string;
  accountId: string;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  shares: number;
}

interface HistoryPoint {
  date: string;
  value: number;
}

interface HistoryResponse {
  period: string;
  data: HistoryPoint[];
}

const PERIODS = ['1D', '1W', '1M', '1Y', 'ALL'] as const;
type Period = typeof PERIODS[number];

export default function GiftDashboard() {
  const { giftId } = useParams<{ giftId: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [period, setPeriod] = useState<Period>('1M');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPortfolio = useCallback(async () => {
    if (!giftId) return;
    try {
      const res = await apiClient.get<PortfolioData>(`/portfolio/${giftId}`);
      setPortfolio(res.data);
    } catch {
      setError('Failed to load portfolio data.');
    }
  }, [giftId]);

  const fetchHistory = useCallback(async () => {
    if (!giftId) return;
    try {
      const res = await apiClient.get<HistoryResponse>(`/portfolio/${giftId}/history`, {
        params: { period },
      });
      setHistory(res.data.data);
    } catch {
      // History might fail independently
    }
  }, [giftId, period]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPortfolio(), fetchHistory()]);
      setLoading(false);
    };
    load();
  }, [fetchPortfolio, fetchHistory]);

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

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Portfolio Unavailable</h1>
          <p className="text-gray-500">{error || 'Could not load portfolio data.'}</p>
        </div>
      </div>
    );
  }

  const isPositive = portfolio.gainLoss >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Your Gift is Growing</h1>

        {/* Value display */}
        <Card className="p-6 sm:p-8 mb-6">
          <div className="mb-6">
            <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1">
              ${portfolio.totalValue.toFixed(2)}
            </div>
            <div className={`text-lg font-semibold flex items-center gap-2 ${isPositive ? 'text-positive' : 'text-red-500'}`}>
              <span>{isPositive ? '+' : ''}{portfolio.gainLoss.toFixed(2)}</span>
              <span className="text-sm">({isPositive ? '+' : ''}{portfolio.gainLossPercent.toFixed(2)}%)</span>
            </div>
          </div>

          {/* Period tabs */}
          <div className="flex gap-2 mb-6" role="tablist">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[#F5C518] text-black'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                role="tab"
                aria-selected={period === p}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5C518" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#F5C518" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(val: string) => {
                    const d = new Date(val);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#9ca3af' }}
                  tickFormatter={(val: number) => `$${val}`}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                  labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#F5C518"
                  strokeWidth={2}
                  fill="url(#goldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Holdings */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Holdings</h2>
          <div className="flex items-center justify-between py-4 border-b border-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F5C518]/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-[#F5C518]">{portfolio.symbol.charAt(0)}</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{portfolio.symbol}</div>
                <div className="text-sm text-gray-500">{portfolio.shares.toFixed(4)} shares</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">${portfolio.totalValue.toFixed(2)}</div>
              <div className={`text-sm font-medium ${isPositive ? 'text-positive' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{portfolio.gainLossPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </Card>

        {/* Sender rating */}
        <SenderRatingCard symbol={portfolio.symbol} />

        {/* Disclaimer */}
        <div className="text-xs text-gray-400 text-center leading-relaxed max-w-2xl mx-auto">
          <p>
            Investment values are subject to market fluctuations and may decrease in value. Past performance does not
            guarantee future results. WealthGift does not provide investment advice. Securities are held by our clearing
            partner, a registered broker-dealer and member of FINRA/SIPC.
          </p>
        </div>
      </div>
    </div>
  );
}
