import cron from 'node-cron';
import { prisma } from '../db/prisma.client';
import { sendGiftReceivedEmail, sendGiftInvitationEmail } from '../email/email.service';
import { isEmailRegistered } from '../../modules/auth/auth.service';

// Runs every day at 9:00 AM UTC.
// Finds scheduled gifts whose delivery date has arrived and sends the claim link email.
cron.schedule('0 9 * * *', async () => {
  try {
    const now = new Date();
    const gifts = await prisma.gift.findMany({
      where: {
        deliveryDate: { not: null, lte: now },
        claimEmailSentAt: null,
        recipientEmail: { not: null },
        status: 'PENDING',
      },
      include: { sender: true },
    });

    for (const gift of gifts) {
      if (!gift.recipientEmail || !gift.sender) continue;
      try {
        const emailPayload = {
          recipientEmail: gift.recipientEmail,
          recipientName: gift.recipientName,
          senderName: gift.sender.name,
          amount: gift.amount,
          etfSymbol: gift.etfSymbol,
          occasion: gift.occasion,
          claimToken: gift.claimToken,
        };
        const registered = await isEmailRegistered(gift.recipientEmail);
        if (registered) {
          await sendGiftReceivedEmail(emailPayload);
        } else {
          await sendGiftInvitationEmail(emailPayload);
        }
        await prisma.gift.update({
          where: { id: gift.id },
          data: { claimEmailSentAt: now },
        });
      } catch (err) {
        console.error(`[CRON] Failed to send delivery email for gift ${gift.id}:`, err);
      }
    }

    if (gifts.length > 0) {
      console.log(`[CRON] Sent ${gifts.length} scheduled gift delivery email(s)`);
    }
  } catch (err) {
    console.error('[CRON] gift-delivery error:', err);
  }
});
