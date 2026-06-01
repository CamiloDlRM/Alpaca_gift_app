import { fetchCurrentPrice, fetchPriceHistory } from '../market-data/market-data.service';
import { getTopETFs } from '../rankings/rankings.service';

// ── Tool executors ──────────────────────────────────────────────────────────
export async function executeGetETFPrice(symbol: string): Promise<string> {
  try {
    const price = await fetchCurrentPrice(symbol.toUpperCase());
    return JSON.stringify({ symbol: symbol.toUpperCase(), price, currency: 'USD' });
  } catch {
    return JSON.stringify({ error: `Could not fetch price for ${symbol}` });
  }
}

export async function executeGetETFHistory(symbol: string, period: string): Promise<string> {
  try {
    const data = await fetchPriceHistory(symbol.toUpperCase(), period);
    const last = data[data.length - 1];
    const first = data[0];
    const change =
      first && last ? (((last.value - first.value) / first.value) * 100).toFixed(2) : '0';
    return JSON.stringify({
      symbol: symbol.toUpperCase(),
      period,
      currentPrice: last?.value ?? null,
      changePercent: change,
      dataPoints: data.length,
      high: Math.max(...data.map((d) => d.value)).toFixed(2),
      low: Math.min(...data.map((d) => d.value)).toFixed(2),
    });
  } catch {
    return JSON.stringify({ error: `Could not fetch history for ${symbol}` });
  }
}

export async function executeGetTopETFs(category?: string): Promise<string> {
  try {
    const etfs = await getTopETFs(5);
    const filtered = category
      ? etfs.filter((e) => e.category.toLowerCase().includes(category.toLowerCase()))
      : etfs;
    return JSON.stringify(
      filtered.map((e) => ({
        symbol: e.symbol,
        name: e.name,
        category: e.category,
        averageRating: e.averageRating,
        rankScore: e.rankScore,
        giftCount: e.giftCount,
      }))
    );
  } catch {
    return JSON.stringify({ error: 'Could not fetch top ETFs' });
  }
}

// ── OpenAI-compatible tool definitions (works with Groq) ────────────────────
export const GROQ_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_etf_price',
      description: 'Get the current real-time price for an ETF symbol from Yahoo Finance',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'ETF ticker symbol, e.g. VOO, QQQ, VGT' },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_etf_history',
      description: 'Get price history and performance stats for an ETF over a period',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'ETF ticker symbol' },
          period: { type: 'string', description: 'Period: 1D, 1W, 1M, 1Y, ALL' },
        },
        required: ['symbol', 'period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_etfs',
      description: 'Get the top-rated and most-gifted ETFs on WealthGift, optionally filtered by category',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Optional category filter like "Leading Companies" or "Innovation & Technology"',
          },
        },
        required: [],
      },
    },
  },
];

export type ToolName = 'get_etf_price' | 'get_etf_history' | 'get_top_etfs';

export async function executeTool(name: ToolName, args: Record<string, string>): Promise<string> {
  switch (name) {
    case 'get_etf_price':
      return executeGetETFPrice(args.symbol);
    case 'get_etf_history':
      return executeGetETFHistory(args.symbol, args.period ?? '1M');
    case 'get_top_etfs':
      return executeGetTopETFs(args.category);
    default:
      return JSON.stringify({ error: 'Unknown tool' });
  }
}
