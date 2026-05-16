import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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

export default function ScheduleGifts() {
  const [gifts, setGifts] = useState<GiftResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await apiClient.get<GiftResponse[]>('/gifts');
      setGifts(res.data);
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  // Group gifts by month of delivery date
  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(currentYear, i, 1);
    return {
      label: date.toLocaleString('default', { month: 'long', year: 'numeric' }),
      monthIndex: i,
      gifts: gifts.filter(g => {
        const d = new Date(g.deliveryDate);
        return d.getMonth() === i && d.getFullYear() === currentYear;
      }),
    };
  });

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Gift Schedule</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Plan and track gifts throughout the year</p>
            </div>
            <Link to="/send">
              <Button>Schedule a Gift</Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#F5C518] border-t-transparent rounded-full animate-spin" role="status">
                <span className="sr-only">Loading</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {months.map(month => (
                <div key={month.monthIndex}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-3 h-3 rounded-full ${month.gifts.length > 0 ? 'bg-[#F5C518]' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    <h2 className={`text-sm font-bold uppercase tracking-wider ${month.gifts.length > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                      {month.label}
                      {month.gifts.length > 0 && (
                        <span className="ml-2 text-xs font-normal text-gray-400">({month.gifts.length} {month.gifts.length === 1 ? 'gift' : 'gifts'})</span>
                      )}
                    </h2>
                  </div>

                  {month.gifts.length > 0 ? (
                    <div className="space-y-2 ml-6">
                      {month.gifts.map(gift => (
                        <Card key={gift.id} className="p-4 flex items-center justify-between gap-4">
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
                      <Link to="/send" className="text-sm text-gray-400 hover:text-[#F5C518] transition-colors">
                        + Schedule a gift for {month.label.split(' ')[0]}
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
