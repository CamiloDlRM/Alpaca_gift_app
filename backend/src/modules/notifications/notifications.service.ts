import type { NotificationPayload } from './notifications.types';
import { eventBus, EVENTS } from '../../shared/events/event-bus';

export function sendNotification(payload: NotificationPayload): void {
  console.log(`[NOTIFICATION] type=${payload.type} to=${payload.to}`, payload.data);
}

// Listen to events and stub-send notifications
eventBus.on<{ giftId: string }>(EVENTS.GIFT_CREATED, ({ giftId }) => {
  sendNotification({ type: 'gift_created', to: 'sender@example.com', data: { giftId } });
});

eventBus.on<{ giftId: string }>(EVENTS.ETF_PURCHASED, ({ giftId }) => {
  sendNotification({ type: 'invested', to: 'recipient@example.com', data: { giftId } });
});
