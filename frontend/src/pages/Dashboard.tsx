import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

interface GiftResponse {
  id: string;
  senderId: string;
  recipientName: string;
  occasion: string;
  etfSymbol: string;
  amount: number;
  note: string | null;
  deliveryDate: string;
  status: string;
  claimToken: string;
  claimLink: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING:          { bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  CLAIMING:         { bg: 'bg-blue-50',    text: 'text-blue-700' },
  KYC_SUBMITTED:    { bg: 'bg-blue-50',    text: 'text-blue-700' },
  KYC_VERIFIED:     { bg: 'bg-blue-50',    text: 'text-blue-700' },
  AGREEMENT_SIGNED: { bg: 'bg-blue-50',    text: 'text-blue-700' },
  ACCOUNT_CREATING: { bg: 'bg-purple-50',  text: 'text-purple-700' },
  INVESTED:         { bg: 'bg-green-50',   text: 'text-green-700' },
  FAILED:           { bg: 'bg-red-50',     text: 'text-red-700' },
  REDEEMED:         { bg: 'bg-gray-50',    text: 'text-gray-600' },
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:          'Pending',
  CLAIMING:         'Claiming',
  KYC_SUBMITTED:    'KYC Submitted',
  KYC_VERIFIED:     'KYC Verified',
  AGREEMENT_SIGNED: 'Agreement Signed',
  ACCOUNT_CREATING: 'Creating Account',
  INVESTED:         'Invested',
  FAILED:           'Failed',
  REDEEMED:         'Redeemed',
};

function PlanBadge({ status, giftsCount }: { status: string; giftsCount: number }) {
  if (status === 'PRO') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-50 text-green-700 px-3 py-1 rounded-full">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        PRO
      </span>
    );
  }
  if (status === 'PRO_PLUS') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        PRO+
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
      Basic Plan &middot; {giftsCount}/5
      <Link to="/pricing" className="text-[#F5C518] font-semibold hover:underline">Upgrade</Link>
    </span>
  );
}

const NOTIFS_PER_PAGE = 3;
const GIFTS_PER_PAGE = 5;

export default function Dashboard() {
  const { user, updateUser } = useAuthStore();
  const [gifts, setGifts] = useState<GiftResponse[]>([]);
  const [receivedGifts, setReceivedGifts] = useState<GiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifPage, setNotifPage] = useState(0);
  const [giftsPage, setGiftsPage] = useState(0);
  const [dismissedGifts, setDismissedGifts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('dismissed_gift_notifs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const dismissGift = (id: string) => {
    setDismissedGifts(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('dismissed_gift_notifs', JSON.stringify([...next]));
      return next;
    });
  };

  const fetchData = useCallback(async () => {
    try {
      const [sentRes, receivedRes, subRes] = await Promise.all([
        apiClient.get<GiftResponse[]>('/gifts'),
        apiClient.get<GiftResponse[]>('/gifts/received'),
        apiClient.get<{ plan: 'BASIC' | 'PRO' | 'PRO_PLUS' }>('/subscriptions').catch(() => null),
      ]);
      setGifts(sentRes.data);
      setReceivedGifts(receivedRes.data);
      if (subRes && subRes.data.plan !== user?.subscriptionStatus) {
        updateUser({ subscriptionStatus: subRes.data.plan });
      }
    } catch {
      setError('Failed to load gifts.');
    } finally {
      setLoading(false);
    }
  }, [updateUser, user?.subscriptionStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalGifted = gifts.reduce((sum, g) => sum + g.amount, 0);
  const investedGifts = gifts.filter((g) => g.status === 'INVESTED');
  const pendingGifts = gifts.filter((g) => g.status === 'PENDING');

  const totalGiftPages = Math.max(1, Math.ceil(gifts.length / GIFTS_PER_PAGE));
  const safeGiftsPage = Math.min(giftsPage, totalGiftPages - 1);
  const pagedGifts = gifts.slice(safeGiftsPage * GIFTS_PER_PAGE, safeGiftsPage * GIFTS_PER_PAGE + GIFTS_PER_PAGE);

  const visibleGifts = receivedGifts.filter((g) => !dismissedGifts.has(g.id));
  const totalNotifPages = Math.max(1, Math.ceil(visibleGifts.length / NOTIFS_PER_PAGE));
  const safeNotifPage = Math.min(notifPage, totalNotifPages - 1);
  const paginatedGifts = visibleGifts.slice(
    safeNotifPage * NOTIFS_PER_PAGE,
    safeNotifPage * NOTIFS_PER_PAGE + NOTIFS_PER_PAGE,
  );
  const hasPortfolioGift = receivedGifts.some((g) => g.status === 'INVESTED' || g.status === 'REDEEMED');

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 dark:text-white">WealthGift</span>
          </div>
          <Link to="/send">
            <Button size="sm">Send Gift</Button>
          </Link>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
          {/* Welcome header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 animate-slideUp">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Welcome{user ? `, ${user.name.split(' ')[0]}` : ''}
                </h1>
                <PlanBadge status={user?.subscriptionStatus ?? 'BASIC'} giftsCount={gifts.length} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Your investment gifts overview</p>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              {hasPortfolioGift && (
                <Link to="/my-portfolio">
                  <Button variant="secondary">View My Portfolio</Button>
                </Link>
              )}
              <Link to="/send">
                <Button>Send a Gift</Button>
              </Link>
            </div>
          </div>

          {/* Received gifts */}
          {visibleGifts.length > 0 && (
            <div className="mb-8 space-y-3">
              {paginatedGifts.map((gift, gi) => {
                const isClaimed = !['PENDING', 'CLAIMING'].includes(gift.status);
                return (
                  <div
                    key={gift.id}
                    className="relative flex flex-col sm:flex-row sm:items-center gap-4 bg-gradient-to-r from-[#F5C518]/10 to-yellow-50 dark:to-yellow-900/10 border border-[#F5C518]/40 rounded-xl px-5 py-4 animate-slideUp hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                    style={{ animationDelay: `${gi * 60}ms`, animationFillMode: 'both' }}
                  >
                    <button
                      onClick={() => dismissGift(gift.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
                      aria-label="Cerrar notificación"
                    >
                      ×
                    </button>
                    <div className="text-3xl flex-shrink-0">🎁</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        You have a gift of <span className="text-[#b8960c]">${gift.amount.toFixed(2)}</span> in {gift.etfSymbol}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {gift.occasion} &middot; {isClaimed ? `Status: ${STATUS_LABELS[gift.status] ?? gift.status}` : 'Pending claim'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {gift.status === 'INVESTED' || gift.status === 'REDEEMED' ? (
                        <Link
                          to={`/recipient/${gift.claimToken}/dashboard`}
                          className="inline-flex items-center gap-2 bg-[#F5C518] text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                        >
                          View portfolio
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </Link>
                      ) : !isClaimed ? (
                        <a
                          href={gift.claimLink}
                          className="inline-flex items-center gap-2 bg-[#F5C518] text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                        >
                          Claim gift
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                          {STATUS_LABELS[gift.status] ?? gift.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {totalNotifPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNotifPage((p) => Math.max(0, p - 1))}
                    disabled={safeNotifPage === 0}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous notifications page"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Page {safeNotifPage + 1} of {totalNotifPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNotifPage((p) => Math.min(totalNotifPages - 1, p + 1))}
                    disabled={safeNotifPage >= totalNotifPages - 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next notifications page"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slideUp" style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
            <Card className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Gifted</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">${totalGifted.toFixed(2)}</div>
            </Card>
            <Card className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gifts Sent</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{gifts.length}</div>
            </Card>
            <Card className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Invested</div>
              <div className="text-2xl font-bold text-green-600">{investedGifts.length}</div>
            </Card>
            <Card className="p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{pendingGifts.length}</div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Gifts</h2>
                  <Link to="/send" className="text-sm text-[#F5C518] font-semibold hover:underline">Send New</Link>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
                      <span className="sr-only">Loading</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>
                )}

                {!loading && gifts.length === 0 && (
                  <Card className="p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-200 dark:text-gray-600 mb-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20 7h-1.209A4.92 4.92 0 0019 5.5C19 3.57 17.43 2 15.5 2c-1.622 0-2.705 1.482-3.404 3.085C11.498 3.49 10.39 2 8.5 2 6.57 2 5 3.57 5 5.5c0 .596.079 1.089.209 1.5H4c-1.1 0-2 .9-2 2v2c0 .55.45 1 1 1v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c.55 0 1-.45 1-1V9c0-1.1-.9-2-2-2zm-4.5-3c.83 0 1.5.67 1.5 1.5S16.33 7 15.5 7H13c.5-1.58 1.55-3 2.5-3zM7 5.5C7 4.67 7.67 4 8.5 4c.95 0 2 1.42 2.5 3H8.5C7.67 7 7 6.33 7 5.5z"/>
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No gifts yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Send your first investment gift and start building wealth for your loved ones.</p>
                    <Link to="/send"><Button>Send First Gift</Button></Link>
                  </Card>
                )}

                <div className="space-y-3">
                  {pagedGifts.map((gift, gi) => {
                    const statusStyle = STATUS_COLORS[gift.status] || STATUS_COLORS.PENDING;
                    return (
                      <Card key={gift.id} className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-slideUp" style={{ animationDelay: `${gi * 50}ms`, animationFillMode: 'both' }}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#F5C518]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-[#F5C518]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M20 7h-1.209A4.92 4.92 0 0019 5.5C19 3.57 17.43 2 15.5 2c-1.622 0-2.705 1.482-3.404 3.085C11.498 3.49 10.39 2 8.5 2 6.57 2 5 3.57 5 5.5c0 .596.079 1.089.209 1.5H4c-1.1 0-2 .9-2 2v2c0 .55.45 1 1 1v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c.55 0 1-.45 1-1V9c0-1.1-.9-2-2-2z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">{gift.recipientName}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{gift.occasion} &middot; {gift.etfSymbol}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:text-right">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">${gift.amount.toFixed(2)}</div>
                              <div className="text-xs text-gray-400">{new Date(gift.deliveryDate).toLocaleDateString()}</div>
                            </div>
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                              {STATUS_LABELS[gift.status] ?? gift.status}
                            </span>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {totalGiftPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setGiftsPage((p) => Math.max(0, p - 1))}
                      disabled={safeGiftsPage === 0}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Page {safeGiftsPage + 1} of {totalGiftPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGiftsPage((p) => Math.min(totalGiftPages - 1, p + 1))}
                      disabled={safeGiftsPage >= totalGiftPages - 1}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">Pending claim</h3>
                <p className="text-xs text-gray-400 mb-4">Gifts waiting for the recipient</p>
                {pendingGifts.length === 0 ? (
                  <p className="text-sm text-gray-400">All gifts have been claimed.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingGifts.slice(0, 3).map((gift) => (
                      <div key={gift.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#F5C518] rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{gift.recipientName}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(gift.deliveryDate).toLocaleDateString()} &middot; ${gift.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Education Center</h3>
                <div className="space-y-4">
                  {[
                    { id: 1, title: 'What is an ETF?', desc: 'Learn the basics of exchange-traded funds.' },
                    { id: 2, title: 'The power of compound interest', desc: 'How small gifts grow into great wealth.' },
                    { id: 3, title: 'Diversification 101', desc: 'Why spreading risk matters.' },
                  ].map((article) => (
                    <Link key={article.title} to={`/education?open=${article.id}`} className="group block">
                      <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-[#F5C518] transition-colors">{article.title}</div>
                      <div className="text-xs text-gray-400">{article.desc}</div>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
