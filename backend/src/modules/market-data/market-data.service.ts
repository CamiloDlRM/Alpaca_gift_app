interface BarPoint {
  date: string;
  value: number;
}

const PERIOD_CONFIG: Record<string, { interval: string; range: string }> = {
  '1D': { interval: '5m',  range: '1d'  },
  '1W': { interval: '1h',  range: '5d'  },
  '1M': { interval: '1d',  range: '1mo' },
  '1Y': { interval: '1wk', range: '1y'  },
  'ALL': { interval: '1mo', range: '5y' },
};

export async function fetchPriceHistory(symbol: string, period: string): Promise<BarPoint[]> {
  const cfg = PERIOD_CONFIG[period] || PERIOD_CONFIG['1M'];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${cfg.interval}&range=${cfg.range}&includePrePost=false`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!res.ok) throw new Error(`Yahoo Finance error: ${res.status}`);

  const json = await res.json() as any;
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('No data returned from Yahoo Finance');

  const timestamps: number[] = result.timestamp || [];
  const closes: number[] = result.indicators?.quote?.[0]?.close || [];

  return timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      value: closes[i] ?? null,
    }))
    .filter((p) => p.value !== null) as BarPoint[];
}

export async function fetchCurrentPrice(symbol: string): Promise<number> {
  const bars = await fetchPriceHistory(symbol, '1D');
  if (bars.length === 0) throw new Error(`No price data for ${symbol}`);
  return bars[bars.length - 1].value;
}
