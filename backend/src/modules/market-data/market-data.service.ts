interface BarPoint {
  date: string;
  value: number;
}

// Simple in-process TTL cache — avoids hammering Yahoo Finance on every request.
interface CacheEntry<T> { value: T; expiresAt: number }
const priceCache   = new Map<string, CacheEntry<number>>();
const historyCache = new Map<string, CacheEntry<BarPoint[]>>();

const PRICE_TTL_MS   = 60_000;        // 1 minute — acceptable lag for live price
const HISTORY_TTL_MS = 5 * 60_000;    // 5 minutes — historical bars don't change

function cacheGet<T>(map: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = map.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { map.delete(key); return null; }
  return entry.value;
}
function cacheSet<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number): void {
  map.set(key, { value, expiresAt: Date.now() + ttlMs });
}

const PERIOD_CONFIG: Record<string, { interval: string; range: string }> = {
  '1D':  { interval: '5m',  range: '1d'  },
  '1W':  { interval: '1h',  range: '5d'  },
  '1M':  { interval: '1d',  range: '1mo' },
  '1Y':  { interval: '1wk', range: '1y'  },
  'ALL': { interval: '1mo', range: '5y'  },
};

export async function fetchPriceHistory(symbol: string, period: string): Promise<BarPoint[]> {
  const cacheKey = `${symbol}:${period}`;
  const cached = cacheGet(historyCache, cacheKey);
  if (cached) return cached;

  const cfg = PERIOD_CONFIG[period] || PERIOD_CONFIG['1M'];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${cfg.interval}&range=${cfg.range}&includePrePost=false`;

  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);

  const json = await res.json() as any;
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No data returned from Yahoo Finance');

  const timestamps: number[] = result.timestamp || [];
  const closes: number[]     = result.indicators?.quote?.[0]?.close || [];

  const bars = timestamps
    .map((ts, i) => ({
      date:  new Date(ts * 1000).toISOString().split('T')[0],
      value: closes[i] ?? null,
    }))
    .filter((p) => p.value !== null) as BarPoint[];

  cacheSet(historyCache, cacheKey, bars, HISTORY_TTL_MS);
  return bars;
}

export async function fetchCurrentPrice(symbol: string): Promise<number> {
  const cached = cacheGet(priceCache, symbol);
  if (cached !== null) return cached;

  // Use the lightweight quote endpoint — returns just the current price,
  // ~10× faster than fetching a full 1-day history.
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}&fields=regularMarketPrice`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const json = await res.json() as any;
      const price: number | undefined = json?.quoteResponse?.result?.[0]?.regularMarketPrice;
      if (price && price > 0) {
        cacheSet(priceCache, symbol, price, PRICE_TTL_MS);
        return price;
      }
    }
  } catch { /* fall through to history-based fallback */ }

  // Fallback: derive from 1-day history (also cached)
  const bars = await fetchPriceHistory(symbol, '1D');
  if (bars.length === 0) throw new Error(`No price data for ${symbol}`);
  const price = bars[bars.length - 1].value;
  cacheSet(priceCache, symbol, price, PRICE_TTL_MS);
  return price;
}
