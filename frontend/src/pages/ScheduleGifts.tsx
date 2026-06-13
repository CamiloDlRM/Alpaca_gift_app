import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';

interface GiftResponse {
  id: string;
  recipientName: string;
  occasion: string;
  etfSymbol: string;
  amount: number;
  deliveryDate: string;
  status: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function ScheduleGifts() {
  const { user } = useAuthStore();
  const isPro = user?.subscriptionStatus === 'PRO' || user?.subscriptionStatus === 'PRO_PLUS';

  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();

  const [gifts, setGifts] = useState<GiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(todayYear);
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await apiClient.get<GiftResponse[]>('/gifts');
      setGifts(res.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (isPro) fetchGifts();
    else setLoading(false);
  }, [isPro, fetchGifts]);

  const minYear = todayYear;
  const maxYear = todayYear + 1;

  const handlePrevYear = () => {
    if (selectedYear <= minYear) return;
    const newYear = selectedYear - 1;
    setSelectedYear(newYear);
    // clamp month to current month if going back to current year
    if (newYear === todayYear && selectedMonth < todayMonth) setSelectedMonth(todayMonth);
  };

  const handleNextYear = () => {
    if (selectedYear >= maxYear) return;
    setSelectedYear(selectedYear + 1);
  };

  const handleSelectMonth = (month: number) => {
    if (isPastMonth(month)) return;
    setSelectedMonth(month);
  };

  const isPastMonth = (month: number) =>
    selectedYear === todayYear && month < todayMonth;

  const monthGifts = gifts.filter(g => {
    const d = new Date(g.deliveryDate);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const selectedMonthLabel = `${MONTH_NAMES_FULL[selectedMonth]} ${selectedYear}`;

  if (!isPro) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
            <div className="text-center py-16 animate-slideUp">
              <div className="w-16 h-16 rounded-full bg-[#F5C518]/10 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">Scheduled Gifts</h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                Schedule gifts in advance with a Future Builder or Visionary plan.
              </p>
              <Link to="/pricing">
                <Button>Upgrade your plan</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-slideUp">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Gift Schedule</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Plan and track gifts throughout the year</p>
            </div>
            <Link to={`/send?type=SCHEDULED&month=${selectedMonth}&year=${selectedYear}`}>
              <Button>Schedule a Gift</Button>
            </Link>
          </div>

          {/* Year navigation */}
          <div className="flex items-center justify-center gap-4 mb-6 animate-fadeIn">
            <button
              onClick={handlePrevYear}
              disabled={selectedYear <= minYear}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous year"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xl font-bold text-gray-900 dark:text-white w-16 text-center">{selectedYear}</span>
            <button
              onClick={handleNextYear}
              disabled={selectedYear >= maxYear}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Next year"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Month pills */}
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 mb-8 animate-fadeIn">
            {MONTH_NAMES.map((name, i) => {
              const past = isPastMonth(i);
              const active = selectedMonth === i;
              const hasGifts = gifts.some(g => {
                const d = new Date(g.deliveryDate);
                return d.getMonth() === i && d.getFullYear() === selectedYear;
              });
              return (
                <button
                  key={name}
                  onClick={() => handleSelectMonth(i)}
                  disabled={past}
                  className={`relative py-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-[#F5C518] text-black shadow-sm'
                      : past
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {name}
                  {hasGifts && !active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F5C518]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Month content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
                <span className="sr-only">Loading</span>
              </div>
            </div>
          ) : (
            <div className="animate-fadeIn" key={`${selectedYear}-${selectedMonth}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${monthGifts.length > 0 ? 'bg-[#F5C518]' : 'bg-gray-200 dark:bg-gray-700'}`} />
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                  {selectedMonthLabel}
                  {monthGifts.length > 0 && (
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({monthGifts.length} {monthGifts.length === 1 ? 'gift' : 'gifts'})
                    </span>
                  )}
                </h2>
              </div>

              {monthGifts.length > 0 ? (
                <div className="space-y-2 ml-6">
                  {monthGifts.map((gift, gi) => (
                    <Card
                      key={gift.id}
                      className="p-4 flex items-center justify-between gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                      style={{ animationDelay: `${gi * 40}ms` }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#F5C518]/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#F5C518]">{new Date(gift.deliveryDate).getDate()}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white text-sm">{gift.recipientName}</div>
                          <div className="text-xs text-gray-400">{gift.occasion} &middot; {gift.etfSymbol} &middot; ${gift.amount.toFixed(2)}</div>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        gift.status === 'INVESTED' ? 'bg-green-50 text-green-700' :
                        gift.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {gift.status === 'PENDING' ? 'Scheduled' : gift.status.charAt(0) + gift.status.slice(1).toLowerCase().replace('_', ' ')}
                      </span>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="ml-6">
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">No gifts scheduled for {selectedMonthLabel}.</p>
                  <Link
                    to={`/send?type=SCHEDULED&month=${selectedMonth}&year=${selectedYear}`}
                    className="text-sm text-[#F5C518] hover:underline font-medium"
                  >
                    + Schedule a gift for {MONTH_NAMES_FULL[selectedMonth]}
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
