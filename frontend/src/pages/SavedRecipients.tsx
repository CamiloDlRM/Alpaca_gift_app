import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

interface SavedRecipient {
  id: string;
  userId: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function SavedRecipients() {
  const { user } = useAuthStore();
  const isPro = user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'PRO_PLUS';

  const [recipients, setRecipients] = useState<SavedRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [deletingId, setDeletingId] = useState<string>('');

  const fetchRecipients = useCallback(async () => {
    try {
      const { data } = await apiClient.get<SavedRecipient[]>('/saved-recipients');
      setRecipients(data);
    } catch {
      setError('Could not load your saved contacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPro) fetchRecipients();
    else setLoading(false);
  }, [isPro, fetchRecipients]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || adding) return;
    setAdding(true);
    setAddError('');
    try {
      const { data } = await apiClient.post<SavedRecipient>('/saved-recipients', {
        name: name.trim(),
        email: email.trim(),
      });
      setRecipients((prev) => [data, ...prev]);
      setName('');
      setEmail('');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setAddError(axiosErr.response?.data?.error || 'Could not save this contact.');
      } else {
        setAddError('Could not save this contact. Please try again.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiClient.delete(`/saved-recipients/${id}`);
      setRecipients((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Could not delete this contact.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      {!isPro ? (
        <main className="flex-1 flex flex-col">
          <UpgradePrompt feature="Saved Contacts" />
        </main>
      ) : (
        <main className="flex-1 px-4 py-8 sm:px-8 sm:py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Saved Contacts</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Save the people you gift often and fill in their details with one tap.
            </p>

            {/* Add form */}
            <Card className="p-6 mb-8">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add a contact</h2>
              {addError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4" role="alert">{addError}</div>
              )}
              <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
                <Input label="Name" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input label="Email" type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <div className="sm:col-span-2">
                  <Button type="submit" loading={adding} disabled={!name.trim() || !email.trim()}>Save contact</Button>
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
            ) : recipients.length === 0 ? (
              <Card className="p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400">No saved contacts yet. Add one above to get started.</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {recipients.map((r) => (
                  <Card key={r.id} className="p-5 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">{r.name}</div>
                      <div className="text-sm text-gray-400 truncate">{r.email}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                      className="ml-3 flex-shrink-0 w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors disabled:opacity-50"
                      aria-label={`Delete ${r.name}`}
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
