"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionStatus = getSubscriptionStatus;
exports.createSubscription = createSubscription;
exports.cancelSubscription = cancelSubscription;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');
const prisma_client_1 = require("../../shared/db/prisma.client");
const http_errors_1 = require("../../shared/errors/http-errors");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
async function getOrCreateStripeCustomer(userId) {
    const user = await prisma_client_1.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.stripeCustomerId)
        return user.stripeCustomerId;
    const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId },
    });
    await prisma_client_1.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
    });
    return customer.id;
}
async function getSubscriptionStatus(userId) {
    const user = await prisma_client_1.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const sub = await prisma_client_1.prisma.subscription.findUnique({ where: { userId } });
    return {
        plan: user.subscriptionStatus,
        status: sub?.status ?? 'active',
        currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
        stripeSubscriptionId: sub?.stripeSubscriptionId ?? null,
    };
}
async function createSubscription(userId, dto) {
    const user = await prisma_client_1.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.subscriptionStatus === 'PRO') {
        throw new http_errors_1.BadRequestError('Ya tienes una suscripción PRO activa.');
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
    await prisma_client_1.prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: plan },
    });
    await prisma_client_1.prisma.subscription.upsert({
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
async function cancelSubscription(userId) {
    const sub = await prisma_client_1.prisma.subscription.findUnique({ where: { userId } });
    if (!sub || !sub.stripeSubscriptionId) {
        throw new http_errors_1.NotFoundError('No se encontró una suscripción activa.');
    }
    await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
    await prisma_client_1.prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: 'FREE' },
    });
    await prisma_client_1.prisma.subscription.update({
        where: { userId },
        data: { status: 'canceled', plan: 'FREE' },
    });
    return { success: true };
}
//# sourceMappingURL=subscriptions.service.js.map