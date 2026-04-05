// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');
import { prisma } from '../../shared/db/prisma.client';
import { BadRequestError } from '../../shared/errors/http-errors';
import { eventBus } from '../../shared/events/event-bus';
import { CreatePaymentIntentDto, PaymentIntentResponse } from './payments.types';

const stripe = Stripe(process.env.STRIPE_SECRET_KEY!);

async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function createPaymentIntent(
  userId: string,
  dto: CreatePaymentIntentDto
): Promise<PaymentIntentResponse> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.subscriptionStatus === 'FREE') {
    const giftCount = await prisma.gift.count({ where: { senderId: userId } });
    if (giftCount >= 5) {
      throw new BadRequestError(
        'Has alcanzado el límite de 5 regalos del plan gratuito. Suscríbete a PRO para enviar regalos ilimitados.'
      );
    }
  }

  const amount = dto.giftData.amount;
  const commission = user.subscriptionStatus === 'FREE' ? amount * 0.025 : 0;
  const total = amount + commission;

  const customerId = await getOrCreateStripeCustomer(userId);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(total * 100),
    currency: 'usd',
    customer: customerId,
    metadata: {
      userId,
      giftData: JSON.stringify(dto.giftData),
      commission: commission.toString(),
      giftAmount: amount.toString(),
    },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    amount,
    commission,
    total,
  };
}

export async function confirmGift(
  userId: string,
  paymentIntentId: string
): Promise<{ giftId: string; claimToken: string; claimLink: string }> {
  // Check if gift was already created by webhook (idempotent)
  const existing = await prisma.gift.findFirst({ where: { paymentIntentId } });
  if (existing) return {
    giftId: existing.id,
    claimToken: existing.claimToken,
    claimLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/claim/${existing.claimToken}`,
  };

  // Retrieve and verify PaymentIntent from Stripe
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (pi.status !== 'succeeded') {
    throw new BadRequestError('El pago aún no ha sido confirmado.');
  }

  const { giftData, commission, giftAmount } = pi.metadata as Record<string, string>;

  if (!giftData) throw new BadRequestError('Datos del regalo no encontrados en el pago.');

  const parsedGiftData = JSON.parse(giftData);
  const commissionVal = parseFloat(commission || '0');
  const amountVal = parseFloat(giftAmount || '0');

  const gift = await prisma.gift.create({
    data: {
      senderId: userId,
      recipientName: parsedGiftData.recipientName,
      occasion: parsedGiftData.occasion,
      etfSymbol: parsedGiftData.etfSymbol,
      amount: amountVal,
      commission: commissionVal,
      note: parsedGiftData.note || null,
      deliveryDate: new Date(parsedGiftData.deliveryDate),
      recipientEmail: parsedGiftData.recipientEmail || null,
      paymentIntentId: pi.id,
      status: 'PENDING',
    },
  });

  await prisma.payment.create({
    data: {
      giftId: gift.id,
      stripePaymentIntentId: pi.id,
      amount: pi.amount / 100,
      commission: commissionVal,
      status: 'SUCCEEDED',
    },
  });

  eventBus.emit('gift.created', { giftId: gift.id });
  return {
    giftId: gift.id,
    claimToken: gift.claimToken,
    claimLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/claim/${gift.claimToken}`,
  };
}

export async function handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    throw new BadRequestError(`Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as any;
      const { userId, giftData, commission, giftAmount } = pi.metadata;

      if (!userId || !giftData) break;

      const parsedGiftData = JSON.parse(giftData);
      const commissionVal = parseFloat(commission || '0');
      const amountVal = parseFloat(giftAmount || '0');

      // Crear el gift en la base de datos
      const gift = await prisma.gift.create({
        data: {
          senderId: userId,
          recipientName: parsedGiftData.recipientName,
          occasion: parsedGiftData.occasion,
          etfSymbol: parsedGiftData.etfSymbol,
          amount: amountVal,
          commission: commissionVal,
          note: parsedGiftData.note || null,
          deliveryDate: new Date(parsedGiftData.deliveryDate),
          recipientEmail: parsedGiftData.recipientEmail || null,
          paymentIntentId: pi.id,
          status: 'PENDING',
        },
      });

      // Crear registro de pago
      await prisma.payment.create({
        data: {
          giftId: gift.id,
          stripePaymentIntentId: pi.id,
          amount: pi.amount / 100,
          commission: commissionVal,
          status: 'SUCCEEDED',
        },
      });

      eventBus.emit('gift.created', { giftId: gift.id });
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as any;
      console.warn(`[payments] PaymentIntent failed: ${pi.id}`);

      // Si hay un gift ya creado con este paymentIntentId, marcarlo como FAILED
      const existingGift = await prisma.gift.findFirst({
        where: { paymentIntentId: pi.id },
      });

      if (existingGift) {
        await prisma.payment.upsert({
          where: { stripePaymentIntentId: pi.id },
          create: {
            giftId: existingGift.id,
            stripePaymentIntentId: pi.id,
            amount: pi.amount / 100,
            commission: 0,
            status: 'FAILED',
          },
          update: { status: 'FAILED' },
        });
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as any;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
      if (!user) break;

      const isActive = sub.status === 'active' || sub.status === 'trialing';
      const newPlan = isActive ? 'PRO' : 'FREE';

      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: newPlan },
      });

      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          plan: newPlan,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: customerId,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
        update: {
          plan: newPlan,
          stripeSubscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

      const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
      if (!user) break;

      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: 'FREE' },
      });

      await prisma.subscription.updateMany({
        where: { userId: user.id },
        data: { status: 'canceled', plan: 'FREE' },
      });
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as any;
      const subId = typeof invoice.subscription === 'string'
        ? invoice.subscription
        : invoice.subscription?.id;

      if (subId) {
        const stripeSub = await stripe.subscriptions.retrieve(subId);
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subId },
          data: {
            status: stripeSub.status,
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          },
        });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as any;
      console.warn(`[payments] Invoice payment failed for customer: ${invoice.customer}`);
      break;
    }

    default:
      break;
  }
}
