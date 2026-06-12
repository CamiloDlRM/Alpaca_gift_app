import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

interface FavoriteSchedule {
  id: string;
  month: number;
  day: number;
  label: string | null;
  lastSentAt: string | null;
}

interface FavoriteRecipient {
  id: string;
  userId: string;
  recipientName: string;
  recipientEmail: string;
  etfSymbol: string;
  amount: number;
  schedules: FavoriteSchedule[];
  createdAt: string;
}

interface ScheduleInput {
  month: string;
  day: string;
  label: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatSchedule(month: number, day: number): string {
  const name = MONTH_NAMES[month - 1] ?? '';
  return `${name} ${day}`;
}

export default function FavoriteRecipients() {
  const { user } = useAuthStore();
  const isVisionary = user?.subscriptionStatus === 'PRO_PLUS';

  const [favorites, setFavorites] = useState<FavoriteRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [etfSymbol, setEtfSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [schedules, setSchedules] = useState<ScheduleInput[]>([{ month: '1', day: '1', label: '' }]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const fetchFavorites = useCallback(async () => {
    try {
      const { data } = await apiClient.get<FavoriteRecipient[]>('/favorites');
      setFavorites(data);
    } catch {
      setError('Could not load your favorites.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isVisionary) fetchFavorites();
    else setLoading(false);
  }, [isVisionary, fetchFavorites]);

  const addScheduleRow = () => setSchedules((prev) => [...prev, { month: '1', day: '1', label: '' }]);
  const removeScheduleRow = (index: number) =>
    setSchedules((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  const updateScheduleRow = (index: number, field: keyof ScheduleInput, value: string) =>
    setSchedules((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim() || !recipientEmail.trim() || !etfSymbol.trim() || !amount || adding) return;
    setAdding(true);
    setAddError('');
    try {
      const { data } = await apiClient.post<FavoriteRecipient>('/favorites', {
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim(),
        etfSymbol: etfSymbol.trim().toUpperCase(),
        amount: parseFloat(amount),
        schedules: schedules.map((s) => ({
          month: parseInt(s.month, 10),
          day: parseInt(s.day, 10),
          label: s.label.trim() || undefined,
        })),
      });
      setFavorites((prev) => [data, ...prev]);
      setRecipientName('');
      setRecipientEmail('');
      setEtfSymbol('');
      setAmount('');
      setSchedules([{ month: '1', day: '1', label: '' }]);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setAddError(axiosErr.response?.data?.error || 'Could not save this favorite.');
      } else {
        setAddError('Could not save this favorite. Please try again.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/favorites/${id}`);
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setError('Could not delete this favorite.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      {!isVisionary ? (
        <main className="flex-1 flex flex-col">
          <UpgradePrompt feature="Favorites" requiredPlan="PRO_PLUS" />
        </main>
      ) : (
        <main className="flex-1 px-4 py-8 sm:px-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Favorite Recipients</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Set people up for automatic gifts on the dates that matter most.
            </p>

            {/* Add form */}
            <Card className="p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add a favorite</h2>
              {addError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{addError}</div>
              )}
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Recipient name" placeholder="Jane Doe" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
                  <Input label="Recipient email" type="email" placeholder="jane@example.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} required />
                  <Input label="ETF symbol" placeholder="VOO" value={etfSymbol} onChange={(e) => setEtfSymbol(e.target.value)} required />
                  <Input label="Amount ($)" type="number" min="1" step="0.01" placeholder="100.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>

                {/* Schedules */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Schedules</label>
                  <div className="space-y-3">
                    {schedules.map((s, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5 flex flex-col gap-1">
                          <span className="text-xs text-gray-400">Month</span>
                          <select
                            className="rounded-lg border border-gray-200 dark:border-gray-600 py-2.5 px-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                            value={s.month}
                            onChange={(e) => updateScheduleRow(i, 'month', e.target.value)}
                          >
                            {MONTH_NAMES.map((m, mi) => (
                              <option key={m} value={mi + 1}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2 flex flex-col gap-1">
                          <span className="text-xs text-gray-400">Day</span>
                          <input
                            type="number"
                            min="1"
                            max="31"
                            value={s.day}
                            onChange={(e) => updateScheduleRow(i, 'day', e.target.value)}
                            className="rounded-lg border border-gray-200 dark:border-gray-600 py-2.5 px-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                          />
                        </div>
                        <div className="col-span-4 flex flex-col gap-1">
                          <span className="text-xs text-gray-400">Label (optional)</span>
                          <input
                            type="text"
                            placeholder="Birthday"
                            value={s.label}
                            onChange={(e) => updateScheduleRow(i, 'label', e.target.value)}
                            className="rounded-lg border border-gray-200 dark:border-gray-600 py-2.5 px-3 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                          />
                        </div>
                        <div className="col-span-1">
                          <button
                            type="button"
                            onClick={() => removeScheduleRow(i)}
                            disabled={schedules.length === 1}
                            className="w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Remove schedule"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addScheduleRow}
                    className="mt-3 text-sm font-semibold text-[#b8960c] hover:text-[#8a6f08] transition-colors"
                  >
                    + Add schedule
                  </button>
                </div>

                <Button
                  type="submit"
                  loading={adding}
                  disabled={!recipientName.trim() || !recipientEmail.trim() || !etfSymbol.trim() || !amount}
                >
                  Save favorite
                </Button>
              </form>
            </Card>

            {/* List */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{error}</div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
                  <span className="sr-only">Loading</span>
                </div>
              </div>
            ) : favorites.length === 0 ? (
              <Card className="p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">No favorites yet. Add one above to schedule automatic gifts.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {favorites.map((f) => (
                  <Card key={f.id} className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">{f.recipientName}</div>
                        <div className="text-sm text-gray-400 truncate">{f.recipientEmail}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          <span className="font-semibold text-[#b8960c]">{f.etfSymbol}</span> · ${f.amount.toFixed(2)} per gift
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(f.id)}
                        disabled={deletingId === f.id}
                        className="ml-3 flex-shrink-0 w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors disabled:opacity-50"
                        aria-label={`Delete favorite ${f.recipientName}`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                    {f.schedules.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {f.schedules.map((s) => (
                          <span key={s.id} className="inline-flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
                            <span className="font-medium">{formatSchedule(s.month, s.day)}</span>
                            {s.label && <span className="text-gray-400">· {s.label}</span>}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
