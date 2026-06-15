import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

type EventStatus = 'ACTIVE' | 'CLOSED';
type ParticipantStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'GIFTED';

interface EtfOption {
  id: string;
  etfSymbol: string;
  targetAmount: number;
}

interface EventParticipant {
  id: string;
  email: string;
  name: string;
  status: ParticipantStatus;
  inviteToken: string;
  giftId: string | null;
  acceptedAt: string | null;
}

interface GiftEvent {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  etfSymbol: string;
  targetAmount: number;
  status: EventStatus;
  participants: EventParticipant[];
  options: EtfOption[];
}

interface InvitedEvent {
  id: string;
  title: string;
  description: string | null;
  etfSymbol: string;
  targetAmount: number;
  status: EventStatus;
  options: EtfOption[];
  creator: { id: string; name: string; email: string };
  participant: {
    id: string;
    status: ParticipantStatus;
    inviteToken: string;
    giftId: string | null;
  };
}

interface ParticipantInput {
  email: string;
  name: string;
}

interface EtfOptionInput {
  etfSymbol: string;
  targetAmount: string;
}

const PARTICIPANT_STATUS_STYLE: Record<ParticipantStatus, string> = {
  INVITED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  ACCEPTED: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  DECLINED: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  GIFTED: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
};

export default function GiftEvents() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isVisionary = user?.subscriptionStatus === 'PRO_PLUS';

  const [tab, setTab] = useState<'mine' | 'invited'>('mine');

  const [events, setEvents] = useState<GiftEvent[]>([]);
  const [invited, setInvited] = useState<InvitedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [etfOptions, setEtfOptions] = useState<EtfOptionInput[]>([{ etfSymbol: '', targetAmount: '' }]);
  const [participants, setParticipants] = useState<ParticipantInput[]>([{ email: '', name: '' }]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // For "Send Gift" with multiple ETF options
  const [sendGiftEvent, setSendGiftEvent] = useState<InvitedEvent | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);

  const [actionId, setActionId] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mineRes, invitedRes] = await Promise.all([
        apiClient.get<GiftEvent[]>('/gift-events'),
        apiClient.get<InvitedEvent[]>('/gift-events/invited'),
      ]);
      setEvents(mineRes.data);
      setInvited(invitedRes.data);
    } catch {
      setError('Could not load your gift events.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isVisionary) fetchAll();
    else setLoading(false);
  }, [isVisionary, fetchAll]);

  // ETF options CRUD
  const addEtfOptionRow = () => setEtfOptions((prev) => [...prev, { etfSymbol: '', targetAmount: '' }]);
  const removeEtfOptionRow = (i: number) =>
    setEtfOptions((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  const updateEtfOptionRow = (i: number, field: keyof EtfOptionInput, value: string) =>
    setEtfOptions((prev) => prev.map((o, idx) => (idx === i ? { ...o, [field]: value } : o)));

  // Participants CRUD
  const addParticipantRow = () => setParticipants((prev) => [...prev, { email: '', name: '' }]);
  const removeParticipantRow = (i: number) =>
    setParticipants((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  const updateParticipantRow = (i: number, field: keyof ParticipantInput, value: string) =>
    setParticipants((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

  const resetCreateForm = () => {
    setTitle('');
    setDescription('');
    setEtfOptions([{ etfSymbol: '', targetAmount: '' }]);
    setParticipants([{ email: '', name: '' }]);
    setCreateError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || creating) return;

    const filledOptions = etfOptions.filter(o => o.etfSymbol.trim() && o.targetAmount);
    if (filledOptions.length === 0) {
      setCreateError('At least one ETF option is required.');
      return;
    }
    for (const opt of filledOptions) {
      const sym = opt.etfSymbol.trim().toUpperCase();
      if (!/^[A-Z]{1,10}$/.test(sym)) {
        setCreateError(`Invalid ETF symbol: "${opt.etfSymbol}". Use a valid ticker (e.g. VOO, SPY).`);
        return;
      }
    }

    setCreating(true);
    setCreateError('');
    try {
      const { data } = await apiClient.post<GiftEvent>('/gift-events', {
        title: title.trim(),
        description: description.trim() || undefined,
        etfOptions: filledOptions.map(o => ({
          etfSymbol: o.etfSymbol.trim().toUpperCase(),
          targetAmount: parseFloat(o.targetAmount),
        })),
        participants: participants
          .filter((p) => p.email.trim())
          .map((p) => ({ email: p.email.trim(), name: p.name.trim() })),
      });
      setEvents((prev) => [data, ...prev]);
      setShowCreate(false);
      resetCreateForm();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setCreateError(axiosErr.response?.data?.error || 'Could not create the event.');
      } else {
        setCreateError('Could not create the event. Please try again.');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCloseEvent = async (eventId: string) => {
    setActionId(eventId);
    try {
      await apiClient.patch(`/gift-events/${eventId}/close`);
      setEvents((prev) => prev.map((ev) => (ev.id === eventId ? { ...ev, status: 'CLOSED' } : ev)));
    } catch {
      setError('Could not close the event.');
    } finally {
      setActionId('');
    }
  };

  const handleInviteAction = async (inviteToken: string, action: 'accept' | 'decline') => {
    setActionId(inviteToken);
    try {
      await apiClient.patch(`/gift-events/invite/${inviteToken}/${action}`);
      setInvited((prev) =>
        prev.map((ev) =>
          ev.participant.inviteToken === inviteToken
            ? { ...ev, participant: { ...ev.participant, status: action === 'accept' ? 'ACCEPTED' : 'DECLINED' } }
            : ev
        )
      );
    } catch {
      setError('Could not update the invitation.');
    } finally {
      setActionId('');
    }
  };

  const initiateGoSendGift = (ev: InvitedEvent) => {
    const opts = ev.options?.length > 0 ? ev.options : [{ id: '', etfSymbol: ev.etfSymbol, targetAmount: ev.targetAmount }];
    if (opts.length === 1) {
      const opt = opts[0];
      const params = new URLSearchParams({
        recipientName: ev.creator.name,
        recipientEmail: ev.creator.email,
        etfSymbol: opt.etfSymbol,
        amount: String(opt.targetAmount),
      });
      navigate(`/send?${params.toString()}`);
    } else {
      setSendGiftEvent(ev);
      setSelectedOptionIdx(0);
    }
  };

  const confirmGoSendGift = () => {
    if (!sendGiftEvent) return;
    const opts = sendGiftEvent.options?.length > 0
      ? sendGiftEvent.options
      : [{ id: '', etfSymbol: sendGiftEvent.etfSymbol, targetAmount: sendGiftEvent.targetAmount }];
    const opt = opts[selectedOptionIdx] ?? opts[0];
    const params = new URLSearchParams({
      recipientName: sendGiftEvent.creator.name,
      recipientEmail: sendGiftEvent.creator.email,
      etfSymbol: opt.etfSymbol,
      amount: String(opt.targetAmount),
    });
    setSendGiftEvent(null);
    navigate(`/send?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      {!isVisionary ? (
        <main className="flex-1 flex flex-col">
          <UpgradePrompt feature="Gift Events" requiredPlan="PRO_PLUS" />
        </main>
      ) : (
        <main className="flex-1 px-4 py-8 sm:px-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Gift Events</h1>
                <p className="text-gray-500 dark:text-gray-400">Organize group gifting with friends and family.</p>
              </div>
              {tab === 'mine' && (
                <Button size="sm" onClick={() => { resetCreateForm(); setShowCreate(true); }}>Create Event</Button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              {(['mine', 'invited'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 py-2.5 text-sm font-semibold transition-colors -mb-px border-b-2 ${
                    tab === t
                      ? 'text-[#b8960c] border-[#F5C518]'
                      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {t === 'mine' ? 'My Events' : 'Invited'}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{error}</div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
                  <span className="sr-only">Loading</span>
                </div>
              </div>
            ) : tab === 'mine' ? (
              events.length === 0 ? (
                <Card className="p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">You haven't created any events yet.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {events.map((ev) => {
                    const displayOptions = ev.options?.length > 0
                      ? ev.options
                      : [{ id: '', etfSymbol: ev.etfSymbol, targetAmount: ev.targetAmount }];
                    return (
                      <Card key={ev.id} className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 dark:text-white truncate">{ev.title}</h3>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${ev.status === 'ACTIVE' ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                {ev.status}
                              </span>
                            </div>
                            {ev.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{ev.description}</p>}
                            <div className="mt-2 flex flex-wrap gap-2">
                              {displayOptions.map((opt, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-sm bg-[#F5C518]/10 text-[#b8960c] font-semibold px-2.5 py-0.5 rounded-full">
                                  {opt.etfSymbol} · ${opt.targetAmount.toFixed(2)}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{ev.participants.length} participant(s)</p>
                          </div>
                          {ev.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleCloseEvent(ev.id)}
                              loading={actionId === ev.id}
                            >
                              Close
                            </Button>
                          )}
                        </div>
                        {ev.participants.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {ev.participants.map((p) => (
                              <span key={p.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${PARTICIPANT_STATUS_STYLE[p.status]}`}>
                                <span className="font-medium">{p.name || p.email}</span>
                                <span>· {p.status}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )
            ) : invited.length === 0 ? (
              <Card className="p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">You haven't been invited to any events yet.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {invited.map((ev) => {
                  const displayOptions = ev.options?.length > 0
                    ? ev.options
                    : [{ id: '', etfSymbol: ev.etfSymbol, targetAmount: ev.targetAmount }];
                  return (
                    <Card key={ev.id} className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-white truncate">{ev.title}</h3>
                          <p className="text-sm text-gray-400 mt-0.5">Organized by {ev.creator.name}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {displayOptions.map((opt, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-sm bg-[#F5C518]/10 text-[#b8960c] font-semibold px-2.5 py-0.5 rounded-full">
                                {opt.etfSymbol} · ${opt.targetAmount.toFixed(2)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${PARTICIPANT_STATUS_STYLE[ev.participant.status]}`}>
                          {ev.participant.status}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {ev.participant.status === 'INVITED' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleInviteAction(ev.participant.inviteToken, 'accept')}
                              loading={actionId === ev.participant.inviteToken}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleInviteAction(ev.participant.inviteToken, 'decline')}
                              disabled={actionId === ev.participant.inviteToken}
                            >
                              Decline
                            </Button>
                          </>
                        )}
                        {ev.participant.status === 'ACCEPTED' && !ev.participant.giftId && (
                          <Button size="sm" onClick={() => initiateGoSendGift(ev)}>Send Gift</Button>
                        )}
                        {ev.participant.status === 'DECLINED' && (
                          <p className="text-sm text-gray-400">You declined this invitation.</p>
                        )}
                        {ev.participant.status === 'GIFTED' && (
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">You already sent a gift for this event.</p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Create Event modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Create gift event"
        >
          <Card className="w-full max-w-lg p-6 sm:p-8 my-auto">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Create a gift event</h2>
            {createError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{createError}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <Input label="Title" placeholder="Mom's 60th birthday" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description (optional)</label>
                <textarea
                  className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none"
                  rows={2}
                  placeholder="Let's all chip in for a meaningful gift."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* ETF Options */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">ETF Options</label>
                <div className="space-y-2">
                  {etfOptions.map((opt, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="VOO"
                        value={opt.etfSymbol}
                        onChange={(e) => updateEtfOptionRow(i, 'etfSymbol', e.target.value.toUpperCase())}
                        className="col-span-4 rounded-lg border border-gray-200 dark:border-gray-600 py-2.5 px-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5C518] uppercase"
                        required={i === 0}
                        maxLength={10}
                      />
                      <input
                        type="number"
                        placeholder="Amount ($)"
                        min="1"
                        step="0.01"
                        value={opt.targetAmount}
                        onChange={(e) => updateEtfOptionRow(i, 'targetAmount', e.target.value)}
                        className="col-span-7 rounded-lg border border-gray-200 dark:border-gray-600 py-2.5 px-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                        required={i === 0}
                      />
                      <button
                        type="button"
                        onClick={() => removeEtfOptionRow(i)}
                        disabled={etfOptions.length === 1}
                        className="col-span-1 w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Remove ETF option"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addEtfOptionRow} className="mt-3 text-sm font-semibold text-[#b8960c] hover:text-[#8a6f08] transition-colors">
                  + Add ETF option
                </button>
              </div>

              {/* Participants */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Participants</label>
                <div className="space-y-2">
                  {participants.map((p, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Name"
                        value={p.name}
                        onChange={(e) => updateParticipantRow(i, 'name', e.target.value)}
                        className="col-span-5 rounded-lg border border-gray-200 dark:border-gray-600 py-2.5 px-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                      />
                      <input
                        type="email"
                        placeholder="email@example.com"
                        value={p.email}
                        onChange={(e) => updateParticipantRow(i, 'email', e.target.value)}
                        className="col-span-6 rounded-lg border border-gray-200 dark:border-gray-600 py-2.5 px-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                      />
                      <button
                        type="button"
                        onClick={() => removeParticipantRow(i)}
                        disabled={participants.length === 1}
                        className="col-span-1 w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Remove participant"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addParticipantRow} className="mt-3 text-sm font-semibold text-[#b8960c] hover:text-[#8a6f08] transition-colors">
                  + Add participant
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" loading={creating} className="flex-1" disabled={!title.trim() || etfOptions.every(o => !o.etfSymbol.trim())}>
                  Create event
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} disabled={creating}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ETF selection modal for "Send Gift" when there are multiple options */}
      {sendGiftEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSendGiftEvent(null); }}
          role="dialog"
          aria-modal="true"
          aria-label="Choose ETF option"
        >
          <Card className="w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Choose an ETF to gift</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select which investment you'd like to send for <span className="font-semibold">{sendGiftEvent.title}</span>.</p>
            <div className="space-y-2 mb-5">
              {(sendGiftEvent.options?.length > 0
                ? sendGiftEvent.options
                : [{ id: '', etfSymbol: sendGiftEvent.etfSymbol, targetAmount: sendGiftEvent.targetAmount }]
              ).map((opt, i) => (
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
              <Button className="flex-1" onClick={confirmGoSendGift}>Continue</Button>
              <Button variant="secondary" onClick={() => setSendGiftEvent(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
