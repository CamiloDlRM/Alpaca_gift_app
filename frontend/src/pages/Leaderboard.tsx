import { useState, useEffect } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import apiClient from '../api/client';
import type { CategoryRanking } from '../components/ETFCategoryRankings';
import type { ETFRanking } from '../components/ETFTopRankings';

interface CategoryETFsResponse {
  category: string;
  topETFs: ETFRanking[];
}

const ETF_TABS = ['All', 'Leading Companies', 'Innovation & Technology', 'Emerging Growth', 'Stability & Income', 'Worldwide Growth'] as const;
type ETFTab = (typeof ETF_TABS)[number];

const MEDALS = ['🥇', '🥈', '🥉'];

function StarsDisplay({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(value) ? 'text-[#F5C518]' : 'text-gray-300 dark:text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <span className="text-green-500 font-bold" aria-label="trending up">↑</span>;
  if (trend === 'down') return <span className="text-red-500 font-bold" aria-label="trending down">↓</span>;
  return <span className="text-gray-400 font-bold" aria-label="stable">→</span>;
}

const MEDAL_TEXT = ['text-yellow-500', 'text-gray-400', 'text-orange-400'];

// --- Category podium ---------------------------------------------------------

function CategoryPodium({ categories }: { categories: CategoryRanking[] }) {
  const order: { cat: CategoryRanking | undefined; idx: number; height: string }[] = [
    { cat: categories[1], idx: 1, height: 'h-32' },
    { cat: categories[0], idx: 0, height: 'h-44' },
    { cat: categories[2], idx: 2, height: 'h-28' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      {order.map(({ cat, idx, height }) =>
        cat ? (
          <div key={cat.category} className="flex flex-col items-center">
            {/* Crown + particles for #1 */}
            {idx === 0 ? (
              <div className="relative flex flex-col items-center mb-1">
                <div className="flex gap-1 mb-0.5">
                  <span className="particle text-yellow-400 text-xs" style={{ animationDelay: '0s' }}>✦</span>
                  <span className="particle text-amber-300 text-xs" style={{ animationDelay: '0.6s' }}>✦</span>
                  <span className="particle text-yellow-500 text-xs" style={{ animationDelay: '1.2s' }}>✦</span>
                </div>
                <span className="animate-float-crown text-3xl">👑</span>
                <span className="text-[10px] font-black tracking-widest text-yellow-600 dark:text-yellow-400 uppercase mt-0.5">Champion</span>
              </div>
            ) : (
              <div className={`text-2xl mb-1 ${MEDAL_TEXT[idx]}`}>{MEDALS[idx]}</div>
            )}

            {/* Card — wrapped in glow for #1 */}
            <div className={`w-full ${idx === 0 ? 'animate-champion-glow' : ''}`}>
              <Card
                className={`w-full ${height} flex flex-col items-center justify-center p-3 text-center bg-gradient-to-b border-2 ${
                  idx === 0
                    ? 'from-yellow-50 to-amber-50/60 dark:from-yellow-900/30 dark:to-amber-900/20 border-yellow-400 dark:border-yellow-600'
                    : idx === 1
                    ? 'from-gray-50 to-white dark:from-gray-700/40 dark:to-gray-800 border-gray-200 dark:border-gray-600'
                    : 'from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800 border-orange-300 dark:border-orange-700'
                }`}
              >
                {idx === 0 && (
                  <span className="text-2xl mb-1">{MEDALS[idx]}</span>
                )}
                <div className={`font-bold text-sm leading-tight line-clamp-2 ${idx === 0 ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-900 dark:text-white'}`}>
                  {cat.category}
                </div>
                <div className="mt-1">
                  <StarsDisplay value={cat.averageRating} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                  {cat.giftCount} {cat.giftCount === 1 ? 'gift' : 'gifts'} <TrendIndicator trend={cat.trend} />
                </div>
              </Card>
            </div>

            {/* Podium step base */}
            <div className={`w-full mt-1 rounded-b-lg flex items-center justify-center py-1 ${
              idx === 0 ? 'bg-yellow-400/20 dark:bg-yellow-600/20 h-5' :
              idx === 1 ? 'bg-gray-200/60 dark:bg-gray-600/40 h-3' :
              'bg-orange-200/40 dark:bg-orange-700/20 h-2'
            }`} />
          </div>
        ) : (
          <div key={`empty-${idx}`} />
        )
      )}
    </div>
  );
}

// --- ETF card ----------------------------------------------------------------

function ETFCard({ etf, rank }: { etf: ETFRanking; rank: number }) {
  const isTop3 = rank < 3;
  const isChampion = rank === 0;
  const borderClass = !isTop3
    ? 'border-gray-100 dark:border-gray-700'
    : isChampion
    ? 'border-yellow-400 dark:border-yellow-500'
    : rank === 1
    ? 'border-gray-300 dark:border-gray-500'
    : 'border-orange-300 dark:border-orange-700';

  const card = (
    <Card className={`relative p-4 border-2 ${borderClass} ${isChampion ? 'bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-800' : ''}`}>
      {/* Champion crown badge */}
      {isChampion && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-lg">
          <span>👑</span> #1 Best
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-2 mt-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl flex-shrink-0">
            {isTop3 ? MEDALS[rank] : <span className="text-sm font-bold text-gray-400 tabular-nums">#{etf.rank}</span>}
          </span>
          <div className="min-w-0">
            <div className={`font-bold ${isChampion ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-900 dark:text-white'}`}>{etf.symbol}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{etf.name}</div>
          </div>
        </div>
        <TrendIndicator trend={etf.trend} />
      </div>

      <span className="inline-block text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full px-2 py-0.5 mb-2">
        {etf.category}
      </span>

      <div className="flex items-center gap-2 mb-2">
        <StarsDisplay value={etf.averageRating} />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{etf.averageRating.toFixed(1)}</span>
        <span className="text-xs text-gray-400">({etf.totalRatings})</span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs mb-2">
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <span className="font-medium">Senders</span> {etf.senderAverageRating.toFixed(1)} ★
        </div>
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <span className="font-medium">Receivers</span> {etf.receiverAverageRating.toFixed(1)} ★
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2">
        <span>{etf.giftCount} {etf.giftCount === 1 ? 'gift' : 'gifts'}</span>
        <span className="flex items-center gap-0.5">
          <span className="text-orange-500">🔥</span>{etf.recentGiftCount} recent
        </span>
      </div>
    </Card>
  );

  if (!isChampion) return card;

  return (
    <div className="relative pt-3">
      {/* Particle confetti above champion card */}
      <div className="absolute top-0 left-0 right-0 flex justify-around pointer-events-none">
        {['✦','★','✦','★','✦'].map((s, i) => (
          <span
            key={i}
            className="particle text-yellow-400 text-xs"
            style={{ animationDelay: `${i * 0.35}s`, animationDuration: `${1.5 + i * 0.2}s` }}
          >
            {s}
          </span>
        ))}
      </div>
      <div className="animate-champion-glow rounded-xl">
        {card}
      </div>
    </div>
  );
}

// --- Skeletons ---------------------------------------------------------------

function CardSkeleton() {
  return <div className="h-44 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />;
}

function PodiumSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 items-end">
      <div className="h-32 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="h-40 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <div className="h-28 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
    </div>
  );
}

// --- Page --------------------------------------------------------------------

export default function Leaderboard() {
  const [categories, setCategories] = useState<CategoryRanking[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  const [etfTab, setEtfTab] = useState<ETFTab>('All');
  const [etfs, setEtfs] = useState<ETFRanking[]>([]);
  const [etfLoading, setEtfLoading] = useState(true);

  // Fetch categories once
  useEffect(() => {
    let active = true;
    setCatLoading(true);
    apiClient
      .get<CategoryRanking[]>('/rankings/categories')
      .then((res) => { if (active) setCategories(res.data); })
      .catch(() => { if (active) setCategories([]); })
      .finally(() => { if (active) setCatLoading(false); });
    return () => { active = false; };
  }, []);

  // Fetch ETFs whenever the tab changes
  useEffect(() => {
    let active = true;
    setEtfLoading(true);
    const request =
      etfTab === 'All'
        ? apiClient.get<ETFRanking[]>('/rankings/etfs').then((res) => res.data)
        : apiClient
            .get<CategoryETFsResponse>(`/rankings/etfs/${encodeURIComponent(etfTab)}`)
            .then((res) => res.data.topETFs ?? []);
    request
      .then((list) => { if (active) setEtfs(list); })
      .catch(() => { if (active) setEtfs([]); })
      .finally(() => { if (active) setEtfLoading(false); });
    return () => { active = false; };
  }, [etfTab]);

  const podium = categories.slice(0, 3);
  const restCategories = categories.slice(3);
  const hasCategoryData = categories.some((c) => c.giftCount > 0);
  const hasETFData = etfs.some((e) => e.giftCount > 0);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Page header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboards</h1>
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-pulse">
                🔥 Live
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Discover the most popular ETFs and categories on WealthGift
            </p>
          </header>

          {/* Category leaderboard */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top Categories</h2>
              <span className="text-lg">🏆</span>
            </div>

            {catLoading ? (
              <PodiumSkeleton />
            ) : categories.length === 0 || !hasCategoryData ? (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-3">🌱</div>
                <p className="text-gray-500 dark:text-gray-400">No activity yet — be the first to send a gift!</p>
              </Card>
            ) : (
              <>
                <CategoryPodium categories={podium} />

                {restCategories.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {restCategories.map((cat) => (
                      <Card key={cat.category} className="p-4 flex items-center gap-4">
                        <span className="w-8 text-center font-bold text-gray-400 dark:text-gray-500 flex-shrink-0">
                          #{cat.rank}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white flex-1 min-w-0 truncate">
                          {cat.category}
                        </span>
                        <StarsDisplay value={cat.averageRating} />
                        <span className="text-sm text-gray-500 dark:text-gray-400 w-20 text-right flex-shrink-0">
                          {cat.giftCount} {cat.giftCount === 1 ? 'gift' : 'gifts'}
                        </span>
                        <span className="w-6 text-center flex-shrink-0">
                          <TrendIndicator trend={cat.trend} />
                        </span>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* ETF leaderboard */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top ETFs</h2>
              <span className="text-lg">📈</span>
            </div>

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-5" role="tablist" aria-label="Filter ETFs by category">
              {ETF_TABS.map((tab) => {
                const active = etfTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setEtfTab(tab)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[#F5C518] text-black'
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>

            {etfLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}
              </div>
            ) : etfs.length === 0 || !hasETFData ? (
              <Card className="p-8 text-center">
                <div className="text-4xl mb-3">🌱</div>
                <p className="text-gray-500 dark:text-gray-400">No activity yet — be the first to send a gift!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {etfs.map((etf, i) => (
                  <ETFCard key={etf.symbol} etf={etf} rank={i} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
