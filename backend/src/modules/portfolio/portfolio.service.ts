import { prisma } from '../../shared/db/prisma.client';
import { alpacaService } from '../alpaca/alpaca.service';
import { NotFoundError } from '../../shared/errors/http-errors';
import { getAllETFs, getETFBySymbol } from '../etfs/etfs.service';
import type {
  PortfolioResponse,
  HistoryResponse,
  PortfolioOverviewResponse,
  PortfolioInvestmentItem,
} from './portfolio.types';

export async function getPortfolio(giftId: string, userId: string): Promise<PortfolioResponse> {
  const gift = await prisma.gift.findUnique({ where: { id: giftId } });
  if (!gift) throw new NotFoundError('Gift not found');

  const accountId = gift.alpacaAccountId || `mock-${giftId}`;
  const snapshot = await alpacaService.getPortfolio(accountId);

  return {
    giftId,
    ...snapshot,
    symbol: gift.etfSymbol,
  };
}

export async function getPriceHistory(giftId: string, period: string): Promise<HistoryResponse> {
  const gift = await prisma.gift.findUnique({ where: { id: giftId } });
  if (!gift) throw new NotFoundError('Gift not found');

  const validPeriod = ['1D', '1W', '1M', '1Y', 'ALL'].includes(period) ? period : '1M';
  const data = await alpacaService.getPriceHistory(gift.etfSymbol, validPeriod);

  return { period: validPeriod, data };
}

export async function getPortfolioOverview(userId: string): Promise<PortfolioOverviewResponse> {
  // All gifts the user has sent (used for totalGifted aggregate).
  const sentGifts = await prisma.gift.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: 'desc' },
  });

  // Index ETF metadata so we don't loop the catalog per item.
  const etfBySymbol = new Map(getAllETFs().map((e) => [e.symbol, e]));

  // Only INVESTED gifts contribute to balance / investments list.
  const investedGifts = sentGifts.filter((g) => g.status === 'INVESTED');

  const investments: PortfolioInvestmentItem[] = investedGifts.map((gift) => {
    const etf = etfBySymbol.get(gift.etfSymbol) ?? getETFBySymbol(gift.etfSymbol);
    const changePercent = etf?.changePercent ?? 0;
    const currentValue = Number((gift.amount * (1 + changePercent / 100)).toFixed(2));
    const changeAmount = Number((currentValue - gift.amount).toFixed(2));

    return {
      giftId: gift.id,
      recipientName: gift.recipientName,
      etfSymbol: gift.etfSymbol,
      etfName: etf?.name ?? gift.etfSymbol,
      amount: gift.amount,
      currentValue,
      changePercent,
      changeAmount,
      status: gift.status,
    };
  });

  const totalGifted = sentGifts.reduce((acc, g) => acc + g.amount, 0);
  const totalBalance = investments.reduce((acc, i) => acc + i.currentValue, 0);
  const totalInvestedAmount = investments.reduce((acc, i) => acc + i.amount, 0);

  // Weighted average change across all invested gifts.
  const overallChangePercent =
    totalInvestedAmount === 0
      ? 0
      : Number(
          (
            ((totalBalance - totalInvestedAmount) / totalInvestedAmount) *
            100
          ).toFixed(2)
        );

  return {
    totalBalance: Number(totalBalance.toFixed(2)),
    totalGifted: Number(totalGifted.toFixed(2)),
    investments,
    overallChangePercent,
  };
}
