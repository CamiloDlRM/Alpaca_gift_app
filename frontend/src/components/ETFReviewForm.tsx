import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { StarPicker, StarsDisplay } from './ETFRatingWidget';
import type { RatingResponse, RatingRole, ETFRatingsAggregate } from './ETFRatingWidget';
import apiClient from '../api/client';

interface ETFReviewFormProps {
  etfSymbol: string;
}

export function ETFReviewForm({ etfSymbol }: ETFReviewFormProps) {
  // Holds both role-specific ratings so switching role doesn't require a refetch.
  const [senderRating, setSenderRating] = useState<RatingResponse | null>(null);
  const [receiverRating, setReceiverRating] = useState<RatingResponse | null>(null);
  // Default to RECEIVER: this form lives on the gift recipient's portfolio page.
  const [role, setRole] = useState<RatingRole>('RECEIVER');
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const existing = role === 'SENDER' ? senderRating : receiverRating;

  const applyRating = useCallback((rating: RatingResponse | null) => {
    if (rating) {
      setStars(rating.stars);
      setComment(rating.comment ?? '');
    } else {
      setStars(0);
      setComment('');
    }
  }, []);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get<ETFRatingsAggregate>(`/etf-ratings/${etfSymbol}`);
        setSenderRating(res.data.userSenderRating);
        setReceiverRating(res.data.userReceiverRating);
        // Pre-populate for the default role (RECEIVER).
        applyRating(res.data.userReceiverRating);
      } catch { /* non-blocking */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [etfSymbol, applyRating]);

  const handleRoleChange = (nextRole: RatingRole) => {
    setRole(nextRole);
    setError('');
    applyRating(nextRole === 'SENDER' ? senderRating : receiverRating);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stars < 1) return;
    setSubmitting(true);
    setError('');
    setSuccess(false);
    try {
      const res = await apiClient.post<RatingResponse>(`/etf-ratings/${etfSymbol}`, {
        stars,
        role,
        comment: comment.trim() || undefined,
      });
      if (role === 'SENDER') setSenderRating(res.data);
      else setReceiverRating(res.data);
      setOpen(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error || 'Could not save review.');
      } else {
        setError('Could not save review. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Your review for {etfSymbol}
        </span>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-semibold text-[#F5C518] hover:underline"
          >
            {existing ? 'Edit review' : 'Add review'}
          </button>
        )}
      </div>

      {/* Existing review (collapsed) */}
      {!open && existing && (
        <div className="flex items-center gap-3">
          <StarsDisplay value={existing.stars} size="sm" />
          {existing.comment && (
            <p className="text-sm text-gray-600 dark:text-gray-300 italic truncate">"{existing.comment}"</p>
          )}
        </div>
      )}

      {!open && !existing && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          You haven&#39;t reviewed this ETF yet.
        </p>
      )}

      {success && !open && (
        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Review saved!</p>
      )}

      {/* Form (expanded) */}
      {open && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Your role</label>
            <div className="inline-flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600" role="radiogroup" aria-label="Your role">
              <button
                type="button"
                role="radio"
                aria-checked={role === 'SENDER'}
                onClick={() => handleRoleChange('SENDER')}
                disabled={submitting}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  role === 'SENDER'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Sender
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={role === 'RECEIVER'}
                onClick={() => handleRoleChange('RECEIVER')}
                disabled={submitting}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  role === 'RECEIVER'
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                Receiver
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rating</label>
            <StarPicker value={stars} onChange={setStars} disabled={submitting} />
          </div>

          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Comment (optional)</label>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none"
              rows={2}
              maxLength={1000}
              placeholder="Share your experience with this ETF..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={submitting} disabled={stars < 1}>
              {existing ? 'Update' : 'Publish'}
            </Button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError('');
                applyRating(existing);
              }}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
