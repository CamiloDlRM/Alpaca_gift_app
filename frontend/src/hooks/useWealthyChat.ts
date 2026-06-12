import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/auth.store';

export type WealthyMode = 'regulations' | 'investments' | 'portfolio' | 'calculator';

export interface WealthyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useWealthyChat() {
  const [messages, setMessages] = useState<WealthyMessage[]>([]);
  const [mode, setMode] = useState<WealthyMode>('regulations');
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();
  const abortRef = useRef<AbortController | null>(null);

  const clearMessages = useCallback(() => setMessages([]), []);

  const switchMode = useCallback((m: WealthyMode) => {
    setMode(m);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: WealthyMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    };

    const assistantId = `a-${Date.now()}`;
    const assistantMsg: WealthyMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setLoading(true);

    // Build conversation history (last 10 turns to keep context short)
    const history = [...messages, userMsg]
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      abortRef.current = new AbortController();

      const res = await fetch(`${API_BASE}/api/wealthy/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mode, messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { content?: string };
            if (parsed.content) {
              fullContent += parsed.content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: fullContent, streaming: true }
                    : m
                )
              );
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      // Mark streaming done
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId ? { ...m, streaming: false } : m
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: "I'm having trouble connecting right now. Please check that DEEPSEEK_API_KEY and GEMINI_API_KEY are configured, then try again.",
                streaming: false,
              }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }, [loading, messages, mode, token]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
    setMessages(prev =>
      prev.map(m => m.streaming ? { ...m, streaming: false } : m)
    );
  }, []);

  return { messages, mode, loading, sendMessage, switchMode, clearMessages, cancelStream };
}
