import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
  transactions: RecipientTransaction[];
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
  BUY: { bg: 'bg-green-50', text: 'text-green-700' },
  SELL: { bg: 'bg-red-50', text: 'text-red-700' },
  DIVIDEND: { bg: 'bg-blue-50', text: 'text-blue-700' },
};

export default function RecipientDashboard() {
  const { claimToken } = useParams<{ claimToken: string }>();
  const [portfolio, setPortfolio] = useState<RecipientPortfolio | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [period, setPeriod] = useState<Period>('1M');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sellLoading, setSellLoading] = useState(false);
  const [sellSuccess, setSellSuccess] = useState<{ amountReturned: number; message: string } | null>(null);
  const [showSellModal, setShowSellModal] = useState(false);

  const fetchPortfolio = useCallback(async () => {
    if (!claimToken) return;
    try {
      const res = await apiClient.get<RecipientPortfolio>(`/recipient/portfolio/${claimToken}`);
      setPortfolio(res.data);
    } catch {
      setError('No se pudo cargar el portafolio. Verifica que el enlace sea correcto.');
    }
  }, [claimToken]);

  const fetchHistory = useCallback(async () => {
    if (!claimToken) return;
    try {
      const res = await apiClient.get<HistoryResponse>(`/recipient/portfolio/${claimToken}/history`, {
        params: { period },
      });
      setHistory(res.data.data);
    } catch {
      // History might fail independently
    }
  }, [claimToken, period]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchPortfolio(), fetchHistory()]);
      setLoading(false);
    };
    load();
  }, [fetchPortfolio, fetchHistory]);

  // Polling every 30s for portfolio updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPortfolio();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const handleSell = async () => {
    if (!claimToken) return;
    setSellLoading(true);
    try {
      const res = await apiClient.post<{ success: boolean; amountReturned: number; message: string }>(
        `/recipient/portfolio/${claimToken}/sell`
      );
      setSellSuccess({ amountReturned: res.data.amountReturned, message: res.data.message });
      setShowSellModal(false);
      // Refresh portfolio to get updated isRedeemed status
      fetchPortfolio();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Error al vender la inversion.');
      } else {
        setError('Error al vender la inversion. Intenta de nuevo.');
      }
    } finally {
      setSellLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
          <span className="sr-only">Cargando</span>
        </div>
      </div>
    );
  }

  if (error && !portfolio) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Card className="p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Portafolio no disponible</h1>
            <p className="text-gray-500">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!portfolio) return null;

  const isPositive = portfolio.gainLoss >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Card 1 - Portfolio value */}
        <Card className="p-6 sm:p-8 mb-6">
          <div className="mb-1 text-sm text-gray-500">{portfolio.etfSymbol} &middot; {portfolio.recipientName}</div>
          <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1">
            ${portfolio.totalValue.toFixed(2)}
          </div>
          <div className={`text-lg font-semibold flex items-center gap-2 mb-6 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            <span>{isPositive ? '+' : ''}${portfolio.gainLoss.toFixed(2)}</span>
            <span className="text-sm">({isPositive ? '+' : ''}{portfolio.gainLossPercent.toFixed(2)}%)</span>
          </div>

          {/* Period tabs */}
          <div className="flex gap-2 mb-6" role="tablist" aria-label="Periodo de tiempo">
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
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Valor']}
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
                No hay datos de historial disponibles para este periodo.
              </div>
            )}
          </div>
        </Card>

        {/* Card 2 - Holdings */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Holdings</h2>
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#F5C518]/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-[#F5C518]">{portfolio.etfSymbol.charAt(0)}</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{portfolio.etfSymbol}</div>
                <div className="text-sm text-gray-500">{portfolio.shares.toFixed(4)} acciones</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">${portfolio.totalValue.toFixed(2)}</div>
              <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                {isPositive ? '+' : ''}{portfolio.gainLossPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3 - Transaction History */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Historial de Transacciones</h2>
          {portfolio.transactions.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No hay transacciones registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-3 pr-4 font-medium">Fecha</th>
                    <th className="py-3 pr-4 font-medium">Tipo</th>
                    <th className="py-3 pr-4 font-medium text-right">Acciones</th>
                    <th className="py-3 pr-4 font-medium text-right">Precio/accion</th>
                    <th className="py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.transactions.map((tx, i) => {
                    const badge = TYPE_BADGES[tx.type] || TYPE_BADGES.BUY;
                    return (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-3 pr-4 text-gray-700">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-700">{tx.shares.toFixed(4)}</td>
                        <td className="py-3 pr-4 text-right text-gray-700">${tx.pricePerShare.toFixed(2)}</td>
                        <td className="py-3 text-right font-medium text-gray-900">${tx.total.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Card 4 - Sell investment */}
        {sellSuccess ? (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <h2 className="text-lg font-bold text-green-800">Venta exitosa</h2>
            </div>
            <p className="text-green-700">{sellSuccess.message}</p>
            <p className="text-green-800 font-semibold mt-2">
              Monto recibido: ${sellSuccess.amountReturned.toFixed(2)}
            </p>
          </Card>
        ) : portfolio.isRedeemed ? (
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div>
                <h2 className="text-lg font-bold text-yellow-800">Inversion vendida</h2>
                <p className="text-yellow-700 text-sm">Esta inversion ya fue vendida. Los fondos estan siendo procesados.</p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Vender mi inversion</h2>
            <p className="text-sm text-gray-500 mb-4">
              Al vender, los fondos seran transferidos a tu cuenta en 1-3 dias habiles.
            </p>
            <p className="text-gray-700 mb-4">
              Recibiras aproximadamente: <span className="font-bold">${portfolio.totalValue.toFixed(2)}</span>
            </p>
            <Button
              onClick={() => setShowSellModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Vender mi inversion
            </Button>
          </Card>
        )}

        {/* Sell confirmation modal */}
        {showSellModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSellModal(false); }}
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar venta"
          >
            <Card className="w-full max-w-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmas la venta?</h3>
              <p className="text-gray-700 mb-1">
                Recibiras: <span className="font-bold">${portfolio.totalValue.toFixed(2)}</span>
              </p>
              <p className="text-sm text-red-500 mb-6">Esta accion no se puede deshacer.</p>
              <div className="flex gap-3">
                <Button
                  onClick={handleSell}
                  loading={sellLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmar venta
                </Button>
                <Button variant="secondary" onClick={() => setShowSellModal(false)} disabled={sellLoading}>
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
            <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-bold text-gray-900">WealthGift</span>
        <span className="text-gray-400 mx-2">|</span>
        <span className="text-gray-500 text-sm">Tu Portafolio de Regalo</span>
      </div>
    </header>
  );
}
