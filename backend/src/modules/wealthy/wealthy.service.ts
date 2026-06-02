import { Response } from 'express';
import { ChatMessage, WealthyMode } from './wealthy.types';
import { REGULATIONS_PROMPT, INVESTMENTS_PROMPT, PORTFOLIO_PROMPT } from './wealthy.prompts';
import { getConsolidatedRecipientPortfolio } from '../recipient/recipient.service';

// ── Provider config — all values from environment variables ──────────────────
const GROQ_URL          = process.env.GROQ_BASE_URL    || 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL_FAST   = process.env.GROQ_MODEL_FAST  || 'llama-3.3-70b-versatile';
const GROQ_MODEL_REASON = process.env.GROQ_MODEL_REASON || 'llama-3.3-70b-versatile';
const GEMINI_MODEL      = process.env.GEMINI_MODEL     || 'gemini-2.5-flash';
const GEMINI_BASE_URL   = process.env.GEMINI_BASE_URL  || 'https://generativelanguage.googleapis.com/v1beta';

// ── SSE helpers ───────────────────────────────────────────────────────────────
function sseToken(res: Response, content: string): void {
  res.write('data: ' + JSON.stringify({ content }) + '\n\n');
}

function sseDone(res: Response): void {
  res.write('data: [DONE]\n\n');
  res.end();
}

function sseSendFull(res: Response, content: string): void {
  sseToken(res, content);
  sseDone(res);
}

// DeepSeek-R1 "thinks" out loud inside <think>...</think> before answering.
// Strip that from the final output — the user only sees the clean answer.
function stripThinking(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

// ── OpenAI-compatible response types (Groq) ───────────────────────────────────
interface OpenAIResponse {
  choices?: Array<{
    message?: { content?: string };
    delta?:   { content?: string };
  }>;
}

// ── Gemini response types ─────────────────────────────────────────────────────
interface GeminiPart  { text?: string }
interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
}

// ── Mode 1: regulations — Groq Llama 3.3 70B, streaming ──────────────────────
export async function streamRegulations(messages: ChatMessage[], res: Response): Promise<void> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    sseSendFull(res,
      '⚙️ **Wealthy is not configured.** Please add `GROQ_API_KEY` to your environment.\n\n' +
      'Get a free key at https://console.groq.com — no credit card required.'
    );
    return;
  }

  try {
    const response = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:    GROQ_MODEL_FAST,
        stream:   true,
        messages: [{ role: 'system', content: REGULATIONS_PROMPT }, ...messages],
        max_tokens: 1024,
      }),
    });

    if (!response.ok || !response.body) {
      sseSendFull(res, "Sorry, I'm having trouble connecting right now. Please try again.");
      return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice('data:'.length).trim();
        if (payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload) as OpenAIResponse;
          const token  = parsed.choices?.[0]?.delta?.content;
          if (token) sseToken(res, token);
        } catch { /* skip malformed SSE lines */ }
      }
    }

    sseDone(res);
  } catch {
    sseSendFull(res, "Sorry, I'm having trouble connecting right now. Please try again.");
  }
}

// ── Mode 2: investments — Gemini 2.0 Flash + google_search, fallback to Groq ──
export async function chatInvestments(messages: ChatMessage[]): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const groqKey   = process.env.GROQ_API_KEY;

  if (geminiKey) {
    const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;
    const contents = messages.map(m => ({
      role:  m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    try {
      const response = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: INVESTMENTS_PROMPT }] },
          contents,
          tools: [{ google_search: {} }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as GeminiResponse;
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const text = parts.filter(p => p.text).map(p => p.text).join('');
        if (text.trim()) return text.trim();
      } else {
        const errText = await response.text().catch(() => '');
        console.error('[Wealthy/investments] Gemini error', response.status, errText);
      }
    } catch (err) {
      console.error('[Wealthy/investments] Gemini fetch failed:', err);
    }
  }

  // Fallback: use Groq (no real-time search, but reliable)
  if (groqKey) {
    try {
      const response = await fetch(GROQ_URL, {
        method:  'POST',
        headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:    GROQ_MODEL_FAST,
          stream:   false,
          messages: [{ role: 'system', content: INVESTMENTS_PROMPT }, ...messages],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as OpenAIResponse;
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      } else {
        const errText = await response.text().catch(() => '');
        console.error('[Wealthy/investments] Groq fallback error', response.status, errText);
      }
    } catch (err) {
      console.error('[Wealthy/investments] Groq fallback fetch failed:', err);
    }
  }

  return "Sorry, I'm having trouble connecting to market intelligence right now. Please try again.";
}

// ── Mode 3: portfolio — Groq DeepSeek-R1, with user's live portfolio context ─
// DeepSeek-R1's chain-of-thought reasoning is the best free model for analysis.
export async function chatPortfolio(messages: ChatMessage[], userEmail: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return '⚙️ Wealthy needs `GROQ_API_KEY` configured. Get it free at https://console.groq.com';
  }

  let portfolioContext: string;
  try {
    const portfolio = await getConsolidatedRecipientPortfolio(userEmail);

    if (portfolio.positions.length === 0) {
      portfolioContext = 'The user does not have any active WealthGift investments yet.';
    } else {
      const lines = portfolio.positions.map(p =>
        `- ${p.etfSymbol} (${p.etfName}): ` +
        `invested $${p.totalInvested}, current $${p.totalCurrentValue}, ` +
        `gain/loss ${p.gainLoss >= 0 ? '+' : ''}$${p.gainLoss} (${p.gainLossPercent >= 0 ? '+' : ''}${p.gainLossPercent}%), ` +
        `recent market ${p.changePercent >= 0 ? '+' : ''}${p.changePercent}%`
      );
      portfolioContext = [
        `Total invested:       $${portfolio.totalInvested}`,
        `Total current value:  $${portfolio.totalCurrentValue}`,
        `Total gain/loss:      ${portfolio.totalGainLoss >= 0 ? '+' : ''}$${portfolio.totalGainLoss} (${portfolio.totalGainLossPercent >= 0 ? '+' : ''}${portfolio.totalGainLossPercent}%)`,
        '',
        'Positions:',
        ...lines,
      ].join('\n');
    }
  } catch {
    portfolioContext = "The user's portfolio could not be loaded at this time.";
  }

  const systemPrompt = `${PORTFOLIO_PROMPT}\n\nUser's current WealthGift portfolio:\n${portfolioContext}`;

  try {
    const response = await fetch(GROQ_URL, {
      method:  'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:    GROQ_MODEL_REASON,
        stream:   false,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 2048,          // R1 needs room for chain-of-thought reasoning
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.error('[Wealthy/portfolio] Groq error', response.status, errText);
      return "Sorry, I'm having trouble connecting right now. Please try again.";
    }

    const data = (await response.json()) as OpenAIResponse;
    const raw  = data.choices?.[0]?.message?.content ?? '';
    const clean = stripThinking(raw);
    return clean || "I wasn't able to analyze your portfolio right now. Please try again.";
  } catch (err) {
    console.error('[Wealthy/portfolio] fetch failed:', err);
    return "Sorry, I'm having trouble connecting right now. Please try again.";
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
export async function chatWealthy(
  mode: WealthyMode,
  messages: ChatMessage[],
  res?: Response,
  userEmail?: string
): Promise<void> {
  if (!res) return;

  switch (mode) {
    case 'regulations':
      await streamRegulations(messages, res);
      return;

    case 'investments': {
      const text = await chatInvestments(messages);
      sseSendFull(res, text);
      return;
    }

    case 'portfolio': {
      if (!userEmail) {
        sseSendFull(res, 'Please sign in to let Wealthy analyze your portfolio.');
        return;
      }
      const text = await chatPortfolio(messages, userEmail);
      sseSendFull(res, text);
      return;
    }

    default:
      sseSendFull(res, 'Unknown mode. Please choose regulations, investments, or portfolio.');
  }
}
