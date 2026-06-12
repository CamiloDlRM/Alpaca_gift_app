import { useState, useRef, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useWealthyChat, WealthyMode } from '../hooks/useWealthyChat';
import { useAuthStore } from '../store/auth.store';

const MODES: { key: WealthyMode; label: string; icon: string; desc: string }[] = [
  {
    key: 'regulations',
    label: 'Guidelines',
    icon: '📋',
    desc: 'How WealthGift works, plans, and rules',
  },
  {
    key: 'investments',
    label: 'Market',
    icon: '📈',
    desc: 'Real-time ETF data and gift recommendations',
  },
  {
    key: 'portfolio',
    label: 'Portfolio',
    icon: '💼',
    desc: 'Analyze your investments and get hold/sell advice',
  },
  {
    key: 'calculator',
    label: 'Calculator',
    icon: '🧮',
    desc: 'Historical returns and compound growth projections',
  },
];

const STARTERS: Record<WealthyMode, string[]> = {
  regulations: [
    "How do ETF gifts work?",
    "What's the difference between plans?",
    "How does the recipient claim their gift?",
  ],
  investments: [
    "What's the best ETF to gift today?",
    "How is VOO performing this month?",
    "Compare QQQ vs VGT for a tech-savvy recipient",
  ],
  portfolio: [
    "Should I hold or sell my current positions?",
    "How diversified is my portfolio?",
    "Which of my gifts is performing best?",
  ],
  calculator: [
    "What could $5,000 in VOO be worth in 20 years?",
    "Show real historical returns of QQQ",
    "Compare long-term growth: VOO vs QQQ",
  ],
};

function WealthyAvatar({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-[#F5C518] to-amber-500 flex items-center justify-center font-black text-black flex-shrink-0 shadow-sm`}>
      W
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"
          style={{ animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
        />
      ))}
    </div>
  );
}

export function WealthyWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { user } = useAuthStore();
  const { messages, mode, loading, sendMessage, switchMode, cancelStream } = useWealthyChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const currentMode = MODES.find(m => m.key === mode)!;

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-24 left-4 z-[55] w-[340px] max-h-[560px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-fadeIn"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
          role="dialog"
          aria-label="Wealthy AI assistant"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0d1829] to-[#1a2235] px-4 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <WealthyAvatar size="md" />
              <div>
                <div className="font-bold text-white text-sm">Wealthy</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-[10px] text-gray-400">AI · {currentMode.icon} {currentMode.label}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/wealthy"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white text-xs transition-colors"
                title="Open full screen"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close Wealthy"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800">
            {MODES.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => switchMode(m.key)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  mode === m.key
                    ? 'text-[#b8960c] border-b-2 border-[#F5C518] bg-white dark:bg-gray-900'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <WealthyAvatar />
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[240px]">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Hi{user ? ` ${user.name.split(' ')[0]}` : ''}! I'm <strong>Wealthy</strong>, your WealthGift AI. {currentMode.desc}. How can I help?
                    </p>
                  </div>
                </div>
                {/* Starter chips */}
                <div className="flex flex-col gap-1.5 pl-9">
                  {STARTERS[mode].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { sendMessage(s); setInput(''); }}
                      className="text-left text-xs text-[#b8960c] bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-xl px-3 py-1.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && <WealthyAvatar />}
                <div
                  className={`max-w-[240px] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#F5C518] text-black rounded-br-sm font-medium'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content === '' && msg.streaming ? (
                    <TypingDots />
                  ) : (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                  )}
                  {msg.streaming && msg.content !== '' && (
                    <span className="inline-block w-0.5 h-3 bg-gray-500 ml-0.5 animate-pulse align-text-bottom" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-900">
            {loading ? (
              <button
                type="button"
                onClick={cancelStream}
                className="flex-1 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                ■ Stop
              </button>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F5C518]"
                  placeholder={`Ask Wealthy…`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-xl bg-[#F5C518] hover:bg-yellow-400 text-black flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  aria-label="Send"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* ── Floating trigger button ─────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 lg:bottom-6 lg:left-6 ${
          open
            ? 'bg-gray-800 dark:bg-gray-700'
            : 'bg-gradient-to-br from-[#F5C518] to-amber-500 hover:shadow-[#F5C518]/40 hover:shadow-lg'
        }`}
        aria-label={open ? 'Close Wealthy' : 'Open Wealthy AI'}
      >
        {open ? (
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span className="font-black text-black text-xl">W</span>
        )}

        {/* Notification pulse when closed */}
        {!open && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse" aria-hidden="true" />
        )}
      </button>
    </>
  );
}
