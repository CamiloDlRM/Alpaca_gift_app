import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import apiClient from '../api/client';

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

function ChangeTag({ value, showSign = true }: { value: number; showSign?: boolean }) {
  const pos = value >= 0;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pos ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {showSign && (pos ? '+' : '')}{value.toFixed(2)}%
    </span>
  );
}

function PositionCard({ pos }: { pos: ConsolidatedPositionItem }) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = pos.gainLoss >= 0;
  const allRedeemed = pos.gifts.every((g) => g.isRedeemed);

  return (
    <Card className={`overflow-hidden ${allRedeemed ? 'opacity-75' : ''}`}>
      {/* Position header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
            <span className="font-bold text-sm text-gray-800">{pos.etfSymbol.slice(0, 3)}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-900">{pos.etfSymbol}</span>
              <ChangeTag value={pos.changePercent} />
              {allRedeemed && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Cobrado</span>
              )}
            </div>
            <div className="text-xs text-gray-400 truncate">{pos.etfName}</div>
          </div>
        </div>

        <div className="flex items-center gap-6 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-gray-400">Invertido</div>
            <div className="font-semibold text-gray-700">${pos.totalInvested.toFixed(2)}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">{allRedeemed ? 'Cobrado' : 'Valor actual'}</div>
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

      {/* Expanded gift breakdown */}
      {expanded && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {pos.gifts.map((gift) => {
            const gPos = gift.gainLoss >= 0;
            return (
              <div key={gift.giftId} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800">{gift.occasion}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(gift.investedAt).toLocaleDateString()}
                    {gift.isRedeemed && (
                      <span className="ml-2 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full text-xs">Vendido</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-right">
                  <div className="hidden sm:block">
                    <div className="text-xs text-gray-400">Invertido</div>
                    <div className="text-sm text-gray-600">${gift.amountInvested.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">{gift.isRedeemed ? 'Cobrado' : 'Actual'}</div>
                    <div className={`text-sm font-semibold ${gPos ? 'text-green-600' : 'text-red-500'}`}>
                      ${gift.currentValue.toFixed(2)}
                    </div>
                    <div className={`text-xs ${gPos ? 'text-green-500' : 'text-red-400'}`}>
                      {gPos ? '+' : ''}{gift.gainLossPercent.toFixed(2)}%
                    </div>
                  </div>
                  {!gift.isRedeemed && (
                    <Link
                      to={`/recipient/${gift.claimToken}/dashboard`}
                      className="text-xs font-semibold text-[#F5C518] hover:underline whitespace-nowrap"
                    >
                      Ver detalle
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
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
      setError('No se pudo cargar tu portafolio. Verifica que tengas regalos aceptados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isPositive = (data?.totalGainLoss ?? 0) >= 0;
  const hasPositions = (data?.positions.length ?? 0) > 0;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
              <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-gray-900">WealthGift</span>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mi Portafolio</h1>
            <p className="text-gray-500 mt-1">Todas las inversiones que has recibido como regalo</p>
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
                <span className="sr-only">Cargando</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>
          )}

          {!loading && data && (
            <>
              {/* Hero: totales globales */}
              <Card className="p-6 mb-6 bg-[#1a2235] text-white border-0">
                <div className="grid sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Total invertido</div>
                    <div className="text-3xl font-bold">${data.totalInvested.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Valor actual</div>
                    <div className="text-3xl font-bold">${data.totalCurrentValue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Ganancia / Perdida total</div>
                    <div className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}${data.totalGainLoss.toFixed(2)}
                    </div>
                    <div className={`text-sm font-medium mt-0.5 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{data.totalGainLossPercent.toFixed(2)}% rendimiento total
                    </div>
                  </div>
                </div>
              </Card>

              {/* Posiciones por ETF */}
              {!hasPositions ? (
                <Card className="p-10 text-center">
                  <svg className="w-14 h-14 mx-auto text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin inversiones aun</h3>
                  <p className="text-gray-500 text-sm">
                    Aqui apareceran todas las inversiones que hayas aceptado como regalo una vez que esten invertidas.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-bold text-gray-700">
                      {data.positions.length} {data.positions.length === 1 ? 'posicion' : 'posiciones'}
                    </h2>
                    <span className="text-xs text-gray-400">Haz clic en cada ETF para ver el detalle</span>
                  </div>
                  {data.positions.map((pos) => (
                    <PositionCard key={pos.etfSymbol} pos={pos} />
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
