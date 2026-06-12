import { FormEvent, useEffect, useRef } from 'react';
import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { useWealthyChat, WealthyMode } from '../hooks/useWealthyChat';
import { useAuthStore } from '../store/auth.store';

const MODES: { key: WealthyMode; label: string; icon: string; desc: string; color: string }[] = [
  {
    key: 'regulations',
    label: 'Guidelines',
    icon: '📋',
    desc: 'How WealthGift works, plans, categories, and rules',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    key: 'investments',
    label: 'Market Intelligence',
    icon: '📈',
    desc: 'Real-time ETF data and gift recommendations based on today\'s market',
    color: 'from-green-500 to-emerald-600',
  },
  {
    key: 'portfolio',
    label: 'Portfolio Observer',
    icon: '💼',
    desc: 'Analyze your investments and get personalized hold/sell advice',
    color: 'from-[#F5C518] to-amber-500',
  },
  {
    key: 'calculator',
    label: 'ETF Calculator',
    icon: '🧮',
    desc: 'Real historical returns and compound growth projections for any ETF',
    color: 'from-purple-500 to-violet-600',
  },
];

const STARTERS: Record<WealthyMode, string[]> = {
  regulations: [
    "How do ETF gifts work on WealthGift?",
    "What's the difference between Basic, Pro, and Pro+ plans?",
    "How does the recipient claim their investment gift?",
    "What ETF categories are available?",
  ],
  investments: [
    "What's the best ETF to gift right now?",
    "How has VOO performed over the last month?",
    "Compare QQQ vs VGT for someone interested in tech",
    "Which ETF category is trending on WealthGift?",
  ],
  portfolio: [
    "Should I hold or sell my current positions?",
    "How diversified is my portfolio?",
    "Which of my investments is performing the best?",
    "Give me an overall analysis of my WealthGift portfolio",
  ],
  calculator: [
    "If I invest $5,000 in VOO today, what could it be worth in 20 years?",
    "Show me real historical returns of QQQ over the last 10 years",
    "How much would I need to invest monthly in VTI to reach $100k in 15 years?",
    "Compare long-term growth: VOO vs QQQ vs VGT",
  ],
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500"
          style={{ animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
        />
      ))}
    </div>
  );
}

export default function WealthyPage() {
  const [input, setInput] = useState('');
  const { user } = useAuthStore();
  const { messages, mode, loading, sendMessage, switchMode, cancelStream } = useWealthyChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!input.trim()) return;
      sendMessage(input);
      setInput('');
    }
  };

  const currentMode = MODES.find(m => m.key === mode)!;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-0">
        {/* Mobile header */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F5C518] to-amber-500 flex items-center justify-center font-black text-black text-base">
            W
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white">Wealthy</span>
            <p className="text-xs text-gray-500">AI Investment Assistant</p>
          </div>
        </div>

        {/* Page layout: sidebar + chat */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left panel — mode selector */}
          <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 flex-shrink-0">
            {/* Branding */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5C518] to-amber-500 flex items-center justify-center shadow-lg">
                  <span className="font-black text-black text-xl">W</span>
                </div>
                <div>
                  <div className="font-black text-gray-900 dark:text-white text-lg">Wealthy</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400">AI Assistant · Online</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                Your intelligent companion for WealthGift — powered by Groq &amp; Gemini (free)
              </p>
            </div>

            {/* Mode cards */}
            <div className="p-4 space-y-3 flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Choose a mode</p>
              {MODES.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => switchMode(m.key)}
                  className={`w-full text-left rounded-xl p-3.5 border-2 transition-all ${
                    mode === m.key
                      ? 'border-[#F5C518] bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-700/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{m.icon}</span>
                    <span className={`text-sm font-bold ${mode === m.key ? 'text-yellow-800 dark:text-yellow-200' : 'text-gray-800 dark:text-white'}`}>
                      {m.label}
                    </span>
                    {mode === m.key && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-[#F5C518]" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                ⚠️ Wealthy provides information and analysis only. Not financial advice. Always do your own research.
              </p>
            </div>
          </aside>

          {/* Right — chat area */}
          <div className="flex-1 flex flex-col min-h-0">

            {/* Mode tabs — mobile only */}
            <div className="md:hidden flex border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
              {MODES.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => switchMode(m.key)}
                  className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                    mode === m.key
                      ? 'text-[#b8960c] border-b-2 border-[#F5C518]'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {/* Chat header */}
            <div className="hidden md:flex items-center gap-3 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
              <span className="text-2xl">{currentMode.icon}</span>
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">{currentMode.label}</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentMode.desc}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="max-w-2xl mx-auto space-y-6 pt-4">
                  {/* Welcome message */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F5C518] to-amber-500 flex items-center justify-center font-black text-black flex-shrink-0">
                      W
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-md shadow-sm">
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        Hey{user ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm <strong>Wealthy</strong>, your WealthGift AI assistant powered by Groq &amp; Gemini (100% free).
                        <br /><br />
                        I'm in <strong>{currentMode.icon} {currentMode.label}</strong> mode — {currentMode.desc.toLowerCase()}. What would you like to know?
                      </p>
                    </div>
                  </div>

                  {/* Starter suggestions */}
                  <div className="pl-12">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 font-medium">Try asking:</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {STARTERS[mode].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { sendMessage(s); }}
                          className="text-left text-sm text-[#b8960c] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-xl px-4 py-3 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors leading-snug"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-3 max-w-2xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F5C518] to-amber-500 flex items-center justify-center font-black text-black text-sm flex-shrink-0">
                      W
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[75%] ${
                      msg.role === 'user'
                        ? 'bg-[#F5C518] text-black rounded-br-sm font-medium shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-gray-700 shadow-sm'
                    }`}
                  >
                    {msg.content === '' && msg.streaming ? (
                      <TypingDots />
                    ) : (
                      <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                    )}
                    {msg.streaming && msg.content !== '' && (
                      <span className="inline-block w-0.5 h-4 bg-gray-500 ml-0.5 animate-pulse align-text-bottom" />
                    )}
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex-shrink-0">
              <div className="max-w-2xl mx-auto">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <span className="text-sm text-gray-400">Wealthy is thinking…</span>
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#F5C518]" style={{ animation: `bounce 1.2s ${i*0.15}s infinite` }} />
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={cancelStream}
                      className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-100 transition-colors"
                    >
                      ■ Stop
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex items-end gap-3">
                    <textarea
                      ref={inputRef}
                      className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518] resize-none"
                      placeholder={`Ask Wealthy about ${currentMode.label.toLowerCase()}… (Enter to send, Shift+Enter for new line)`}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      maxLength={1000}
                      style={{ minHeight: '48px', maxHeight: '120px' }}
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="w-12 h-12 rounded-xl bg-[#F5C518] hover:bg-yellow-400 text-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-sm"
                      aria-label="Send message"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </form>
                )}
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
                  Wealthy · Not financial advice · Mode 1 &amp; 3: Groq (free) · Mode 2: Gemini + Google Search (free)
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
