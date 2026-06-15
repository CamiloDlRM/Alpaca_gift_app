import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import apiClient from '../api/client';

type ParticipantStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'GIFTED';

interface EtfOption {
  id: string;
  etfSymbol: string;
  targetAmount: number;
}

interface InviteParticipant {
  id: string;
  email: string;
  name: string;
  status: ParticipantStatus;
  inviteToken: string;
  giftId: string | null;
}

interface InviteEvent {
  id: string;
  title: string;
  description: string | null;
  etfSymbol: string;
  targetAmount: number;
  options: EtfOption[];
  status: 'ACTIVE' | 'CLOSED';
  creator: { id: string; name: string; email: string };
}

interface InviteResponse {
  participant: InviteParticipant;
  event: InviteEvent;
}

function StandaloneHeader() {
  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
      <div className="max-w-lg mx-auto flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
            <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-bold text-gray-900 dark:text-white">WealthGift</span>
      </div>
    </header>
  );
}

export default function GiftEventInvite() {
  const { inviteToken } = useParams<{ inviteToken: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<InviteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);
  const [showOptionPicker, setShowOptionPicker] = useState(false);

  const fetchInvite = useCallback(async () => {
    if (!inviteToken) return;
    try {
      const res = await apiClient.get<InviteResponse>(`/gift-events/invite/${inviteToken}`);
      setData(res.data);
    } catch {
      setError('This invitation could not be found or has expired.');
    } finally {
      setLoading(false);
    }
  }, [inviteToken]);

  useEffect(() => {
    fetchInvite();
  }, [fetchInvite]);

  const handleAccept = async () => {
    if (!inviteToken || actionLoading) return;
    setActionLoading(true);
    setActionError('');
    try {
      await apiClient.patch(`/gift-events/invite/${inviteToken}/accept`);
      setData((prev) =>
        prev ? { ...prev, participant: { ...prev.participant, status: 'ACCEPTED' } } : prev
      );
    } catch {
      setActionError('Could not accept the invitation. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const goSendGift = (optionIdx: number) => {
    if (!data) return;
    const opts = data.event.options?.length > 0
      ? data.event.options
      : [{ id: '', etfSymbol: data.event.etfSymbol, targetAmount: data.event.targetAmount }];
    const opt = opts[optionIdx] ?? opts[0];
    const params = new URLSearchParams({
      recipientName: data.event.creator.name,
      recipientEmail: data.event.creator.email,
      etfSymbol: opt.etfSymbol,
      amount: String(opt.targetAmount),
    });
    navigate(`/send?${params.toString()}`);
  };

  const handleSendGift = () => {
    if (!data) return;
    const opts = data.event.options?.length > 0
      ? data.event.options
      : [{ id: '', etfSymbol: data.event.etfSymbol, targetAmount: data.event.targetAmount }];
    if (opts.length === 1) {
      goSendGift(0);
    } else {
      setShowOptionPicker(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StandaloneHeader />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
            <span className="sr-only">Loading</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <StandaloneHeader />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Invitation unavailable</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{error || 'Could not load this invitation.'}</p>
          <Link to="/">
            <Button>Go to WealthGift</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { participant, event } = data;
  const displayOptions = event.options?.length > 0
    ? event.options
    : [{ id: '', etfSymbol: event.etfSymbol, targetAmount: event.targetAmount }];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <StandaloneHeader />
      <div className="max-w-lg mx-auto px-4 py-12 sm:py-16">
        <Card className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#F5C518]/15 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 mb-1">You're invited to a gift event</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organized by {event.creator.name}</p>
          </div>

          {event.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">{event.description}</p>
          )}

          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              {displayOptions.length === 1 ? 'ETF to gift' : 'ETF options'}
            </p>
            <div className="space-y-2">
              {displayOptions.map((opt, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-bold text-[#b8960c]">{opt.etfSymbol}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">${opt.targetAmount.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <span className="text-gray-500 dark:text-gray-400">Your status</span>
              <span className="font-semibold text-gray-900 dark:text-white">{participant.status}</span>
            </div>
          </div>

          {actionError && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{actionError}</div>
          )}

          {participant.status === 'INVITED' && (
            <Button className="w-full" onClick={handleAccept} loading={actionLoading}>
              Accept Invitation
            </Button>
          )}

          {participant.status === 'ACCEPTED' && (
            <Button className="w-full" onClick={handleSendGift}>
              Send Gift
            </Button>
          )}

          {participant.status === 'DECLINED' && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-4 py-3 rounded-lg" role="status">
              You declined this invitation.
            </div>
          )}

          {participant.status === 'GIFTED' && (
            <div className="text-center text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg" role="status">
              You already sent a gift for this event.
            </div>
          )}
        </Card>
      </div>

      {/* ETF option picker modal */}
      {showOptionPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowOptionPicker(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Choose ETF option"
        >
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Choose an ETF to gift</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Select which investment you'd like to send for <span className="font-semibold">{event.title}</span>.
            </p>
            <div className="space-y-2 mb-5">
              {displayOptions.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedOptionIdx(i)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors text-left ${
                    selectedOptionIdx === i
                      ? 'border-[#F5C518] bg-[#F5C518]/10'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="font-bold text-gray-900 dark:text-white">{opt.etfSymbol}</span>
                  <span className="text-gray-600 dark:text-gray-300">${opt.targetAmount.toFixed(2)}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => { setShowOptionPicker(false); goSendGift(selectedOptionIdx); }}>Continue</Button>
              <Button variant="secondary" onClick={() => setShowOptionPicker(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
