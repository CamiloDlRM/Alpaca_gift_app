import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const FAQS = [
  {
    q: 'How does the recipient claim their gift?',
    a: 'The recipient receives a unique claim link. When they open it, they will see the gift details and must complete an identity verification (KYC) process and sign an agreement before the investment is executed.',
  },
  {
    q: 'What happens if the recipient does not claim the gift?',
    a: 'The gift stays in PENDING status indefinitely. The claim link does not expire. You can copy and resend the link from the "My Gifts" section at any time.',
  },
  {
    q: 'Can I cancel a gift after sending it?',
    a: 'If the gift is in PENDING status (not yet claimed), contact support to process it. Once the recipient starts the claim process it cannot be cancelled.',
  },
  {
    q: 'What is the sending fee?',
    a: 'Each plan has a per-gift sending fee: Momments (free plan) pays $4.99 per gift, Future Builder ($39/year) pays $1.50 per gift, and Visionary ($69/year) pays $1.00 per gift.',
  },
  {
    q: 'Are my payments secure?',
    a: 'Yes. Payments are processed by Stripe, the industry standard for online payments. WealthGift never stores your card data.',
  },
  {
    q: 'How do I see the performance of a gift I sent?',
    a: 'Once the gift is in INVESTED status, a "View" button appears in "My Gifts" and on the Dashboard. From there you can see the current value and price history of the ETF.',
  },
  {
    q: 'Can the recipient sell their investment?',
    a: 'Yes. From their recipient portfolio, they can execute a sale that processes the transfer of the current value in 1-3 business days.',
  },
  {
    q: 'What ETFs are available?',
    a: 'We currently offer 100 ETFs across 5 WealthGift categories: Leading Companies, Innovation & Technology, Emerging Growth, Stability & Income, and Worldwide Growth. Visit the Education Center to learn about each one.',
  },
];

export default function Support() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Support</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Have a question? We are here to help.</p>

          {/* FAQ */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frequently asked questions</h2>
          <div className="space-y-2 mb-10">
            {FAQS.map((faq, i) => (
              <Card key={i} className="overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => setOpenIdx(openIdx === i ? null : i)}
                >
                  <span className="font-medium text-gray-900 dark:text-white text-sm">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIdx === i ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIdx === i && (
                  <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
                    <p className="pt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Contact form */}
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact support</h2>
          {sent ? (
            <Card className="p-8 text-center bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold text-green-800 dark:text-green-400 mb-1">Message sent</h3>
              <p className="text-green-700 dark:text-green-300 text-sm">We will respond within 24 business hours.</p>
            </Card>
          ) : (
            <Card className="p-6">
              <form onSubmit={handleSend} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject</label>
                  <input
                    className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent"
                    placeholder="How can we help?"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                  <textarea
                    className="rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-3 px-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F5C518] focus:border-transparent resize-none"
                    rows={5}
                    placeholder="Describe your issue or question in as much detail as possible..."
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Send message</Button>
              </form>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
