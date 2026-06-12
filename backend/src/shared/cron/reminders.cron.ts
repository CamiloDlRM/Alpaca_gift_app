import cron from 'node-cron';
import { prisma } from '../db/prisma.client';
import { sendImportantDateReminderEmail, sendFavoriteScheduleReminderEmail } from '../email/email.service';

// Returns the number of whole days from `today` until the next occurrence of month/day.
// Handles year wrap-around (e.g. a Dec 31 date when today is Jan 1).
function daysUntilNextOccurrence(today: Date, month: number, day: number): number {
  const t = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let target = new Date(Date.UTC(today.getUTCFullYear(), month - 1, day));
  if (target < t) {
    target = new Date(Date.UTC(today.getUTCFullYear() + 1, month - 1, day));
  }
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target.getTime() - t.getTime()) / msPerDay);
}

function isSameUTCDate(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

// ── Important Date Reminders — daily at 8:00 AM UTC ──────────────────────────
// Emails the user when an important date is exactly `remindDaysBefore` days away.
cron.schedule('0 8 * * *', async () => {
  try {
    const today = new Date();
    const dates = await prisma.importantDate.findMany({ include: { user: true } });

    let sent = 0;
    for (const d of dates) {
      const daysUntil = daysUntilNextOccurrence(today, d.month, d.day);
      if (daysUntil !== d.remindDaysBefore) continue;
      try {
        await sendImportantDateReminderEmail({
          userEmail: d.user.email,
          userName: d.user.name,
          personName: d.personName,
          label: d.label,
          daysUntil,
          personEmail: d.personEmail ?? undefined,
        });
        sent++;
      } catch (err) {
        console.error(`[CRON] important-date reminder failed for ${d.id}:`, err);
      }
    }

    if (sent > 0) console.log(`[CRON] Sent ${sent} important-date reminder(s)`);
  } catch (err) {
    console.error('[CRON] important-date reminders error:', err);
  }
});

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
