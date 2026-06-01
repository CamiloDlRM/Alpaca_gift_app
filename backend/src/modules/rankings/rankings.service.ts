import { prisma } from '../../shared/db/prisma.client';
import { getAllETFs } from '../etfs/etfs.service';
import type {
  CategoryRanking,
  ETFRanking,
  RankingsResponse,
  CategoryETFsResponse,
} from './rankings.types';

// Weighted rank score: 40% gift count, 30% avg rating, 20% recent usage, 10% total ratings
function calcRankScore(
  giftCount: number,
  avgRating: number,
  recentCount: number,
  totalRatings: number,
  maxGifts: number,
  maxRecent: number
): number {
  const giftNorm = maxGifts > 0 ? giftCount / maxGifts : 0;
  const ratingNorm = avgRating / 5;
  const recentNorm = maxRecent > 0 ? recentCount / maxRecent : 0;
  const ratingsNorm = Math.min(totalRatings / 50, 1); // cap at 50 ratings
  return giftNorm * 40 + ratingNorm * 30 + recentNorm * 20 + ratingsNorm * 10;
}

function getTrend(recentCount: number, totalCount: number): 'up' | 'down' | 'stable' {
  if (totalCount === 0) return 'stable';
  const recentRatio = recentCount / totalCount;
  if (recentRatio > 0.4) return 'up';
  if (recentRatio < 0.1) return 'down';
  return 'stable';
}

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function thirtyDaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d;
}

interface SymbolStats {
  giftCount: number;
  recentGiftCount: number;
  totalRatings: number;
  averageRating: number;
  senderAverageRating: number;
  receiverAverageRating: number;
}

/**
 * Builds a per-symbol stats map by combining gift counts and rating aggregates.
 * Uses Prisma groupBy queries that are then merged in the service layer.
 */
async function buildSymbolStats(): Promise<Map<string, SymbolStats>> {
  const cutoff = thirtyDaysAgo();

  const [giftGroups, recentGiftGroups, ratingGroups] = await Promise.all([
    prisma.gift.groupBy({
      by: ['etfSymbol'],
      _count: { _all: true },
    }),
    prisma.gift.groupBy({
      by: ['etfSymbol'],
      where: { createdAt: { gte: cutoff } },
      _count: { _all: true },
    }),
    prisma.eTFRating.groupBy({
      by: ['etfSymbol', 'role'],
      _avg: { stars: true },
      _count: { _all: true },
    }),
  ]);

  const stats = new Map<string, SymbolStats>();

  const ensure = (symbol: string): SymbolStats => {
    const key = symbol.toUpperCase();
    let entry = stats.get(key);
    if (!entry) {
      entry = {
        giftCount: 0,
        recentGiftCount: 0,
        totalRatings: 0,
        averageRating: 0,
        senderAverageRating: 0,
        receiverAverageRating: 0,
      };
      stats.set(key, entry);
    }
    return entry;
  };

  for (const g of giftGroups) {
    ensure(g.etfSymbol).giftCount = g._count._all;
  }

  for (const g of recentGiftGroups) {
    ensure(g.etfSymbol).recentGiftCount = g._count._all;
  }

  // Accumulate rating sums per symbol so we can compute overall average across roles.
  const ratingSums = new Map<string, { sum: number; count: number }>();

  for (const r of ratingGroups) {
    const entry = ensure(r.etfSymbol);
    const count = r._count._all;
    const avg = r._avg.stars ?? 0;

    if (r.role === 'SENDER') {
      entry.senderAverageRating = round2(avg);
    } else if (r.role === 'RECEIVER') {
      entry.receiverAverageRating = round2(avg);
    }

    const key = r.etfSymbol.toUpperCase();
    const sums = ratingSums.get(key) ?? { sum: 0, count: 0 };
    sums.sum += avg * count;
    sums.count += count;
    ratingSums.set(key, sums);
  }

  for (const [key, sums] of ratingSums.entries()) {
    const entry = ensure(key);
    entry.totalRatings = sums.count;
    entry.averageRating = sums.count > 0 ? round2(sums.sum / sums.count) : 0;
  }

  return stats;
}

export async function getTopETFs(limit = 10): Promise<ETFRanking[]> {
  const catalog = getAllETFs();
  const stats = await buildSymbolStats();

  let maxGifts = 0;
  let maxRecent = 0;
  for (const etf of catalog) {
    const s = stats.get(etf.symbol.toUpperCase());
    if (s) {
      if (s.giftCount > maxGifts) maxGifts = s.giftCount;
      if (s.recentGiftCount > maxRecent) maxRecent = s.recentGiftCount;
    }
  }

  const ranked: ETFRanking[] = catalog.map((etf) => {
    const s = stats.get(etf.symbol.toUpperCase());
    const giftCount = s?.giftCount ?? 0;
    const recentGiftCount = s?.recentGiftCount ?? 0;
    const averageRating = s?.averageRating ?? 0;
    const totalRatings = s?.totalRatings ?? 0;
    const rankScore = calcRankScore(
      giftCount,
      averageRating,
      recentGiftCount,
      totalRatings,
      maxGifts,
      maxRecent
    );

    return {
      symbol: etf.symbol,
      name: etf.name,
      category: etf.category,
      description: etf.description,
      rank: 0,
      giftCount,
      recentGiftCount,
      averageRating,
      senderAverageRating: s?.senderAverageRating ?? 0,
      receiverAverageRating: s?.receiverAverageRating ?? 0,
      totalRatings,
      rankScore: round2(rankScore),
      trend: getTrend(recentGiftCount, giftCount),
      price: etf.price,
      changePercent: etf.changePercent,
    };
  });

  ranked.sort((a, b) => b.rankScore - a.rankScore);
  return ranked.slice(0, limit).map((etf, idx) => ({ ...etf, rank: idx + 1 }));
}

export async function getTopCategories(limit = 10): Promise<CategoryRanking[]> {
  const catalog = getAllETFs();
  const stats = await buildSymbolStats();

  interface CatAccumulator {
    giftCount: number;
    recentGiftCount: number;
    ratingSum: number;
    ratingCount: number;
    senderSum: number;
    senderCount: number;
    receiverSum: number;
    receiverCount: number;
  }

  const byCategory = new Map<string, CatAccumulator>();

  for (const etf of catalog) {
    const s = stats.get(etf.symbol.toUpperCase());
    if (!s) continue;

    let acc = byCategory.get(etf.category);
    if (!acc) {
      acc = {
        giftCount: 0,
        recentGiftCount: 0,
        ratingSum: 0,
        ratingCount: 0,
        senderSum: 0,
        senderCount: 0,
        receiverSum: 0,
        receiverCount: 0,
      };
      byCategory.set(etf.category, acc);
    }

    acc.giftCount += s.giftCount;
    acc.recentGiftCount += s.recentGiftCount;
    acc.ratingSum += s.averageRating * s.totalRatings;
    acc.ratingCount += s.totalRatings;
    // sender/receiver averages weighted by total ratings on the symbol as a proxy
    if (s.senderAverageRating > 0) {
      acc.senderSum += s.senderAverageRating * s.totalRatings;
      acc.senderCount += s.totalRatings;
    }
    if (s.receiverAverageRating > 0) {
      acc.receiverSum += s.receiverAverageRating * s.totalRatings;
      acc.receiverCount += s.totalRatings;
    }
  }

  // Ensure every catalog category is represented, even with zero activity.
  for (const category of new Set(catalog.map((e) => e.category))) {
    if (!byCategory.has(category)) {
      byCategory.set(category, {
        giftCount: 0,
        recentGiftCount: 0,
        ratingSum: 0,
        ratingCount: 0,
        senderSum: 0,
        senderCount: 0,
        receiverSum: 0,
        receiverCount: 0,
      });
    }
  }

  let maxGifts = 0;
  let maxRecent = 0;
  for (const acc of byCategory.values()) {
    if (acc.giftCount > maxGifts) maxGifts = acc.giftCount;
    if (acc.recentGiftCount > maxRecent) maxRecent = acc.recentGiftCount;
  }

  const ranked: CategoryRanking[] = [...byCategory.entries()].map(([category, acc]) => {
    const averageRating = acc.ratingCount > 0 ? acc.ratingSum / acc.ratingCount : 0;
    const senderAverageRating = acc.senderCount > 0 ? acc.senderSum / acc.senderCount : 0;
    const receiverAverageRating = acc.receiverCount > 0 ? acc.receiverSum / acc.receiverCount : 0;
    const rankScore = calcRankScore(
      acc.giftCount,
      averageRating,
      acc.recentGiftCount,
      acc.ratingCount,
      maxGifts,
      maxRecent
    );

    return {
      category,
      rank: 0,
      giftCount: acc.giftCount,
      recentGiftCount: acc.recentGiftCount,
      averageRating: round2(averageRating),
      senderAverageRating: round2(senderAverageRating),
      receiverAverageRating: round2(receiverAverageRating),
      totalRatings: acc.ratingCount,
      rankScore: round2(rankScore),
      trend: getTrend(acc.recentGiftCount, acc.giftCount),
    };
  });

  ranked.sort((a, b) => b.rankScore - a.rankScore);
  return ranked.slice(0, limit).map((cat, idx) => ({ ...cat, rank: idx + 1 }));
}

export async function getTopETFsByCategory(
  category: string,
  limit = 10
): Promise<CategoryETFsResponse> {
  const all = await getTopETFs(Number.MAX_SAFE_INTEGER);
  const filtered = all
    .filter((etf) => etf.category.toLowerCase() === category.toLowerCase())
    .slice(0, limit)
    .map((etf, idx) => ({ ...etf, rank: idx + 1 }));

  return {
    category: filtered[0]?.category ?? category,
    topETFs: filtered,
  };
}

export async function getFullRankings(): Promise<RankingsResponse> {
  const [topCategories, topETFs] = await Promise.all([
    getTopCategories(),
    getTopETFs(),
  ]);

  return {
    topCategories,
    topETFs,
    updatedAt: new Date(),
  };
}
