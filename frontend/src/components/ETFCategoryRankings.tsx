import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export interface CategoryRanking {
  category: string;
  rank: number;
  giftCount: number;
  recentGiftCount: number;
  averageRating: number;
  senderAverageRating: number;
  receiverAverageRating: number;
  totalRatings: number;
  rankScore: number;
  trend: 'up' | 'down' | 'stable';
}

interface Props {
  onSelectCategory: (category: string) => void;
  selectedCategory: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

const RANK_STYLES = [
  'from-yellow-400 to-amber-500', // gold
  'from-gray-300 to-gray-400',    // silver
  'from-orange-300 to-orange-500', // bronze
];

function TrendArrow({ trend }: { trend: CategoryRanking['trend'] }) {
  if (trend === 'up') return <span className="text-green-400" aria-label="trending up">↑</span>;
  if (trend === 'down') return <span className="text-red-400" aria-label="trending down">↓</span>;
  return <span className="text-gray-400" aria-label="stable">→</span>;
}

function MiniStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} stars`}>
      <span className="text-[#F5C518] text-xs">★</span>
      <span className="text-white/70 text-xs font-medium">{value.toFixed(1)}</span>
    </span>
  );
}

export function ETFCategoryRankings({ onSelectCategory, selectedCategory }: Props) {
  const [rankings, setRankings] = useState<CategoryRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiClient
      .get<CategoryRanking[]>('/rankings/categories')
      .then((res) => { if (active) setRankings(res.data); })
      .catch(() => { if (active) setRankings([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const top3 = rankings.slice(0, 3);

  if (loading) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-[#0d1829] via-[#111f35] to-[#0a1628] border border-white/5 p-4">
        <div className="h-3 w-32 bg-white/10 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasData = top3.length > 0 && top3.some((c) => c.giftCount > 0);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#0d1829] via-[#111f35] to-[#0a1628] border border-white/5 p-4 animate-fadeIn">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-[#F5C518] uppercase tracking-widest">Top Categories</span>
        <span className="text-xs text-white/30">Pick a popular category</span>
      </div>

      {top3.length === 0 ? (
        <p className="text-sm text-white/40 py-3 text-center">No category data yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 items-end">
          {top3.map((cat, i) => {
            const selected = selectedCategory === cat.category;
            return (
              <button
                type="button"
                key={cat.category}
                onClick={() => onSelectCategory(cat.category)}
                aria-pressed={selected}
                className={`relative flex flex-col items-center gap-1 rounded-xl p-3 text-center transition-all bg-white/5 hover:bg-white/10 border-2 ${
                  selected ? 'border-[#F5C518] ring-2 ring-[#F5C518]/30' : 'border-transparent'
                } ${i === 0 ? 'pt-4' : ''}`}
              >
                <div className={`rounded-full p-[2px] bg-gradient-to-br ${RANK_STYLES[i]}`}>
                  <div className="bg-[#0d1829] rounded-full w-8 h-8 flex items-center justify-center text-lg">
                    {MEDALS[i]}
                  </div>
                </div>
                <span className="text-xs font-bold text-white leading-tight line-clamp-2">{cat.category}</span>
                <div className="flex items-center gap-1.5">
                  <MiniStars value={cat.averageRating} />
                  <TrendArrow trend={cat.trend} />
                </div>
                {hasData ? (
                  <span className="text-[10px] text-white/40">{cat.giftCount} {cat.giftCount === 1 ? 'gift' : 'gifts'}</span>
                ) : (
                  <span className="text-[10px] font-semibold text-[#F5C518] bg-[#F5C518]/15 rounded-full px-2 py-0.5">New</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ETFCategoryRankings;
