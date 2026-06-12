import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

interface ImportantDate {
  id: string;
  userId: string;
  personName: string;
  personEmail: string | null;
  label: string;
  month: number;
  day: number;
  remindDaysBefore: number;
  createdAt: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(month: number, day: number): string {
  const name = MONTH_NAMES[month - 1] ?? '';
  return `${name} ${day}`;
}

export default function ImportantDates() {
  const { user } = useAuthStore();
  const isPro = user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'PRO_PLUS';

  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [personName, setPersonName] = useState('');
  const [personEmail, setPersonEmail] = useState('');
  const [label, setLabel] = useState('');
  const [month, setMonth] = useState('1');
  const [day, setDay] = useState('1');
  const [remindDaysBefore, setRemindDaysBefore] = useState('7');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const fetchDates = useCallback(async () => {
    try {
      const { data } = await apiClient.get<ImportantDate[]>('/important-dates');
      setDates(data);
    } catch {
      setError('Could not load your important dates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPro) fetchDates();
    else setLoading(false);
  }, [isPro, fetchDates]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !label.trim() || adding) return;
    setAdding(true);
    setAddError('');
    try {
      const { data } = await apiClient.post<ImportantDate>('/important-dates', {
        personName: personName.trim(),
        personEmail: personEmail.trim() || undefined,
        label: label.trim(),
        month: parseInt(month, 10),
        day: parseInt(day, 10),
        remindDaysBefore: parseInt(remindDaysBefore, 10) || 7,
      });
      setDates((prev) => [data, ...prev]);
      setPersonName('');
      setPersonEmail('');
      setLabel('');
      setMonth('1');
      setDay('1');
      setRemindDaysBefore('7');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setAddError(axiosErr.response?.data?.error || 'Could not save this date.');
      } else {
        setAddError('Could not save this date. Please try again.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/important-dates/${id}`);
      setDates((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError('Could not delete this date.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      {!isPro ? (
        <main className="flex-1 flex flex-col">
          <UpgradePrompt feature="Important Dates" />
        </main>
      ) : (
        <main className="flex-1 px-4 py-8 sm:px-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Important Dates</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Get smart reminders before birthdays, anniversaries and other dates that matter.
            </p>

            {/* Add form */}
            <Card className="p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add a date</h2>
              {addError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{addError}</div>
              )}
              <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
                <Input label="Person name" placeholder="Jane Doe" value={personName} onChange={(e) => setPersonName(e.target.value)} required />
                <Input label="Person email (optional)" type="email" placeholder="jane@example.com" value={personEmail} onChange={(e) => setPersonEmail(e.target.value)} />
                <Input label="Label" placeholder="Birthday, Anniversary…" value={label} onChange={(e) => setLabel(e.target.value)} required />
                <Input
                  label="Remind days before"
                  type="number"
                  min="0"
                  max="365"
                  value={remindDaysBefore}
                  onChange={(e) => setRemindDaysBefore(e.target.value)}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
                  <select
                    className="rounded-lg border border-gray-200 dark:border-gray-600 py-3 px-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Day"
                  type="number"
                  min="1"
                  max="31"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  required
                />
                <div className="sm:col-span-2">
                  <Button type="submit" loading={adding} disabled={!personName.trim() || !label.trim()}>Save date</Button>
                </div>
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
            ) : dates.length === 0 ? (
              <Card className="p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">No important dates saved yet. Add one above.</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {dates.map((d) => (
                  <Card key={d.id} className="p-5 flex items-start justify-between">
                    <div className="min-w-0">
                      <div className="inline-block text-xs font-bold uppercase tracking-wider bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2.5 py-0.5 rounded-full mb-2">
                        {d.label}
                      </div>
                      <div className="font-semibold text-gray-900 dark:text-white truncate">{d.personName}</div>
                      <div className="text-sm text-gray-400">{formatDate(d.month, d.day)}</div>
                      <div className="text-xs text-gray-400 mt-1">Reminder {d.remindDaysBefore} day(s) before</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
                      disabled={deletingId === d.id}
                      className="ml-3 flex-shrink-0 w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors disabled:opacity-50"
                      aria-label={`Delete ${d.label} for ${d.personName}`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
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
