import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';

const ARTICLES = [
  {
    id: 1, emoji: '📈', category: 'Fundamentals',
    title: 'What is an ETF?',
    summary: 'An ETF (Exchange-Traded Fund) is an investment fund that trades on stock exchanges like a stock. It bundles multiple assets into a single instrument.',
    content: `An ETF combines the advantages of mutual funds with the flexibility of stocks. By buying an ETF like VOO (S&P 500), you are investing in the 500 largest U.S. companies with a single transaction.\n\n**Advantages:**\n• Instant diversification\n• Low costs (fees from 0.03%)\n• Liquidity — bought and sold during market hours\n• Transparency — you know exactly what you hold\n\n**Example:** If you gift $100 in VOO, that money is invested in Apple, Microsoft, Amazon, and 497 other companies simultaneously.`,
  },
  {
    id: 2, emoji: '🔄', category: 'Fundamentals',
    title: 'The Power of Compound Interest',
    summary: 'Compound interest is when your earnings generate more earnings. Einstein called it "the eighth wonder of the world".',
    content: `Compound interest works like this: if you invest $100 and earn 10%, you have $110. The next year you earn 10% on $110, not $100 — that is $11 in earnings, not $10.\n\n**Over time, the difference is enormous:**\n• $100 at 10% per year for 10 years = $259\n• $100 at 10% per year for 20 years = $672\n• $100 at 10% per year for 30 years = $1,745\n\nThat is why gifting investments to children and young people is so powerful — they have decades ahead of them.`,
  },
  {
    id: 3, emoji: '🛡️', category: 'Strategy',
    title: 'Diversification 101',
    summary: 'Do not put all your eggs in one basket. Diversification reduces risk without sacrificing returns.',
    content: `Diversification means spreading your investment across different assets so that if one falls, the others protect you.\n\n**Types of diversification:**\n• **By sector:** Technology (QQQ), Bonds (AGG), International (VEA)\n• **By size:** Large companies (VOO), Small companies (IWM)\n• **By geography:** USA (VTI), Emerging markets (VWO)\n\nA typical diversified portfolio for a long-term gift might be 80% equities (VOO) + 20% bonds (BND).`,
  },
  {
    id: 4, emoji: '📅', category: 'Strategy',
    title: 'When is the Best Time to Invest?',
    summary: 'The answer nobody wants to hear: the best time was yesterday. The second best time is today.',
    content: `Trying to "time the market" — waiting for the perfect dip to buy — is a strategy that almost always fails, even for professionals.\n\n**What the data says:**\n• The U.S. market has averaged ~10% per year over the last 100 years\n• Even if you buy right before a crash, historically you recover within 3-5 years\n• Every year you wait without investing is a year of lost compounding\n\n**Conclusion:** Consistency and time in the market matter more than the perfect entry point.`,
  },
  {
    id: 5, emoji: '🎁', category: 'WealthGift',
    title: 'Why Gift Investments?',
    summary: 'Cash gifts get spent. Toy gifts get forgotten. Investments grow.',
    content: `When you gift $100 in an ETF to a 10-year-old who holds it until age 40:\n\n• At the historical rate of 10% per year, those $100 become **$1,745**\n• The original gift no longer matters — what matters is time\n\n**Perfect use cases:**\n• Birthdays for nephews, nieces, or godchildren\n• Baby showers — the baby has 18 years for it to grow\n• Graduations — start the financial journey on the right foot\n• Anniversaries — a gift that represents the future together\n\nGifting investments means gifting financial education and opportunity at the same time.`,
  },
  {
    id: 6, emoji: '🔢', category: 'Available ETFs',
    title: 'Guide to WealthGift ETFs',
    summary: 'Get to know each of the 9 available ETFs: what they contain, their risk level, and who they are ideal for.',
    content: `**Large Cap Equities (low volatility, long term):**\n• VOO — S&P 500: The 500 largest U.S. companies\n• VTI — Total Market: The entire U.S. stock market (~4,000 companies)\n\n**Technology (higher growth, higher risk):**\n• QQQ — Nasdaq 100: Apple, Microsoft, Nvidia, Google...\n• VGT — Technology only: More concentrated than QQQ\n\n**Others:**\n• IWM — Small companies: Higher potential, more volatility\n• AGG / BND — Bonds: Low risk, for conservative profiles\n• VEA — Developed markets: Europe, Japan, Australia\n• VWO — Emerging markets: China, India, Brazil`,
  },
];

export default function Education() {
  const [openId, setOpenId] = useState<number | null>(null);
  const categories = [...new Set(ARTICLES.map(a => a.category))];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Education Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Everything you need to know about investments and ETFs.</p>

          {categories.map(cat => (
            <div key={cat} className="mb-8">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{cat}</h2>
              <div className="space-y-3">
                {ARTICLES.filter(a => a.category === cat).map(article => (
                  <Card key={article.id} className="overflow-hidden">
                    <button
                      className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => setOpenId(openId === article.id ? null : article.id)}
                    >
                      <span className="text-3xl flex-shrink-0">{article.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white">{article.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{article.summary}</div>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openId === article.id ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openId === article.id && (
                      <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
                        <div className="pt-4 text-sm text-gray-700 dark:text-gray-300 space-y-2 whitespace-pre-line leading-relaxed">
                          {article.content}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
