import { prisma } from '../../shared/db/prisma.client';
import { alpacaService } from '../alpaca/alpaca.service';
import { NotFoundError } from '../../shared/errors/http-errors';
import type { PortfolioResponse, HistoryResponse } from './portfolio.types';

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
