import { prisma } from '../../shared/db/prisma.client';
import { NotFoundError, BadRequestError } from '../../shared/errors/http-errors';
import { fetchCurrentPrice, fetchPriceHistory } from '../market-data/market-data.service';
import {
  RecipientPortfolioResponse,
  SellRequestDto,
  SellResponse,
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
  const totalValue = shares * currentPrice;
  const gainLoss = totalValue - gift.amount;
  const gainLossPercent = gift.amount > 0 ? (gainLoss / gift.amount) * 100 : 0;

  const investedAt = gift.updatedAt.toISOString();

  const transactions = [
    {
      date: investedAt,
      type: 'BUY' as const,
      shares,
      pricePerShare: purchasePrice,
      total: gift.amount,
    },
  ];

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
    isRedeemed: gift.status === 'REDEEMED',
    transactions,
  };
}

export async function getRecipientHistory(claimToken: string, period: string) {
  const gift = await prisma.gift.findUnique({ where: { claimToken } });
  if (!gift) throw new NotFoundError('Regalo no encontrado.');

  const validPeriod = ['1D', '1W', '1M', '1Y', 'ALL'].includes(period) ? period : '1M';

  let data;
  try {
    data = await fetchPriceHistory(gift.etfSymbol, validPeriod);
  } catch {
    data = [];
  }

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

  // Actualizar estado a REDEEMED
  await prisma.gift.update({
    where: { id: gift.id },
    data: { status: 'REDEEMED' },
  });

  return {
    success: true,
    amountReturned,
    message:
      'Tu inversión ha sido vendida exitosamente. El monto será transferido en 1-3 días hábiles.',
  };
}
