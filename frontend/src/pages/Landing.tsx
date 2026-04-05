import { Link } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const testimonials = [
  {
    name: 'Sarah M.',
    text: 'I gifted my niece her first ETF for graduation. She checks her portfolio every week now. Best gift I ever gave!',
    role: 'Proud Aunt',
  },
  {
    name: 'David L.',
    text: 'Instead of a toy that breaks in a month, I gave my son a piece of the S&P 500. He will thank me in 20 years.',
    role: 'Forward-Thinking Dad',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-[#F5C518] rounded-full" />
                The future of gifting is here
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Give the gift of{' '}
                <span className="text-[#F5C518] relative">
                  investment
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" aria-hidden="true">
                    <path d="M2 8 C50 2 150 2 198 8" stroke="#F5C518" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-lg">
                Skip the gift cards. Give your loved ones real investments — ETFs that grow over time. Start building their wealth today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">Sign In</Button>
                </Link>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-positive" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  SEC Regulated
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-positive" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  SIPC Protected
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-positive" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  No Hidden Fees
                </div>
              </div>
            </div>

            {/* Decorative chart */}
            <div className="relative hidden lg:block">
              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                <div className="text-sm text-gray-500 mb-2">Portfolio Growth</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">$1,247.83</div>
                <div className="text-sm text-positive font-medium mb-6">+12.48% all time</div>
                <svg viewBox="0 0 400 200" className="w-full" aria-label="Decorative upward trending chart">
                  <defs>
                    <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F5C518" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#F5C518" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0 180 C30 170 60 160 100 140 C140 120 160 130 200 100 C240 70 260 90 300 50 C340 10 370 30 400 20 L400 200 L0 200 Z" fill="url(#heroGradient)" />
                  <path d="M0 180 C30 170 60 160 100 140 C140 120 160 130 200 100 C240 70 260 90 300 50 C340 10 370 30 400 20" fill="none" stroke="#F5C518" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>Jan</span><span>Mar</span><span>Jun</span><span>Sep</span><span>Dec</span>
                </div>
              </div>
              {/* Floating cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="text-xs text-gray-500">VOO</div>
                <div className="text-sm font-bold text-gray-900">$445.23</div>
                <div className="text-xs text-positive">+1.2%</div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
                <div className="text-xs text-gray-500">Gift Sent</div>
                <div className="text-sm font-bold text-gray-900">$500.00</div>
                <div className="text-xs text-[#F5C518]">QQQ</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Three simple steps to give a life-changing gift</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Choose an ETF', desc: 'Pick from curated investment funds — S&P 500, Tech, Bonds, and more.' },
              { step: '02', title: 'Send the Gift', desc: 'Set an amount, add a personal note, and send a claim link to your loved one.' },
              { step: '03', title: 'Watch It Grow', desc: 'Your recipient claims the gift, and their investment grows over time.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-[#F5C518] text-black font-bold text-lg flex items-center justify-center mx-auto mb-6">{item.step}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-12">What People Are Saying</h2>
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-8">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className="w-5 h-5 text-[#F5C518]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{t.text}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#F5C518] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">Invest in your loved ones' future</h2>
          <p className="text-black/70 text-lg mb-8 max-w-2xl mx-auto">
            A gift that grows. Start building generational wealth today with just a few clicks.
          </p>
          <Link to="/register">
            <Button variant="secondary" size="lg" className="bg-black text-white border-black hover:bg-gray-800">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a2235] text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                  <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-bold text-white text-lg">WealthGift</span>
            </div>
            <p className="text-sm">&copy; 2026 WealthGift. All rights reserved. Not financial advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
