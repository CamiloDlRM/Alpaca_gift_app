import { prisma } from '../../shared/db/prisma.client';
import { NotFoundError, BadRequestError } from '../../shared/errors/http-errors';
import { fetchCurrentPrice, fetchPriceHistory } from '../market-data/market-data.service';
import { alpacaService } from '../alpaca/alpaca.service';
import { getAllETFs } from '../etfs/etfs.service';
import {
  RecipientPortfolioResponse,
  SellRequestDto,
  SellResponse,
  ConsolidatedPortfolioResponse,
  ConsolidatedPositionItem,
  ConsolidatedGiftItem,
} from './recipient.types';

export async function getRecipientPortfolio(claimToken: string): Promise<RecipientPortfolioResponse> {
  const gift = await prisma.gift.findUnique({ where: { claimToken } });

  if (!gift) throw new NotFoundError('Regalo no encontrado.');
  if (gift.status !== 'INVESTED' && gift.status !== 'REDEEMED') {
    throw new BadRequestError('Este regalo aún no está invertido.');
  }

  // Fetch real current price from Yahoo Finance
  let currentPrice: number;
  try {
    currentPrice = await fetchCurrentPrice(gift.etfSymbol);
  } catch {
    // Fallback: use invested amount as current value if market data unavailable
    currentPrice = gift.amount;
  }

  // Calculate shares based on amount invested and price at investment time
  // We approximate purchase price using 1M history first bar, or current price
  let purchasePrice = currentPrice;
  try {
    const history = await fetchPriceHistory(gift.etfSymbol, '1M');
    if (history.length > 0) {
      // Find the bar closest to the investment date
      const investedAt = gift.updatedAt.getTime();
      const closest = history.reduce((prev, curr) => {
        const prevDiff = Math.abs(new Date(prev.date).getTime() - investedAt);
        const currDiff = Math.abs(new Date(curr.date).getTime() - investedAt);
        return currDiff < prevDiff ? curr : prev;
      });
      purchasePrice = closest.value;
    }
  } catch { /* use currentPrice as fallback */ }

  const shares = purchasePrice > 0 ? gift.amount / purchasePrice : 0;

  // If gift was already redeemed and we persisted the sell amount, use that exact value.
  const isRedeemed = gift.status === 'REDEEMED';
  const totalValue = isRedeemed && gift.redeemedAmount != null
    ? gift.redeemedAmount
    : shares * currentPrice;

  const gainLoss = totalValue - gift.amount;
  const gainLossPercent = gift.amount > 0 ? (gainLoss / gift.amount) * 100 : 0;

  const investedAt = gift.updatedAt.toISOString();

  const transactions: { date: string; type: 'BUY' | 'SELL' | 'DIVIDEND'; shares: number; pricePerShare: number; total: number }[] = [
    {
      date: investedAt,
      type: 'BUY',
      shares,
      pricePerShare: purchasePrice,
      total: gift.amount,
    },
  ];

  if (isRedeemed && gift.redeemedAmount != null) {
    transactions.push({
      date: gift.updatedAt.toISOString(),
      type: 'SELL',
      shares,
      pricePerShare: shares > 0 ? gift.redeemedAmount / shares : 0,
      total: gift.redeemedAmount,
    });
  }

  return {
    giftId: gift.id,
    recipientName: gift.recipientName,
    etfSymbol: gift.etfSymbol,
    occasion: gift.occasion,
    totalValue,
    gainLoss,
    gainLossPercent,
    shares,
    investedAt,
    isRedeemed,
    redeemedAmount: gift.redeemedAmount ?? undefined,
    transactions,
  };
}

export async function getRecipientHistory(claimToken: string, period: string) {
  const gift = await prisma.gift.findUnique({ where: { claimToken } });
  if (!gift) throw new NotFoundError('Regalo no encontrado.');

  const validPeriod = ['1D', '1W', '1M', '1Y', 'ALL'].includes(period) ? period : '1M';

  let data: { date: string; value: number }[] = [];
  try {
    data = await fetchPriceHistory(gift.etfSymbol, validPeriod);
  } catch { /* fallback to empty */ }

  return { period: validPeriod, data };
}

export async function sellRecipientInvestment(
  claimToken: string,
  _dto: SellRequestDto
): Promise<SellResponse> {
  const gift = await prisma.gift.findUnique({ where: { claimToken } });

  if (!gift) throw new NotFoundError('Regalo no encontrado.');
  if (gift.status === 'REDEEMED') {
    throw new BadRequestError('Esta inversión ya fue vendida.');
  }
  if (gift.status !== 'INVESTED') {
    throw new BadRequestError('Este regalo aún no está disponible para venta.');
  }

  // Obtener valor actual antes de vender
  const accountId = gift.alpacaAccountId || `mock-${gift.id}`;
  const snapshot = await alpacaService.getPortfolio(accountId);
  const amountReturned = snapshot.totalValue;

  // Persistir monto y marcar como REDEEMED
  await prisma.gift.update({
    where: { id: gift.id },
    data: { status: 'REDEEMED', redeemedAmount: amountReturned },
  });

  return {
    success: true,
    amountReturned,
    message:
      'Tu inversión ha sido vendida exitosamente. El monto será transferido en 1-3 días hábiles.',
  };
}

export async function getConsolidatedRecipientPortfolio(
  userEmail: string
): Promise<ConsolidatedPortfolioResponse> {
  const gifts = await prisma.gift.findMany({
    where: {
      recipientEmail: userEmail.toLowerCase().trim(),
      status: { in: ['INVESTED', 'REDEEMED'] },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Build a map of ETF metadata for quick lookup
  const etfMap = new Map(getAllETFs().map((e) => [e.symbol, e]));

  // Compute current value for each gift
  const positionMap = new Map<string, ConsolidatedPositionItem>();

  for (const gift of gifts) {
    const isRedeemed = gift.status === 'REDEEMED';
    const etf = etfMap.get(gift.etfSymbol);
    const changePercent = etf?.changePercent ?? 0;

    // Use persisted redeemedAmount for sold gifts, otherwise compute from market
    const currentValue = isRedeemed && gift.redeemedAmount != null
      ? gift.redeemedAmount
      : Number((gift.amount * (1 + changePercent / 100)).toFixed(2));

    const gainLoss = Number((currentValue - gift.amount).toFixed(2));
    const gainLossPercent = gift.amount > 0
      ? Number(((gainLoss / gift.amount) * 100).toFixed(2))
      : 0;

    const giftItem: ConsolidatedGiftItem = {
      giftId: gift.id,
      claimToken: gift.claimToken,
      occasion: gift.occasion,
      amountInvested: gift.amount,
      currentValue,
      gainLoss,
      gainLossPercent,
      investedAt: gift.updatedAt.toISOString(),
      isRedeemed,
      redeemedAmount: gift.redeemedAmount ?? undefined,
    };

    const existing = positionMap.get(gift.etfSymbol);
    if (existing) {
      existing.gifts.push(giftItem);
      existing.totalInvested = Number((existing.totalInvested + gift.amount).toFixed(2));
      existing.totalCurrentValue = Number((existing.totalCurrentValue + currentValue).toFixed(2));
    } else {
      positionMap.set(gift.etfSymbol, {
        etfSymbol: gift.etfSymbol,
        etfName: etf?.name ?? gift.etfSymbol,
        totalInvested: gift.amount,
        totalCurrentValue: currentValue,
        gainLoss: 0,
        gainLossPercent: 0,
        changePercent,
        gifts: [giftItem],
      });
    }
  }

  // Compute per-position gain/loss
  const positions: ConsolidatedPositionItem[] = [];
  for (const pos of positionMap.values()) {
    pos.gainLoss = Number((pos.totalCurrentValue - pos.totalInvested).toFixed(2));
    pos.gainLossPercent = pos.totalInvested > 0
      ? Number(((pos.gainLoss / pos.totalInvested) * 100).toFixed(2))
      : 0;
    positions.push(pos);
  }

  // Sort: active first, then redeemed; by ETF symbol within group
  positions.sort((a, b) => {
    const aAllRedeemed = a.gifts.every((g) => g.isRedeemed);
    const bAllRedeemed = b.gifts.every((g) => g.isRedeemed);
    if (aAllRedeemed !== bAllRedeemed) return aAllRedeemed ? 1 : -1;
    return a.etfSymbol.localeCompare(b.etfSymbol);
  });

  const totalInvested = Number(positions.reduce((s, p) => s + p.totalInvested, 0).toFixed(2));
  const totalCurrentValue = Number(positions.reduce((s, p) => s + p.totalCurrentValue, 0).toFixed(2));
  const totalGainLoss = Number((totalCurrentValue - totalInvested).toFixed(2));
  const totalGainLossPercent = totalInvested > 0
    ? Number(((totalGainLoss / totalInvested) * 100).toFixed(2))
    : 0;

  return { totalInvested, totalCurrentValue, totalGainLoss, totalGainLossPercent, positions };
}

export async function getConsolidatedPortfolioHistory(
  userEmail: string,
  period: string
): Promise<{
  period: string;
  data: { date: string; value: number }[];
  totalInvested: number;
  totalCurrentValue: number;
}> {
  const { positions, totalInvested, totalCurrentValue } =
    await getConsolidatedRecipientPortfolio(userEmail);

  const validPeriod = ['1D', '1W', '1M', '1Y', 'ALL'].includes(period) ? period : '1M';

  // Active positions = those where NOT all gifts are redeemed
  const activePositions = positions.filter((p) => !p.gifts.every((g) => g.isRedeemed));

  if (activePositions.length === 0) {
    return { period: validPeriod, data: [], totalInvested, totalCurrentValue };
  }

  // Unique ETF symbols from active positions
  const symbols = [...new Set(activePositions.map((p) => p.etfSymbol))];

  // Fetch price history in parallel; catch per-symbol errors and store empty array
  const histories = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const hist = await fetchPriceHistory(symbol, validPeriod);
        return [symbol, hist] as const;
      } catch {
        return [symbol, [] as { date: string; value: number }[]] as const;
      }
    })
  );
  const historyMap = new Map(histories);

  // Reference symbol = first symbol with non-empty history
  const referenceSymbol = symbols.find((s) => (historyMap.get(s)?.length ?? 0) > 0);
  if (!referenceSymbol) {
    return { period: validPeriod, data: [], totalInvested, totalCurrentValue };
  }

  const timeline = historyMap.get(referenceSymbol) ?? [];

  const data: { date: string; value: number }[] = timeline.map((refPoint, i) => {
    let totalValue = 0;

    for (const position of activePositions) {
      const hist = historyMap.get(position.etfSymbol) ?? [];
      const histPoint = hist[i];
      const lastValue = hist[hist.length - 1]?.value;
      if (!histPoint || !lastValue || lastValue === 0) continue;

      const scaledValue = (histPoint.value / lastValue) * position.totalCurrentValue;
      totalValue += scaledValue;
    }

    return { date: refPoint.date, value: Number(totalValue.toFixed(2)) };
  });

  return { period: validPeriod, data, totalInvested, totalCurrentValue };
}
