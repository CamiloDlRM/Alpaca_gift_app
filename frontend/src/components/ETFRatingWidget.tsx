import { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import apiClient from '../api/client';

export type RatingRole = 'SENDER' | 'RECEIVER';

export interface RatingResponse {
  id: string;
  userId: string;
  userName: string;
  etfSymbol: string;
  stars: number;
  role: RatingRole;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ETFRatingsAggregate {
  ratings: RatingResponse[];
  averageStars: number;
  totalCount: number;
  senderAverageStars: number;
  senderCount: number;
  receiverAverageStars: number;
  receiverCount: number;
  userSenderRating: RatingResponse | null;
  userReceiverRating: RatingResponse | null;
}

interface ETFRatingWidgetProps {
  etfSymbol: string;
  etfName: string;
  isAuthenticated: boolean;
  readOnly?: boolean;
}

interface StarsDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

export function StarsDisplay({ value, size = 'md', ariaLabel }: StarsDisplayProps) {
  const dim =
    size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={ariaLabel ?? `${value.toFixed(1)} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        return (
          <svg
            key={i}
            className={`${dim} ${filled ? 'text-[#F5C518]' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      })}
    </div>
  );
}

interface StarPickerProps {
  value: number;
  onChange: (stars: number) => void;
  disabled?: boolean;
}

export function StarPicker({ value, onChange, disabled }: StarPickerProps) {
  const [hover, setHover] = useState<number>(0);
  const display = hover || value;
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Select a rating from 1 to 5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= display;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} estrella${i === 1 ? '' : 's'}`}
            disabled={disabled}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(i)}
            className={`p-1 rounded transition-transform ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:scale-110 active:scale-95'}`}
          >
            <svg
              className={`w-7 h-7 ${filled ? 'text-[#F5C518]' : 'text-gray-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}

function pickRoleRating(data: ETFRatingsAggregate | null, role: RatingRole): RatingResponse | null {
  if (!data) return null;
  return role === 'SENDER' ? data.userSenderRating : data.userReceiverRating;
}

export function ETFRatingWidget({ etfSymbol, etfName, isAuthenticated, readOnly = false }: ETFRatingWidgetProps) {
  const [data, setData] = useState<ETFRatingsAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [role, setRole] = useState<RatingRole>('SENDER');
  const [stars, setStars] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Pre-populate the form from the rating that matches the currently-selected role.
  const applyRoleRating = useCallback((aggregate: ETFRatingsAggregate | null, selectedRole: RatingRole) => {
    const existing = pickRoleRating(aggregate, selectedRole);
    if (existing) {
      setStars(existing.stars);
      setComment(existing.comment ?? '');
    } else {
      setStars(0);
      setComment('');
    }
  }, []);

  const fetchRatings = useCallback(async () => {
    if (!etfSymbol) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get<ETFRatingsAggregate>(`/etf-ratings/${etfSymbol}`);
      setData(res.data);
      applyRoleRating(res.data, role);
    } catch {
      setError('Could not load ratings.');
    } finally {
      setLoading(false);
    }
  }, [etfSymbol, role, applyRoleRating]);

  useEffect(() => {
    fetchRatings();
    // Only refetch when the ETF changes — role switching is handled locally below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etfSymbol]);

  const handleRoleChange = (nextRole: RatingRole) => {
    setRole(nextRole);
    setSubmitError('');
    applyRoleRating(data, nextRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1 || stars > 5) {
      setSubmitError('Please select between 1 and 5 stars.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await apiClient.post(`/etf-ratings/${etfSymbol}`, {
        stars,
        role,
        comment: comment.trim() ? comment.trim() : undefined,
      });
      // Refresh the list
      await fetchRatings();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setSubmitError(axiosErr.response?.data?.error || 'Could not save rating.');
      } else {
        setSubmitError('Could not save rating. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
            <span className="sr-only">Loading ratings</span>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>
      </Card>
    );
  }

  const ratings = data?.ratings ?? [];
  const averageStars = data?.averageStars ?? 0;
  const totalCount = data?.totalCount ?? 0;
  const senderAverageStars = data?.senderAverageStars ?? 0;
  const senderCount = data?.senderCount ?? 0;
  const receiverAverageStars = data?.receiverAverageStars ?? 0;
  const receiverCount = data?.receiverCount ?? 0;
  const hasUserRating = !!pickRoleRating(data, role);

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{etfSymbol} Ratings</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{etfName}</p>
        </div>
        <div className="flex items-center gap-3">
          <StarsDisplay value={averageStars} size="md" />
          <div className="text-sm">
            <span className="font-bold text-gray-900 dark:text-white">{averageStars.toFixed(1)}</span>
            <span className="text-gray-500 dark:text-gray-400"> &middot; {totalCount} ratings</span>
          </div>
        </div>
      </div>

      {/* Metric chips: overall / senders / receivers */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200">
          Overall {averageStars.toFixed(1)} <span className="text-[#F5C518]">★</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
          Senders {senderAverageStars.toFixed(1)} <span className="text-[#F5C518]">★</span> ({senderCount})
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
          Receivers {receiverAverageStars.toFixed(1)} <span className="text-[#F5C518]">★</span> ({receiverCount})
        </span>
      </div>

      {/* Recent ratings list */}
      {ratings.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-6 text-center">
          No ratings yet. Be the first to share your opinion.
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
          {ratings.slice(0, 5).map((r) => (
            <div key={r.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-gray-900 dark:text-white text-sm truncate">{r.userName}</span>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      r.role === 'SENDER'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    }`}
                  >
                    {r.role === 'SENDER' ? 'Sender' : 'Receiver'}
                  </span>
                </div>
                <StarsDisplay value={r.stars} size="sm" />
              </div>
              {r.comment && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 break-words">{r.comment}</p>
              )}
              <div className="text-xs text-gray-400">{formatDate(r.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rating form — hidden in readOnly mode */}
      {!readOnly && isAuthenticated && (
        <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-4">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">Rate this ETF</h4>
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Your role</span>
              <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600" role="radiogroup" aria-label="Your role">
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'SENDER'}
                  onClick={() => handleRoleChange('SENDER')}
                  disabled={submitting}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    role === 'SENDER'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  I&#39;m the Sender
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === 'RECEIVER'}
                  onClick={() => handleRoleChange('RECEIVER')}
                  disabled={submitting}
                  className={`px-4 py-2 text-sm font-semibold transition-colors ${
                    role === 'RECEIVER'
                      ? 'bg-green-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  I&#39;m the Receiver
                </button>
              </div>
            </div>
            <StarPicker value={stars} onChange={setStars} disabled={submitting} />
          </div>

          <div>
            <label htmlFor={`comment-${etfSymbol}`} className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              Comment (optional)
            </label>
            <textarea
              id={`comment-${etfSymbol}`}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent resize-none"
              rows={3}
              maxLength={1000}
              placeholder="Share your opinion on this ETF..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
            />
          </div>

          {submitError && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm" role="alert">{submitError}</div>
          )}

          <Button type="submit" loading={submitting} disabled={stars < 1}>
            {hasUserRating ? 'Update rating' : 'Publish rating'}
          </Button>
        </form>
      )}

      {!readOnly && !isAuthenticated && (
        <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
          Sign in to rate this ETF.
        </div>
      )}
    </Card>
  );
}

export default ETFRatingWidget;
