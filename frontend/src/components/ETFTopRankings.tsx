import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export interface ETFRanking {
  symbol: string;
  name: string;
  category: string;
  description: string;
  rank: number;
  giftCount: number;
  recentGiftCount: number;
  averageRating: number;
  senderAverageRating: number;
  receiverAverageRating: number;
  totalRatings: number;
  rankScore: number;
  trend: 'up' | 'down' | 'stable';
  price?: number;
  changePercent?: number;
}

interface CategoryETFsResponse {
  category: string;
  topETFs: ETFRanking[];
}

interface Props {
  category: string;
  onSelectETF: (symbol: string) => void;
  selectedETF: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const RANK_STYLES = [
  'from-yellow-400 to-amber-500',
  'from-gray-300 to-gray-400',
  'from-orange-300 to-orange-500',
];

function MiniStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} stars`}>
      <span className="text-[#F5C518] text-xs">★</span>
      <span className="text-white/70 text-xs font-medium">{value.toFixed(1)}</span>
    </span>
  );
}

export function ETFTopRankings({ category, onSelectETF, selectedETF }: Props) {
  const [etfs, setEtfs] = useState<ETFRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) {
      setEtfs([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    apiClient
      .get<CategoryETFsResponse>(`/rankings/etfs/${encodeURIComponent(category)}`, { signal: controller.signal })
      .then((res) => setEtfs(res.data.topETFs ?? []))
      .catch(() => setEtfs([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [category]);

  const top3 = etfs.slice(0, 3);

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#0d1829] via-[#111f35] to-[#0a1628] border border-white/5 p-4">
        <div className="h-3 w-40 bg-white/10 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (top3.length === 0) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#0d1829] via-[#111f35] to-[#0a1628] border border-white/5 p-4">
        <span className="text-xs font-semibold text-[#F5C518] uppercase tracking-widest">Top ETFs</span>
        <p className="text-sm text-white/40 py-3 text-center">No ranking data for this category yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0d1829] via-[#111f35] to-[#0a1628] border border-white/5 p-4 animate-fadeIn">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-[#F5C518] uppercase tracking-widest">Top ETFs</span>
        <span className="text-xs text-white/30 truncate">in {category}</span>
      </div>

      <div className="space-y-2">
        {top3.map((etf, i) => {
          const selected = selectedETF === etf.symbol;
          return (
            <button
              type="button"
              key={etf.symbol}
              onClick={() => onSelectETF(etf.symbol)}
              aria-pressed={selected}
              className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all bg-white/5 hover:bg-white/10 border-2 ${
                selected ? 'border-[#F5C518] ring-2 ring-[#F5C518]/30' : 'border-transparent'
              }`}
            >
              <div className={`flex-shrink-0 rounded-full p-[2px] bg-gradient-to-br ${RANK_STYLES[i]}`}>
                <div className="bg-[#0d1829] rounded-full w-8 h-8 flex items-center justify-center text-base">
                  {MEDALS[i]}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{etf.symbol}</span>
                  <span className="text-[10px] text-white/40 bg-white/10 rounded-full px-2 py-0.5 truncate">{etf.category}</span>
                </div>
                <div className="text-xs text-white/50 truncate">{etf.name}</div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                <MiniStars value={etf.averageRating} />
                <span className="text-[10px] text-white/40">{etf.giftCount} {etf.giftCount === 1 ? 'gift' : 'gifts'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ETFTopRankings;
