import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../api/client';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  PENDING: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  CLAIMING: { bg: 'bg-blue-50', text: 'text-blue-700' },
  KYC_SUBMITTED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  KYC_VERIFIED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  AGREEMENT_SIGNED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  ACCOUNT_CREATING: { bg: 'bg-purple-50', text: 'text-purple-700' },
  INVESTED: { bg: 'bg-green-50', text: 'text-green-700' },
  FAILED: { bg: 'bg-red-50', text: 'text-red-700' },
};

const TABS = ['Overview', 'Performance', 'Statements', 'Documents'] as const;

// Generate mock chart data for the overview
function generateOverviewChart(): Array<{ date: string; value: number }> {
  const data: Array<{ date: string; value: number }> = [];
  let value = 1000;
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    value += (Math.random() - 0.4) * 20;
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(value, 800),
    });
  }
  return data;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const [gifts, setGifts] = useState<GiftResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Overview');
  const [chartData] = useState(generateOverviewChart);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await apiClient.get<GiftResponse[]>('/gifts');
      setGifts(res.data);
    } catch {
      setError('Failed to load gifts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  const totalGifted = gifts.reduce((sum, g) => sum + g.amount, 0);
  const investedGifts = gifts.filter((g) => g.status === 'INVESTED');
  const pendingGifts = gifts.filter((g) => g.status === 'PENDING');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">WealthGift</span>
          </div>
          <Link to="/send">
            <Button size="sm">Send Gift</Button>
          </Link>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">
          {/* Welcome header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}
              </h1>
              <p className="text-gray-500 mt-1">Here's your gifting overview</p>
            </div>
            <Link to="/send" className="hidden lg:block">
              <Button>Send a Gift</Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-5">
              <div className="text-sm text-gray-500 mb-1">Total Gifted</div>
              <div className="text-2xl font-bold text-gray-900">${totalGifted.toFixed(2)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-gray-500 mb-1">Gifts Sent</div>
              <div className="text-2xl font-bold text-gray-900">{gifts.length}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-gray-500 mb-1">Invested</div>
              <div className="text-2xl font-bold text-positive">{investedGifts.length}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-gray-500 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{pendingGifts.length}</div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl" role="tablist">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Portfolio chart */}
              {activeTab === 'Overview' && (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Portfolio Value</div>
                      <div className="text-3xl font-bold text-gray-900">${totalGifted.toFixed(2)}</div>
                    </div>
                    <div className="text-positive text-sm font-semibold bg-green-50 px-3 py-1 rounded-full">
                      +{gifts.length > 0 ? '8.4' : '0.0'}%
                    </div>
                  </div>
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="dashGoldGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F5C518" stopOpacity={0.2} />
                            <stop offset="100%" stopColor="#F5C518" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#9ca3af' }}
                          tickFormatter={(val: string) => {
                            const d = new Date(val);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }}
                        />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                          }}
                          formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                          labelFormatter={(label: string) => new Date(label).toLocaleDateString()}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#F5C518"
                          strokeWidth={2}
                          fill="url(#dashGoldGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {activeTab === 'Performance' && (
                <Card className="p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Analytics</h3>
                  <p className="text-gray-500">Detailed performance metrics will appear here once your gifts are invested.</p>
                </Card>
              )}

              {activeTab === 'Statements' && (
                <Card className="p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Statements</h3>
                  <p className="text-gray-500">Monthly and annual statements will be available here.</p>
                </Card>
              )}

              {activeTab === 'Documents' && (
                <Card className="p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
                  <p className="text-gray-500">Agreements, tax forms, and other documents will appear here.</p>
                </Card>
              )}

              {/* Gifts list */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Your Gifts</h2>
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
                  <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm" role="alert">{error}</div>
                )}

                {!loading && gifts.length === 0 && (
                  <Card className="p-8 text-center">
                    <div className="text-5xl mb-4" aria-hidden="true">
                      <svg className="w-16 h-16 mx-auto text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 7h-1.209A4.92 4.92 0 0019 5.5C19 3.57 17.43 2 15.5 2c-1.622 0-2.705 1.482-3.404 3.085C11.498 3.49 10.39 2 8.5 2 6.57 2 5 3.57 5 5.5c0 .596.079 1.089.209 1.5H4c-1.1 0-2 .9-2 2v2c0 .55.45 1 1 1v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c.55 0 1-.45 1-1V9c0-1.1-.9-2-2-2zm-4.5-3c.83 0 1.5.67 1.5 1.5S16.33 7 15.5 7H13c.5-1.58 1.55-3 2.5-3zM7 5.5C7 4.67 7.67 4 8.5 4c.95 0 2 1.42 2.5 3H8.5C7.67 7 7 6.33 7 5.5z"/>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No gifts yet</h3>
                    <p className="text-gray-500 mb-6">Send your first investment gift and start building wealth for your loved ones.</p>
                    <Link to="/send"><Button>Send Your First Gift</Button></Link>
                  </Card>
                )}

                <div className="space-y-3">
                  {gifts.map((gift) => {
                    const statusStyle = STATUS_COLORS[gift.status] || STATUS_COLORS.PENDING;
                    return (
                      <Card key={gift.id} className="p-5 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#F5C518]/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-[#F5C518]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M20 7h-1.209A4.92 4.92 0 0019 5.5C19 3.57 17.43 2 15.5 2c-1.622 0-2.705 1.482-3.404 3.085C11.498 3.49 10.39 2 8.5 2 6.57 2 5 3.57 5 5.5c0 .596.079 1.089.209 1.5H4c-1.1 0-2 .9-2 2v2c0 .55.45 1 1 1v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7c.55 0 1-.45 1-1V9c0-1.1-.9-2-2-2z"/>
                              </svg>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{gift.recipientName}</div>
                              <div className="text-sm text-gray-500">{gift.occasion} &middot; {gift.etfSymbol}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 sm:text-right">
                            <div>
                              <div className="font-semibold text-gray-900">${gift.amount.toFixed(2)}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(gift.deliveryDate).toLocaleDateString()}
                              </div>
                            </div>
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                              {gift.status.replace(/_/g, ' ')}
                            </span>
                            {gift.status === 'INVESTED' && (
                              <Link
                                to={`/dashboard/gift/${gift.id}`}
                                className="text-sm text-[#F5C518] font-semibold hover:underline"
                              >
                                View
                              </Link>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-6">
              {/* Upcoming gifts */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Upcoming Gifts</h3>
                {pendingGifts.length === 0 ? (
                  <p className="text-sm text-gray-400">No upcoming gifts scheduled.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingGifts.slice(0, 3).map((gift) => (
                      <div key={gift.id} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-[#F5C518] rounded-full flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{gift.recipientName}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(gift.deliveryDate).toLocaleDateString()} &middot; ${gift.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Education */}
              <Card className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Education Center</h3>
                <div className="space-y-4">
                  {[
                    { title: 'What is an ETF?', desc: 'Learn the basics of exchange-traded funds.' },
                    { title: 'Power of Compounding', desc: 'How small gifts grow into big wealth.' },
                    { title: 'Diversification 101', desc: 'Why spreading risk matters.' },
                  ].map((article) => (
                    <div key={article.title} className="group cursor-pointer">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-[#F5C518] transition-colors">
                        {article.title}
                      </div>
                      <div className="text-xs text-gray-400">{article.desc}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick action */}
              <div className="bg-gradient-to-br from-[#F5C518] to-yellow-400 rounded-xl p-6 text-black">
                <h3 className="font-bold mb-2">Gift an ETF Today</h3>
                <p className="text-sm text-black/70 mb-4">
                  The best time to invest was yesterday. The second best time is today.
                </p>
                <Link to="/send">
                  <Button variant="secondary" size="sm" className="bg-black text-white border-black hover:bg-gray-800">
                    Send Gift
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
