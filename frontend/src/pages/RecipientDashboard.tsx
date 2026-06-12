import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import apiClient from '../api/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface RecipientTransaction {
  date: string;
  type: 'BUY' | 'SELL' | 'DIVIDEND';
  shares: number;
  pricePerShare: number;
  total: number;
}

interface RecipientPortfolio {
  giftId: string;
  recipientName: string;
  etfSymbol: string;
  occasion: string;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  shares: number;
  investedAt: string;
  isRedeemed: boolean;
  redeemedAmount?: number;
  transactions: RecipientTransaction[];
  processing?: boolean;
  giftStatus?: string;
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
type Period = (typeof PERIODS)[number];

const TYPE_BADGES: Record<string, { bg: string; text: string }> = {
  BUY:      { bg: 'bg-green-50', text: 'text-green-700' },
  SELL:     { bg: 'bg-red-50',   text: 'text-red-700' },
  DIVIDEND: { bg: 'bg-blue-50',  text: 'text-blue-700' },
};

function ProcessingView({ etfSymbol, recipientName }: { etfSymbol?: string; recipientName?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Card className="p-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-[#F5C518]/15 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Investing your gift
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-1">
            {recipientName && etfSymbol
              ? `We're purchasing ${etfSymbol} for ${recipientName}.`
              : 'Your investment is being processed.'}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            This usually takes a few seconds. This page will update automatically.
          </p>
        </Card>
      </div>
    </div>
  );
}

export default function RecipientDashboard() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const [portfolio, setPortfolio] = useState<RecipientPortfolio | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [period, setPeriod] = useState<Period>('1M');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!claimToken) return;
    try {
      const res = await apiClient.get<RecipientPortfolio>(`/recipient/portfolio/${claimToken}`);
      if (res.data.processing) {
        setIsProcessing(true);
        setPortfolio(res.data);
        setError('');
      } else {
        setIsProcessing(false);
        setPortfolio(res.data);
        setError('');
      }
    } catch {
      setError('Could not load the portfolio. Please verify the link is correct.');
    }
  }, [claimToken]);

  const fetchHistory = useCallback(async () => {
    if (!claimToken || isProcessing) return;
    try {
      const res = await apiClient.get<HistoryResponse>(`/recipient/portfolio/${claimToken}/history`, {
        params: { period },
      });
      setHistory(res.data.data);
    } catch { /* History might fail independently */ }
  }, [claimToken, period, isProcessing]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchPortfolio();
      setLoading(false);
    };
    load();
  }, [fetchPortfolio]);

  // Fetch history once we have a real (non-processing) portfolio
  useEffect(() => {
    if (!isProcessing && portfolio && !portfolio.processing) {
      fetchHistory();
    }
  }, [isProcessing, portfolio, fetchHistory]);

  // Poll every 3s while processing, every 30s otherwise
  useEffect(() => {
    const delay = isProcessing ? 3000 : 30000;
    const interval = setInterval(() => { fetchPortfolio(); }, delay);
    return () => clearInterval(interval);
  }, [fetchPortfolio, isProcessing]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
          <span className="sr-only">Loading</span>
        </div>
      </div>
    );
  }

  if (isProcessing && portfolio) {
    return <ProcessingView etfSymbol={portfolio.etfSymbol} recipientName={portfolio.recipientName} />;
  }

  if (error && !portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Card className="p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Portfolio unavailable</h1>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!portfolio || portfolio.processing) return null;

  const isPositive = portfolio.gainLoss >= 0;

  // Scale raw ETF price history to actual dollar values of this investment
  const currentValue = portfolio.isRedeemed && portfolio.redeemedAmount != null
    ? portfolio.redeemedAmount
    : portfolio.totalValue;
  const scaledHistory = (() => {
    if (!history.length) return [];
    const lastPrice = history[history.length - 1].value;
    if (!lastPrice) return [];
    return history.map(p => ({
      date: p.date,
      value: Number(((p.value / lastPrice) * currentValue).toFixed(2)),
    }));
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Redeemed banner */}
        {portfolio.isRedeemed && portfolio.redeemedAmount != null && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl px-5 py-4 mb-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-green-800 dark:text-green-400">Investment sold successfully</div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Amount received: <span className="font-bold">${portfolio.redeemedAmount.toFixed(2)}</span>
                {' '}&middot; Gain/Loss: <span className="font-bold">{portfolio.gainLoss >= 0 ? '+' : ''}${portfolio.gainLoss.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio value */}
        <Card className="p-6 sm:p-8 mb-6">
          <div className="mb-1 text-sm text-gray-500 dark:text-gray-400">{portfolio.etfSymbol} &middot; {portfolio.recipientName}</div>
          <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-1">
            {portfolio.isRedeemed && portfolio.redeemedAmount != null
              ? `$${portfolio.redeemedAmount.toFixed(2)}`
              : `$${portfolio.totalValue.toFixed(2)}`}
          </div>
          <div className={`text-lg font-semibold flex items-center gap-2 mb-6 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            <span>{isPositive ? '+' : ''}${portfolio.gainLoss.toFixed(2)}</span>
            <span className="text-sm">({isPositive ? '+' : ''}{portfolio.gainLossPercent.toFixed(2)}%)</span>
            {portfolio.isRedeemed && <span className="text-xs font-normal text-gray-400 ml-1">at time of sale</span>}
          </div>

          {/* Period tabs */}
          <div className="flex gap-2 mb-6" role="tablist" aria-label="Time period">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[#F5C518] text-black'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                role="tab"
                aria-selected={period === p}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chart — dollar value of this investment over time */}
          <div className="h-64 sm:h-80">
            {scaledHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scaledHistory} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="recipientGoldGradient" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#recipientGoldGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No history data available for this period.
              </div>
            )}
          </div>
        </Card>

        {/* Holdings */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Holdings</h2>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F5C518]/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-[#F5C518]">{portfolio.etfSymbol.charAt(0)}</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{portfolio.etfSymbol}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{portfolio.shares.toFixed(4)} shares</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900 dark:text-white">${portfolio.totalValue.toFixed(2)}</div>
              <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{portfolio.gainLossPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Transaction History</h2>
          {portfolio.transactions.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No transactions recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                    <th className="py-3 pr-4 font-medium">Date</th>
                    <th className="py-3 pr-4 font-medium">Type</th>
                    <th className="py-3 pr-4 font-medium text-right">Shares</th>
                    <th className="py-3 pr-4 font-medium text-right">Price/share</th>
                    <th className="py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.transactions.map((tx, i) => {
                    const badge = TYPE_BADGES[tx.type] || TYPE_BADGES.BUY;
                    return (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="py-3 pr-4 text-gray-700 dark:text-gray-300">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-700 dark:text-gray-300">{tx.shares.toFixed(4)}</td>
                        <td className="py-3 pr-4 text-right text-gray-700 dark:text-gray-300">${tx.pricePerShare.toFixed(2)}</td>
                        <td className="py-3 text-right font-medium text-gray-900 dark:text-white">${tx.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {/* Back button — prominent on mobile */}
        <a
          href="/dashboard"
          aria-label="Back to dashboard"
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium flex-shrink-0"
        >
          <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </span>
          <span className="text-sm font-semibold hidden sm:inline">Dashboard</span>
        </a>

        {/* Logo */}
        <div className="w-7 h-7 rounded-full bg-[#F5C518] flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">WealthGift</span>
        <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
        <span className="text-gray-500 dark:text-gray-400 text-sm hidden sm:inline">Your Gift Portfolio</span>
      </div>
    </header>
  );
}
