import cron from 'node-cron';
import { prisma } from '../db/prisma.client';
import { sendFavoriteScheduleReminderEmail } from '../email/email.service';

function isSameUTCDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

// ── Auto Favorites Gifting reminder — daily at 9:00 AM UTC ───────────────────
// Auto-charging a saved card raises compliance concerns, so instead of creating
// a gift+payment automatically we email the user a pre-filled "send it now" link.
// lastSentAt provides idempotency so a schedule fires at most once per day.
cron.schedule('0 9 * * *', async () => {
  try {
    const today = new Date();
    const schedules = await prisma.favoriteSchedule.findMany({
      where: { month: today.getUTCMonth() + 1, day: today.getUTCDate() },
      include: { favoriteRecipient: { include: { user: true } } },
    });

    let sent = 0;
    for (const s of schedules) {
      if (s.lastSentAt && isSameUTCDate(s.lastSentAt, today)) continue;
      const fav = s.favoriteRecipient;
      if (!fav?.user) continue;
      try {
        await sendFavoriteScheduleReminderEmail({
          userEmail: fav.user.email,
          userName: fav.user.name,
          recipientName: fav.recipientName,
          recipientEmail: fav.recipientEmail,
          etfSymbol: fav.etfSymbol,
          amount: fav.amount,
          label: s.label ?? undefined,
        });
        await prisma.favoriteSchedule.update({
          where: { id: s.id },
          data: { lastSentAt: today },
        });
        sent++;
      } catch (err) {
        console.error(`[CRON] favorite-schedule reminder failed for ${s.id}:`, err);
      }
    }

    if (sent > 0) console.log(`[CRON] Sent ${sent} favorite-schedule reminder(s)`);
  } catch (err) {
    console.error('[CRON] favorite-schedule reminders error:', err);
  }
});
