import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Card } from '../components/ui/Card';
import apiClient from '../api/client';
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
