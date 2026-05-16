import { eventBus, EVENTS } from '../events/event-bus';
import { prisma } from '../db/prisma.client';
import { sendGiftReceivedEmail, sendGiftClaimedEmail } from './email.service';

eventBus.on<{ giftId: string }>(EVENTS.GIFT_CREATED, async ({ giftId }) => {
  try {
    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
      include: { sender: true },
    });
    // Only send immediately for instant gifts (no deliveryDate).
    // Scheduled gifts are handled by the daily cron job.
    if (!gift?.recipientEmail || !gift.sender || gift.deliveryDate) return;

    await sendGiftReceivedEmail({
      recipientEmail: gift.recipientEmail,
      recipientName: gift.recipientName,
      senderName: gift.sender.name,
      amount: gift.amount,
      etfSymbol: gift.etfSymbol,
      occasion: gift.occasion,
      claimToken: gift.claimToken,
    });

    await prisma.gift.update({
      where: { id: gift.id },
      data: { claimEmailSentAt: new Date() },
    });
  } catch (err) {
    console.error('[EMAIL] gift.created listener error:', err);
  }
});

eventBus.on<{ giftId: string }>(EVENTS.GIFT_CLAIMED, async ({ giftId }) => {
  try {
    const gift = await prisma.gift.findUnique({
      where: { id: giftId },
      include: { sender: true },
    });
    if (!gift?.sender) return;

    await sendGiftClaimedEmail({
      senderEmail: gift.sender.email,
      senderName: gift.sender.name,
      recipientName: gift.recipientName,
      amount: gift.amount,
      etfSymbol: gift.etfSymbol,
    });
  } catch (err) {
    console.error('[EMAIL] gift.claimed listener error:', err);
  }
});
