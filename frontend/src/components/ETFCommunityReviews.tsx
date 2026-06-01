import { useState, useEffect } from 'react';
import type { ETFRatingsAggregate, RatingResponse } from './ETFRatingWidget';
import apiClient from '../api/client';

interface Props {
  etfSymbol: string;
  etfName: string;
}

function StarRow({ filled, total }: { filled: boolean; total: number }) {
  const dim = filled ? 'text-[#F5C518]' : 'text-white/20';
  return (
    <svg className={`w-3.5 h-3.5 flex-shrink-0 ${dim}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function BigStars({ value }: { value: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <StarRow key={i} filled={i <= Math.round(value)} total={5} />
      ))}
    </div>
  );
}

function DistributionBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-white/50 w-4 text-right flex-shrink-0">{label}</span>
      <svg className="w-2.5 h-2.5 text-[#F5C518] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#F5C518] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-white/40 w-6 text-right flex-shrink-0">{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: RatingResponse }) {
  const initials = review.userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const date = new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const isSender = review.role === 'SENDER';

  return (
    <div className="flex-shrink-0 w-56 bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-[#F5C518]/20 border border-[#F5C518]/30 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[#F5C518]">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-white truncate">{review.userName}</div>
          <div className="text-xs text-white/40">{date}</div>
        </div>
        <span
          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            isSender ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-green-500/20 text-green-300 border border-green-400/30'
          }`}
        >
          {isSender ? 'Sender' : 'Receiver'}
        </span>
      </div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={`w-3 h-3 ${i <= review.stars ? 'text-[#F5C518]' : 'text-white/20'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {review.comment ? (
        <p className="text-xs text-white/60 leading-relaxed line-clamp-3">"{review.comment}"</p>
      ) : (
        <p className="text-xs text-white/30 italic">No comment</p>
      )}
    </div>
  );
}

type ReviewFilter = 'ALL' | 'SENDER' | 'RECEIVER';

export function ETFCommunityReviews({ etfSymbol, etfName }: Props) {
  const [data, setData] = useState<ETFRatingsAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReviewFilter>('ALL');

  useEffect(() => {
    setLoading(true);
    setData(null);
    setFilter('ALL');
    apiClient
      .get<ETFRatingsAggregate>(`/etf-ratings/${etfSymbol}`)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [etfSymbol]);

  const allRatings = data?.ratings ?? [];
  const senderAvg = data?.senderAverageStars ?? 0;
  const senderCount = data?.senderCount ?? 0;
  const receiverAvg = data?.receiverAverageStars ?? 0;
  const receiverCount = data?.receiverCount ?? 0;
  const overallAvg = data?.averageStars ?? 0;
  const overallCount = data?.totalCount ?? 0;

  // Average + count + visible reviews depend on the active filter tab.
  const avg = filter === 'SENDER' ? senderAvg : filter === 'RECEIVER' ? receiverAvg : overallAvg;
  const total = filter === 'SENDER' ? senderCount : filter === 'RECEIVER' ? receiverCount : overallCount;
  const ratings =
    filter === 'ALL' ? allRatings : allRatings.filter((r) => r.role === filter);

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r.stars === star).length,
  }));

  const filterTabs: { key: ReviewFilter; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'SENDER', label: 'Senders' },
    { key: 'RECEIVER', label: 'Receivers' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#0d1829] via-[#111f35] to-[#0a1628] shadow-xl border border-white/5 animate-fadeIn">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-[#F5C518] uppercase tracking-widest">Community Reviews</span>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight">{etfSymbol}</h3>
            <p className="text-white/40 text-xs truncate max-w-[180px]">{etfName}</p>
          </div>

          {/* Big score */}
          {loading ? (
            <div className="flex flex-col items-center gap-1">
              <div className="h-10 w-16 bg-white/10 rounded-lg animate-pulse" />
              <div className="h-3 w-20 bg-white/10 rounded animate-pulse" />
            </div>
          ) : total === 0 ? (
            <div className="text-right">
              <div className="text-white/20 text-sm">No reviews yet</div>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1">
              <div className="text-4xl font-black text-white leading-none">{avg.toFixed(1)}</div>
              <BigStars value={avg} />
              <div className="text-xs text-white/40">{total} {total === 1 ? 'review' : 'reviews'}</div>
            </div>
          )}
        </div>

        {/* Metric chips: overall / senders / receivers */}
        {!loading && (
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
              Overall: {overallAvg.toFixed(1)} <span className="text-[#F5C518]">★</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
              Senders: {senderAvg.toFixed(1)} <span className="text-[#F5C518]">★</span> ({senderCount})
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-3 py-1 text-xs font-medium text-green-300">
              Receivers: {receiverAvg.toFixed(1)} <span className="text-[#F5C518]">★</span> ({receiverCount})
            </span>
          </div>
        )}

        {/* Filter tabs */}
        {!loading && (
          <div className="flex gap-1.5 mb-4" role="tablist" aria-label="Filter reviews by role">
            {filterTabs.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#F5C518] text-black'
                      : 'bg-white/8 text-white/60 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Distribution bars */}
        {!loading && total > 0 && (
          <div className="space-y-1.5">
            {dist.map(({ star, count }) => (
              <DistributionBar key={star} label={String(star)} count={count} total={total} />
            ))}
          </div>
        )}

        {!loading && total === 0 && (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">🌱</div>
            <p className="text-white/40 text-sm">Be the first to review this ETF after investing.</p>
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-4 h-2 bg-white/10 rounded animate-pulse" />
                <div className="w-2.5 h-2.5 bg-white/10 rounded animate-pulse" />
                <div className="flex-1 h-1.5 bg-white/10 rounded animate-pulse" />
                <div className="w-4 h-2 bg-white/10 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review cards — horizontal scroll */}
      {!loading && ratings.length > 0 && (
        <div className="relative">
          {/* Gradient fade on right */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a1628] to-transparent z-10 pointer-events-none" />
          <div className="flex gap-3 overflow-x-auto scrollbar-none px-5 pb-5 pt-1">
            {ratings.slice(0, 8).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
