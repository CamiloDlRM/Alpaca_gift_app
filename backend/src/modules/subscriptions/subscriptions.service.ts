// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');
import { prisma } from '../../shared/db/prisma.client';
import { BadRequestError, NotFoundError } from '../../shared/errors/http-errors';
import { CreateSubscriptionDto, SubscriptionStatusResponse } from './subscriptions.types';

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

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatusResponse> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const sub = await prisma.subscription.findUnique({ where: { userId } });

  return {
    plan: user.subscriptionStatus as 'FREE' | 'PRO',
    status: sub?.status ?? 'active',
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
    stripeSubscriptionId: sub?.stripeSubscriptionId ?? null,
  };
}

export async function createSubscription(
  userId: string,
  dto: CreateSubscriptionDto
): Promise<SubscriptionStatusResponse> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.subscriptionStatus === 'PRO') {
    throw new BadRequestError('Ya tienes una suscripción PRO activa.');
  }

  const customerId = await getOrCreateStripeCustomer(userId);

  // Attach payment method to customer
  await stripe.paymentMethods.attach(dto.paymentMethodId, { customer: customerId });

  // Set as default payment method
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: dto.paymentMethodId },
  });

  // Create a price inline for $9.99/month
  const price = await stripe.prices.create({
    unit_amount: 999,
    currency: 'usd',
    recurring: { interval: 'month' },
    product_data: { name: 'WealthGift PRO' },
  });

  // Create subscription
  const stripeSub = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: price.id }],
    default_payment_method: dto.paymentMethodId,
    metadata: { userId },
  });

  const isActive = stripeSub.status === 'active' || stripeSub.status === 'trialing';
  const plan = isActive ? 'PRO' : 'FREE';

  // Update user and subscription in DB
  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionStatus: plan },
  });

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan,
      stripeSubscriptionId: stripeSub.id,
      stripeCustomerId: customerId,
      status: stripeSub.status,
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    },
    update: {
      plan,
      stripeSubscriptionId: stripeSub.id,
      status: stripeSub.status,
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    },
  });

  return {
    plan,
    status: stripeSub.status,
    currentPeriodEnd: new Date(stripeSub.current_period_end * 1000).toISOString(),
    stripeSubscriptionId: stripeSub.id,
  };
}

export async function cancelSubscription(userId: string): Promise<{ success: boolean }> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub || !sub.stripeSubscriptionId) {
    throw new NotFoundError('No se encontró una suscripción activa.');
  }

  await stripe.subscriptions.cancel(sub.stripeSubscriptionId);

  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionStatus: 'FREE' },
  });

  await prisma.subscription.update({
    where: { userId },
    data: { status: 'canceled', plan: 'FREE' },
  });

  return { success: true };
}
