import { prisma } from '../../shared/db/prisma.client';
import { NotFoundError, BadRequestError } from '../../shared/errors/http-errors';
import { alpacaService } from '../alpaca/alpaca.service';
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

  const accountId = gift.alpacaAccountId || `mock-${gift.id}`;
  const snapshot = await alpacaService.getPortfolio(accountId);

  const investedAt = gift.updatedAt.toISOString();
  const pricePerShare = snapshot.shares > 0 ? snapshot.totalValue / snapshot.shares : 0;

  const transactions = [
    {
      date: investedAt,
      type: 'BUY' as const,
      shares: snapshot.shares,
      pricePerShare,
      total: gift.amount,
    },
  ];

  return {
    giftId: gift.id,
    recipientName: gift.recipientName,
    etfSymbol: gift.etfSymbol,
    occasion: gift.occasion,
    totalValue: snapshot.totalValue,
    gainLoss: snapshot.gainLoss,
    gainLossPercent: snapshot.gainLossPercent,
    shares: snapshot.shares,
    investedAt,
    isRedeemed: gift.status === 'REDEEMED',
    transactions,
  };
}

export async function getRecipientHistory(claimToken: string, period: string) {
  const gift = await prisma.gift.findUnique({ where: { claimToken } });
  if (!gift) throw new NotFoundError('Regalo no encontrado.');

  const validPeriod = ['1D', '1W', '1M', '1Y', 'ALL'].includes(period) ? period : '1M';
  const data = await alpacaService.getPriceHistory(gift.etfSymbol, validPeriod);

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
