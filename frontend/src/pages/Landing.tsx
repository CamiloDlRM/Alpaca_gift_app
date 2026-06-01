import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Nav } from '../components/layout/Nav';
import { useAuthStore } from '../store/auth.store';

// ─── Animated counter hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, delay = 400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
        else setValue(target);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, duration, delay]);
  return value;
}

// ─── Ticker data ─────────────────────────────────────────────────────────────
const TICKER = [
  { symbol: 'VOO',  price: '445.23', change: '+1.20%',  up: true  },
  { symbol: 'QQQ',  price: '432.18', change: '+2.14%',  up: true  },
  { symbol: 'VGT',  price: '487.65', change: '+1.95%',  up: true  },
  { symbol: 'IWM',  price: '196.32', change: '-0.43%',  up: false },
  { symbol: 'AGG',  price: '97.54',  change: '+0.12%',  up: true  },
  { symbol: 'SCHD', price: '84.22',  change: '+0.76%',  up: true  },
  { symbol: 'VEA',  price: '48.76',  change: '+0.67%',  up: true  },
  { symbol: 'SOXX', price: '212.40', change: '+3.11%',  up: true  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    text: 'I gifted my niece her first ETF for graduation. She checks her portfolio every week now. Best gift I ever gave!',
    role: 'Proud Aunt',
    avatar: 'SM',
  },
  {
    name: 'David L.',
    text: 'Instead of a toy that breaks in a month, I gave my son a piece of the S&P 500. He will thank me in 20 years.',
    role: 'Forward-Thinking Dad',
    avatar: 'DL',
  },
  {
    name: 'Priya K.',
    text: 'My parents gave me $200 in VOO for my birthday. That was 3 years ago — now it\'s $280. Better than cash!',
    role: 'Happy Recipient',
    avatar: 'PK',
  },
];

const STATS = [
  { value: '2,800+', label: 'Gifts sent' },
  { value: '$1.4M',  label: 'Total invested' },
  { value: '100',    label: 'ETFs available' },
  { value: '4.9★',   label: 'Avg. rating' },
];

// ─── Animated portfolio chart card ───────────────────────────────────────────
function PortfolioChartCard() {
  const [active, setActive] = useState<'1M' | '3M' | '6M' | '1Y'>('1Y');
  const portfolioValue = useCountUp(1247.83, 2000, 600);
  const gainPct = useCountUp(12.48, 1800, 800);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowBadge(true), 2600);
    return () => clearTimeout(t);
  }, []);

  // Path per period (same shape, slightly different curves for variety)
  const paths: Record<string, string> = {
    '1M': 'M0 180 C30 175 60 170 100 155 C140 140 160 148 200 130 C240 112 260 120 300 90 C340 60 370 70 400 55',
    '3M': 'M0 185 C30 178 60 168 100 148 C140 128 160 138 200 110 C240 82 260 98 300 62 C340 26 370 38 400 28',
    '6M': 'M0 182 C30 172 60 158 100 138 C140 118 160 130 200 98 C240 66 260 84 300 44 C340 4 370 18 400 10',
    '1Y': 'M0 180 C30 170 60 160 100 140 C140 120 160 130 200 100 C240 70 260 90 300 50 C340 10 370 30 400 20',
  };

  const fillPaths: Record<string, string> = {
    '1M': paths['1M'] + ' L400 200 L0 200 Z',
    '3M': paths['3M'] + ' L400 200 L0 200 Z',
    '6M': paths['6M'] + ' L400 200 L0 200 Z',
    '1Y': paths['1Y'] + ' L400 200 L0 200 Z',
  };

  // Live-dot endpoint per period
  const endpoints: Record<string, { x: number; y: number }> = {
    '1M': { x: 400, y: 55 },
    '3M': { x: 400, y: 28 },
    '6M': { x: 400, y: 10 },
    '1Y': { x: 400, y: 20 },
  };

  return (
    <div className="relative">
      {/* Glow behind the card */}
      <div className="absolute inset-0 rounded-3xl bg-[#F5C518]/20 blur-3xl scale-110 pointer-events-none" aria-hidden="true" />

      {/* Main card */}
      <div className="relative bg-[#0d1829] rounded-3xl p-6 border border-white/10 shadow-2xl overflow-hidden">

        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        {/* Header row */}
        <div className="relative flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Portfolio Growth</div>
            <div className="text-3xl font-black text-white tabular-nums">
              ${portfolioValue.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-green-400">
                +{gainPct.toFixed(2)}% all time
              </span>
              {showBadge && (
                <span className="animate-fadeIn inline-flex items-center gap-1 bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                  ↑ New High
                </span>
              )}
            </div>
          </div>

          {/* LIVE badge */}
          <div className="flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs font-bold tracking-wider">LIVE</span>
          </div>
        </div>

        {/* Period tabs */}
        <div className="relative flex gap-1 mb-4">
          {(['1M', '3M', '6M', '1Y'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActive(p)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                active === p
                  ? 'bg-[#F5C518] text-black'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Animated SVG chart */}
        <div className="relative">
          <svg
            key={active}
            viewBox="0 0 400 200"
            className="w-full"
            aria-label="Portfolio growth chart"
          >
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#F5C518" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#F5C518" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%"   stopColor="#b8960c" />
                <stop offset="100%" stopColor="#F5C518" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[40, 80, 120, 160].map((y) => (
              <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}

            {/* Gradient fill — fades in after line is drawn */}
            <path
              d={fillPaths[active]}
              fill="url(#chartFill)"
              className="animate-fill-chart"
            />

            {/* Animated line */}
            <path
              d={paths[active]}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              className="animate-draw-chart"
            />

            {/* Pulsing dot at the end of the line */}
            <circle
              cx={endpoints[active].x}
              cy={endpoints[active].y}
              r="5"
              fill="#F5C518"
              className="animate-live-dot"
              style={{ opacity: 0, animation: 'live-dot 1.6s ease-in-out 2.6s infinite, fill-chart 0.3s ease-out 2.5s forwards' }}
            />
            {/* Outer ring */}
            <circle
              cx={endpoints[active].x}
              cy={endpoints[active].y}
              r="10"
              fill="none"
              stroke="#F5C518"
              strokeWidth="1.5"
              strokeOpacity="0.4"
              style={{ opacity: 0, animation: 'live-dot 1.6s ease-in-out 2.6s infinite, fill-chart 0.3s ease-out 2.5s forwards' }}
            />
          </svg>

          {/* X-axis labels */}
          <div className="flex justify-between text-[10px] text-gray-600 mt-1 px-1">
            {active === '1Y' && ['Jan', 'Mar', 'Jun', 'Sep', 'Dec'].map((l) => <span key={l}>{l}</span>)}
            {active === '6M' && ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((l) => <span key={l}>{l}</span>)}
            {active === '3M' && ['Oct', 'Nov', 'Nov', 'Dec', 'Dec', 'Jan'].map((l) => <span key={l}>{l}</span>)}
            {active === '1M' && ['Dec 1', 'Dec 8', 'Dec 15', 'Dec 22', 'Jan 1'].map((l) => <span key={l}>{l}</span>)}
          </div>
        </div>

        {/* Scrolling ticker */}
        <div className="relative mt-4 overflow-hidden border-t border-white/5 pt-3 hidden sm:block">
          <div className="flex gap-6 animate-ticker whitespace-nowrap w-max">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 font-medium">{t.symbol}</span>
                <span className="text-white font-semibold">${t.price}</span>
                <span className={t.up ? 'text-green-400' : 'text-red-400'}>{t.change}</span>
              </span>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0d1829] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0d1829] to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Floating badge — VOO (hidden on mobile to avoid overflow) */}
      <div className="hidden sm:block absolute -top-4 -right-4 animate-float-card animate-fadeIn bg-[#0d1829] border border-white/10 rounded-2xl shadow-xl p-4 min-w-[110px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-[#F5C518]/20 border border-[#F5C518]/40 flex items-center justify-center">
            <span className="text-[9px] font-black text-[#F5C518]">V</span>
          </div>
          <span className="text-xs font-bold text-gray-300">VOO</span>
        </div>
        <div className="text-base font-black text-white">$445.23</div>
        <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          +1.20% today
        </div>
      </div>

      {/* Floating badge — Gift sent (hidden on mobile) */}
      <div className="hidden sm:block absolute -bottom-4 -left-4 animate-float-card-slow animate-fadeIn bg-[#0d1829] border border-white/10 rounded-2xl shadow-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-xs text-gray-400">Gift Invested</span>
        </div>
        <div className="text-sm font-black text-white">$500.00</div>
        <div className="text-[10px] text-[#F5C518] font-semibold">QQQ · Graduation 🎓</div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Landing() {
  const { token } = useAuthStore();
  const isLoggedIn = !!token;
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);

  useEffect(() => {
    if (!statsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      <Nav />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative">
        {/* Background glow — clipped to avoid horizontal scroll */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-bl from-[#F5C518]/5 to-transparent" />
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#F5C518]/10 blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left — copy */}
            <div className="space-y-8 animate-slideUp">
              <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-full text-sm font-medium">
                <span className="w-2 h-2 bg-[#F5C518] rounded-full animate-pulse" />
                The future of gifting is here
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                Give the gift of{' '}
                <span className="text-[#F5C518] relative inline-block">
                  investment
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" aria-hidden="true">
                    <path d="M2 8 C50 2 150 2 198 8" stroke="#F5C518" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-lg">
                Skip the gift cards. Give your loved ones real investments — ETFs that grow over time. Start building their wealth today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {!isLoggedIn ? (
                  <>
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center bg-[#F5C518] hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-yellow-400/30 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Get Started Free
                      <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold px-8 py-4 rounded-xl text-lg transition-colors"
                    >
                      Sign In
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center bg-[#F5C518] hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-yellow-400/30 hover:-translate-y-0.5"
                  >
                    Go to Dashboard
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                {['SEC Regulated', 'SIPC Protected', 'No Hidden Fees'].map((label) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right — animated chart */}
            <div className="relative sm:pt-6 sm:pb-6 sm:px-6">
              <PortfolioChartCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────── */}
      <div
        ref={statsRef}
        className="bg-[#1a2235] py-8"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label} className={`transition-all duration-700 ${statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="text-2xl sm:text-3xl font-black text-[#F5C518]">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-800 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">Three simple steps to give a life-changing gift</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="absolute top-8 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-[#F5C518]/40 to-transparent hidden sm:block" aria-hidden="true" />

            {[
              {
                step: '01',
                title: 'Choose a WealthGift Category',
                desc: 'Pick from 5 curated categories — Leading Companies, Innovation & Technology, Emerging Growth, and more.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                ),
              },
              {
                step: '02',
                title: 'Send the Gift',
                desc: 'Set an amount, add a personal note, and send a claim link to your loved one instantly.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                ),
              },
              {
                step: '03',
                title: 'Watch It Grow',
                desc: 'Your recipient claims the gift and the investment grows over time — tracked in a beautiful portfolio.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative bg-white dark:bg-gray-700/50 rounded-2xl p-8 border border-gray-100 dark:border-gray-600 hover:border-[#F5C518]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F5C518]/10 border border-[#F5C518]/20 flex items-center justify-center mx-auto mb-5 group-hover:bg-[#F5C518]/20 transition-colors">
                  <svg className="w-7 h-7 text-[#F5C518]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    {item.icon}
                  </svg>
                </div>
                <div className="text-[10px] font-black text-[#F5C518] tracking-widest uppercase mb-2 text-center">Step {item.step}</div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 text-center">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center mb-12">What People Are Saying</h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className="w-4 h-4 text-[#F5C518]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-5 leading-relaxed text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#F5C518]/20 border border-[#F5C518]/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#F5C518]">{t.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────────────── */}
      <section className="relative bg-[#F5C518] py-16 sm:py-20 overflow-hidden">
        {/* Background chart line decoration */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 250 C200 200 400 180 600 140 C800 100 1000 120 1200 60" fill="none" stroke="black" strokeWidth="2"/>
          <path d="M0 280 C200 230 400 220 600 180 C800 140 1000 160 1200 100" fill="none" stroke="black" strokeWidth="1"/>
        </svg>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-5xl mb-4">🎁</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black mb-4">
            Invest in your loved ones' future
          </h2>
          <p className="text-black/70 text-lg mb-8 max-w-2xl mx-auto">
            A gift that grows. Start building generational wealth today with just a few clicks.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center bg-black text-white font-bold px-10 py-4 rounded-xl text-lg hover:bg-gray-800 transition-colors hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Get Started Free
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center bg-black/10 hover:bg-black/20 text-black font-bold px-10 py-4 rounded-xl text-lg transition-colors"
                >
                  Sign In
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center bg-black text-white font-bold px-10 py-4 rounded-xl text-lg hover:bg-gray-800 transition-colors"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-[#1a2235] text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F5C518] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" aria-hidden="true">
                  <path d="M4 12 L8 8 L12 14 L16 6 L20 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-bold text-white text-lg">WealthGift</span>
            </div>
            <p className="text-sm text-center">&copy; 2026 WealthGift. All rights reserved. Not financial advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
