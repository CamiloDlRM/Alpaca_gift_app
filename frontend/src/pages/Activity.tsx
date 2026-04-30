import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import apiClient from '../api/client';

interface GiftResponse {
  id: string;
  recipientName: string;
  occasion: string;
  etfSymbol: string;
  amount: number;
  status: string;
  claimToken: string;
  createdAt: string;
  deliveryDate: string;
}

interface ActivityEvent {
  id: string;
  date: string;
  type: 'SENT' | 'CLAIMED' | 'INVESTED' | 'FAILED' | 'RECEIVED';
  description: string;
  amount: number;
  etfSymbol: string;
  recipientName?: string;
}

const EVENT_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  SENT:     { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '📤' },
  CLAIMED:  { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: '📬' },
  INVESTED: { bg: 'bg-green-100',  text: 'text-green-700',  icon: '📈' },
  FAILED:   { bg: 'bg-red-100',    text: 'text-red-700',    icon: '❌' },
  RECEIVED: { bg: 'bg-purple-100', text: 'text-purple-700', icon: '🎁' },
};

function giftToEvents(gift: GiftResponse): ActivityEvent[] {
  const events: ActivityEvent[] = [
    {
      id: `${gift.id}-sent`,
      date: gift.createdAt,
      type: 'SENT',
      description: `You sent a ${gift.etfSymbol} gift to ${gift.recipientName}`,
      amount: gift.amount,
      etfSymbol: gift.etfSymbol,
      recipientName: gift.recipientName,
    },
  ];

  if (['CLAIMING', 'KYC_SUBMITTED', 'KYC_VERIFIED', 'AGREEMENT_SIGNED', 'ACCOUNT_CREATING', 'INVESTED', 'REDEEMED'].includes(gift.status)) {
    events.push({
      id: `${gift.id}-claimed`,
      date: gift.createdAt,
      type: 'CLAIMED',
      description: `${gift.recipientName} started claiming their gift`,
      amount: gift.amount,
      etfSymbol: gift.etfSymbol,
    });
  }

  if (gift.status === 'INVESTED' || gift.status === 'REDEEMED') {
    events.push({
      id: `${gift.id}-invested`,
      date: gift.deliveryDate,
      type: 'INVESTED',
      description: `${gift.recipientName}'s gift was invested in ${gift.etfSymbol}`,
      amount: gift.amount,
      etfSymbol: gift.etfSymbol,
    });
  }

  if (gift.status === 'FAILED') {
    events.push({
      id: `${gift.id}-failed`,
      date: gift.createdAt,
      type: 'FAILED',
      description: `The gift for ${gift.recipientName} failed during processing`,
      amount: gift.amount,
      etfSymbol: gift.etfSymbol,
    });
  }

  return events;
}

export default function Activity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const [sentRes, receivedRes] = await Promise.all([
        apiClient.get<GiftResponse[]>('/gifts'),
        apiClient.get<GiftResponse[]>('/gifts/received'),
      ]);

      const sentEvents = sentRes.data.flatMap(giftToEvents);
      const receivedEvents = receivedRes.data.map(g => ({
        id: `${g.id}-received`,
        date: g.createdAt,
        type: 'RECEIVED' as const,
        description: `You received a ${g.etfSymbol} gift (${g.occasion})`,
        amount: g.amount,
        etfSymbol: g.etfSymbol,
      }));

      const all = [...sentEvents, ...receivedEvents].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setEvents(all);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Activity</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Complete history of your gifts and transactions.</p>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No activity yet</h3>
              <p className="text-gray-500 dark:text-gray-400">When you send or receive gifts they will appear here.</p>
            </Card>
          ) : (
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="space-y-4">
                {events.map(event => {
                  const style = EVENT_STYLES[event.type];
                  return (
                    <div key={event.id} className="flex gap-4 relative">
                      <div className={`w-12 h-12 rounded-full ${style.bg} flex items-center justify-center text-xl flex-shrink-0 z-10 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700`}>
                        {style.icon}
                      </div>
                      <Card className="flex-1 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{event.description}</p>
                          <span className="font-bold text-gray-900 dark:text-white flex-shrink-0">${event.amount.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>{event.type}</span>
                          <span className="text-xs text-gray-400">{new Date(event.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
