import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { ETFReviewForm } from '../components/ETFReviewForm';
import apiClient from '../api/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface ConsolidatedGiftItem {
  giftId: string;
  claimToken: string;
  occasion: string;
  amountInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  investedAt: string;
  isRedeemed: boolean;
  redeemedAmount?: number;
}

interface ConsolidatedPositionItem {
  etfSymbol: string;
  etfName: string;
  totalInvested: number;
  totalCurrentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  changePercent: number;
  gifts: ConsolidatedGiftItem[];
}

interface ConsolidatedPortfolio {
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  positions: ConsolidatedPositionItem[];
}

const PERIODS = ['1D', '1W', '1M', '1Y', 'ALL'] as const;
type Period = (typeof PERIODS)[number];

interface HistoryPoint { date: string; value: number; }
interface PortfolioHistoryResponse {
  period: string;
  data: HistoryPoint[];
  totalInvested: number;
  totalCurrentValue: number;
}

function PortfolioValueChart({ totalInvested, totalCurrentValue }: { totalInvested: number; totalCurrentValue: number }) {
  const [period, setPeriod] = useState<Period>('1M');
  const [chartData, setChartData] = useState<HistoryPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setChartLoading(true);
    apiClient
      .get<PortfolioHistoryResponse>('/recipient/portfolio/consolidated/history', {
        params: { period },
        signal: controller.signal,
      })
      .then(res => setChartData(res.data.data))
      .catch(() => setChartData([]))
      .finally(() => setChartLoading(false));
    return () => controller.abort();
  }, [period]);

  const isPositive = totalCurrentValue >= totalInvested;
  const strokeColor = isPositive ? '#22c55e' : '#ef4444';
  const gradientId = 'portfolioGradient';

  return (
    <div className="mt-6">
      {/* Period tabs */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Time period">
        {PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            role="tab"
            aria-selected={period === p}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              period === p
                ? 'bg-[#F5C518] text-black'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-52">
        {chartLoading ? (
          <div className="h-full bg-white/5 rounded-xl animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500 text-sm">
            No historical data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickFormatter={(val: number) => `$${val % 1 === 0 ? val : val.toFixed(0)}`}
                domain={['dataMin - 2', 'dataMax + 2']}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e2d45',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: 13,
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Portfolio value']}
                labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, fill: strokeColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// Shows either "my $" (dollar-scaled) or "ETF price" (raw) for one position
function PositionChart({
  etfSymbol,
  totalCurrentValue,
}: {
  etfSymbol: string;
  totalCurrentValue: number;
}) {
  const [period, setPeriod] = useState<Period>('1M');
  const [tab, setTab] = useState<'money' | 'price'>('money');
  const [raw, setRaw] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    apiClient
      .get<{ symbol: string; period: string; data: HistoryPoint[] }>(
        `/etfs/${etfSymbol}/history`,
        { params: { period }, signal: controller.signal }
      )
      .then(res => setRaw(res.data.data ?? []))
      .catch(() => setRaw([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [etfSymbol, period]);

  const chartData = useMemo(() => {
    if (!raw.length) return [];
    if (tab === 'price') return raw;
    const lastPrice = raw[raw.length - 1].value;
    if (!lastPrice) return [];
    return raw.map(p => ({
      date: p.date,
      value: Number(((p.value / lastPrice) * totalCurrentValue).toFixed(2)),
    }));
  }, [raw, tab, totalCurrentValue]);

  const isPositive = chartData.length > 1
    ? chartData[chartData.length - 1].value >= chartData[0].value
    : true;
  const lineColor = isPositive ? '#22c55e' : '#ef4444';

  return (
    <div className="px-5 pt-4 pb-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
      {/* View toggle */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('money')}
            className={`px-3 py-1.5 transition-colors ${
              tab === 'money'
                ? 'bg-[#F5C518] text-black'
                : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            My investment ($)
          </button>
          <button
            type="button"
            onClick={() => setTab('price')}
            className={`px-3 py-1.5 transition-colors ${
              tab === 'price'
                ? 'bg-[#F5C518] text-black'
                : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {etfSymbol} price
          </button>
        </div>

        {/* Period pills */}
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                period === p
                  ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-44">
        {loading ? (
          <div className="h-full rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id={`pos-grad-${etfSymbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(v: string) => { const d = new Date(v); return `${d.getMonth()+1}/${d.getDate()}`; }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickFormatter={(v: number) => `$${v % 1 === 0 ? v : v.toFixed(tab === 'money' ? 0 : 2)}`}
                domain={['dataMin - 1', 'dataMax + 1']}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                formatter={(v: number) => [
                  `$${v.toFixed(2)}`,
                  tab === 'money' ? 'My investment' : `${etfSymbol} price`,
                ]}
                labelFormatter={(l: string) => new Date(l).toLocaleDateString()}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                fill={`url(#pos-grad-${etfSymbol})`}
                dot={false}
                activeDot={{ r: 3, fill: lineColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Contextual label */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
        {tab === 'money'
          ? `How your $${totalCurrentValue.toFixed(2)} in ${etfSymbol} has moved over this period`
          : `${etfSymbol} share price — not your investment value`}
      </p>
    </div>
  );
}

function ChangeTag({ value, showSign = true }: { value: number; showSign?: boolean }) {
  const pos = value >= 0;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {showSign && (pos ? '+' : '')}{value.toFixed(2)}%
    </span>
  );
}

function PositionCard({ pos, onSold }: { pos: ConsolidatedPositionItem; onSold: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [sellGiftToken, setSellGiftToken] = useState<string | null>(null);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellError, setSellError] = useState('');
  const isPositive = pos.gainLoss >= 0;
  const allRedeemed = pos.gifts.every((g) => g.isRedeemed);

  const handleSell = async (claimToken: string) => {
    setSellLoading(true);
    setSellError('');
    try {
      await apiClient.post(`/recipient/portfolio/${claimToken}/sell`);
      setSellGiftToken(null);
      onSold();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setSellError(axiosErr.response?.data?.error || 'Could not complete the sale.');
      } else {
        setSellError('Could not complete the sale. Please try again.');
      }
    } finally {
      setSellLoading(false);
    }
  };

  return (
    <Card className={`overflow-hidden ${allRedeemed ? 'opacity-75' : ''}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
            <span className="font-bold text-sm text-gray-800 dark:text-gray-200">{pos.etfSymbol.slice(0, 3)}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900 dark:text-white">{pos.etfSymbol}</span>
              <ChangeTag value={pos.changePercent} />
              {allRedeemed && (
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Redeemed</span>
              )}
            </div>
            <div className="text-xs text-gray-400 truncate">{pos.etfName}</div>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-gray-400">Invested</div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">${pos.totalInvested.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">{allRedeemed ? 'Redeemed' : 'Current value'}</div>
            <div className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              ${pos.totalCurrentValue.toFixed(2)}
            </div>
            <div className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}${pos.gainLoss.toFixed(2)} ({isPositive ? '+' : ''}{pos.gainLossPercent.toFixed(2)}%)
            </div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
          {pos.gifts.map((gift) => {
            const gPos = gift.gainLoss >= 0;
            return (
              <div key={gift.giftId} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{gift.occasion}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(gift.investedAt).toLocaleDateString()}
                    {gift.isRedeemed && (
                      <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full text-xs">Sold</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-gray-400">Invested</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">${gift.amountInvested.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{gift.isRedeemed ? 'Redeemed' : 'Current'}</div>
                    <div className={`text-sm font-semibold ${gPos ? 'text-green-600' : 'text-red-500'}`}>
                      ${gift.currentValue.toFixed(2)}
                    </div>
                    <div className={`text-xs ${gPos ? 'text-green-500' : 'text-red-400'}`}>
                      {gPos ? '+' : ''}{gift.gainLossPercent.toFixed(2)}%
                    </div>
                  </div>
                  {!gift.isRedeemed && (
                    <>
                      <Link
                        to={`/recipient/${gift.claimToken}/dashboard`}
                        className="text-xs font-semibold text-[#F5C518] hover:underline whitespace-nowrap"
                      >
                        View detail
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSellGiftToken(gift.claimToken)}
                        className="text-xs font-semibold text-red-500 hover:text-red-700 whitespace-nowrap"
                      >
                        Sell
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Per-position chart — visible when expanded */}
      {expanded && (
        <PositionChart
          etfSymbol={pos.etfSymbol}
          totalCurrentValue={pos.totalCurrentValue}
        />
      )}

      {/* Review section — visible when expanded */}
      {expanded && <ETFReviewForm etfSymbol={pos.etfSymbol} />}

      {sellGiftToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Confirm Sale</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This action cannot be undone. Funds will be transferred within 1-3 business days.</p>
            {sellError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-xs mb-3" role="alert">{sellError}</div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleSell(sellGiftToken)}
                disabled={sellLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50"
              >
                {sellLoading ? 'Processing...' : 'Confirm Sale'}
              </button>
              <button
                type="button"
                onClick={() => { setSellGiftToken(null); setSellError(''); }}
                disabled={sellLoading}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function RecipientPortfolioPage() {
  const [data, setData] = useState<ConsolidatedPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await apiClient.get<ConsolidatedPortfolio>('/recipient/portfolio/consolidated');
      setData(res.data);
    } catch {
      setError('Could not load your portfolio. Make sure you have accepted gifts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isPositive = (data?.totalGainLoss ?? 0) >= 0;
  const hasPositions = (data?.positions.length ?? 0) > 0;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
              <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900 dark:text-white">WealthGift</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Portfolio</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">All investments you have received as gifts</p>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
                <span className="sr-only">Loading</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>
          )}

          {!loading && data && (
            <>
              {/* Hero totals + portfolio chart */}
              <div className="p-6 mb-6 bg-[#1a2235] text-white rounded-xl shadow-sm">
                <div className="grid sm:grid-cols-3 gap-6 mb-2">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total invested</div>
                    <div className="text-3xl font-bold text-white">${data.totalInvested.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Current value</div>
                    <div className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      ${data.totalCurrentValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total gain / loss</div>
                    <div className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}${data.totalGainLoss.toFixed(2)}
                    </div>
                    <div className={`text-sm font-medium mt-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{data.totalGainLossPercent.toFixed(2)}% total return
                    </div>
                  </div>
                </div>

                {/* Portfolio value chart — shows how total portfolio $$$ has moved */}
                {hasPositions && (
                  <PortfolioValueChart
                    totalInvested={data.totalInvested}
                    totalCurrentValue={data.totalCurrentValue}
                  />
                )}
              </div>

              {!hasPositions ? (
                <Card className="p-10 text-center">
                  <svg className="w-14 h-14 mx-auto text-gray-200 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No investments yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Your accepted gift investments will appear here once they are invested.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-gray-700 dark:text-gray-300">
                      {data.positions.length} {data.positions.length === 1 ? 'position' : 'positions'}
                    </h2>
                    <span className="text-xs text-gray-400">Click each ETF to see details</span>
                  </div>
                  {data.positions.map((pos, pi) => (
                    <div key={pos.etfSymbol} className="animate-slideUp" style={{ animationDelay: `${pi * 70}ms`, animationFillMode: 'both' }}>
                      <PositionCard pos={pos} onSold={fetchData} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
