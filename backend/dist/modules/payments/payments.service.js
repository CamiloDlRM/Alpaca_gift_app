"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPaymentIntent = createPaymentIntent;
exports.handleWebhook = handleWebhook;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Stripe = require('stripe');
const prisma_client_1 = require("../../shared/db/prisma.client");
const http_errors_1 = require("../../shared/errors/http-errors");
const event_bus_1 = require("../../shared/events/event-bus");
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
async function createPaymentIntent(userId, dto) {
    const user = await prisma_client_1.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.subscriptionStatus === 'FREE') {
        const giftCount = await prisma_client_1.prisma.gift.count({ where: { senderId: userId } });
        if (giftCount >= 5) {
            throw new http_errors_1.BadRequestError('Has alcanzado el límite de 5 regalos del plan gratuito. Suscríbete a PRO para enviar regalos ilimitados.');
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
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount,
        commission,
        total,
    };
}
async function handleWebhook(rawBody, signature) {
    let event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        throw new http_errors_1.BadRequestError(`Webhook signature verification failed: ${err.message}`);
    }
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const pi = event.data.object;
            const { userId, giftData, commission, giftAmount } = pi.metadata;
            if (!userId || !giftData)
                break;
            const parsedGiftData = JSON.parse(giftData);
            const commissionVal = parseFloat(commission || '0');
            const amountVal = parseFloat(giftAmount || '0');
            // Crear el gift en la base de datos
            const gift = await prisma_client_1.prisma.gift.create({
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
            await prisma_client_1.prisma.payment.create({
                data: {
                    giftId: gift.id,
                    stripePaymentIntentId: pi.id,
                    amount: pi.amount / 100,
                    commission: commissionVal,
                    status: 'SUCCEEDED',
                },
            });
            event_bus_1.eventBus.emit('gift.created', { giftId: gift.id });
            break;
        }
        case 'payment_intent.payment_failed': {
            const pi = event.data.object;
            console.warn(`[payments] PaymentIntent failed: ${pi.id}`);
            // Si hay un gift ya creado con este paymentIntentId, marcarlo como FAILED
            const existingGift = await prisma_client_1.prisma.gift.findFirst({
                where: { paymentIntentId: pi.id },
            });
            if (existingGift) {
                await prisma_client_1.prisma.payment.upsert({
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
            const sub = event.data.object;
            const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
            const user = await prisma_client_1.prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
            if (!user)
                break;
            const isActive = sub.status === 'active' || sub.status === 'trialing';
            const newPlan = isActive ? 'PRO' : 'FREE';
            await prisma_client_1.prisma.user.update({
                where: { id: user.id },
                data: { subscriptionStatus: newPlan },
            });
            await prisma_client_1.prisma.subscription.upsert({
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
            const sub = event.data.object;
            const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
            const user = await prisma_client_1.prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
            if (!user)
                break;
            await prisma_client_1.prisma.user.update({
                where: { id: user.id },
                data: { subscriptionStatus: 'FREE' },
            });
            await prisma_client_1.prisma.subscription.updateMany({
                where: { userId: user.id },
                data: { status: 'canceled', plan: 'FREE' },
            });
            break;
        }
        case 'invoice.payment_succeeded': {
            const invoice = event.data.object;
            const subId = typeof invoice.subscription === 'string'
                ? invoice.subscription
                : invoice.subscription?.id;
            if (subId) {
                const stripeSub = await stripe.subscriptions.retrieve(subId);
                await prisma_client_1.prisma.subscription.updateMany({
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
            const invoice = event.data.object;
            console.warn(`[payments] Invoice payment failed for customer: ${invoice.customer}`);
            break;
        }
        default:
            break;
    }
}
//# sourceMappingURL=payments.service.js.map